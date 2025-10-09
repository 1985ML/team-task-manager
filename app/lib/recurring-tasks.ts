import { prisma } from './db'
import cron from 'node-cron'

export interface RecurringTaskConfig {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  interval: number
  daysOfWeek?: number[] // 0-6, Sunday = 0
  dayOfMonth?: number // 1-31
  endDate?: Date
}

export class RecurringTaskService {
  private static cronJobs: Map<string, cron.ScheduledTask> = new Map()

  static async createRecurringTask(
    taskId: string,
    config: RecurringTaskConfig
  ): Promise<void> {
    // Create recurring task series record
    const nextDueDate = this.calculateNextDueDate(new Date(), config)
    
    await prisma.recurringTaskSeries.create({
      data: {
        taskId,
        frequency: config.frequency,
        interval: config.interval,
        daysOfWeek: config.daysOfWeek || [],
        dayOfMonth: config.dayOfMonth,
        endDate: config.endDate,
        nextDueDate,
        active: true
      }
    })

    // Schedule the cron job
    this.scheduleRecurringTask(taskId, config)
  }

  static async updateRecurringTask(
    taskId: string,
    config: Partial<RecurringTaskConfig>
  ): Promise<void> {
    const existing = await prisma.recurringTaskSeries.findUnique({
      where: { taskId }
    })

    if (!existing) {
      throw new Error('Recurring task series not found')
    }

    const updatedConfig = {
      frequency: config.frequency || existing.frequency,
      interval: config.interval || existing.interval,
      daysOfWeek: config.daysOfWeek || existing.daysOfWeek,
      dayOfMonth: config.dayOfMonth || existing.dayOfMonth,
      endDate: config.endDate !== undefined ? config.endDate : existing.endDate
    }

    const nextDueDate = this.calculateNextDueDate(new Date(), updatedConfig as RecurringTaskConfig)

    await prisma.recurringTaskSeries.update({
      where: { taskId },
      data: {
        frequency: updatedConfig.frequency,
        interval: updatedConfig.interval,
        daysOfWeek: updatedConfig.daysOfWeek,
        dayOfMonth: updatedConfig.dayOfMonth,
        endDate: updatedConfig.endDate,
        nextDueDate
      }
    })

    // Reschedule the cron job
    this.stopRecurringTask(taskId)
    this.scheduleRecurringTask(taskId, updatedConfig as RecurringTaskConfig)
  }

  static async stopRecurringTask(taskId: string): Promise<void> {
    // Stop cron job
    const cronJob = this.cronJobs.get(taskId)
    if (cronJob) {
      cronJob.stop()
      this.cronJobs.delete(taskId)
    }

    // Deactivate in database
    await prisma.recurringTaskSeries.updateMany({
      where: { taskId },
      data: { active: false }
    })
  }

  static async generateMissedTasks(): Promise<void> {
    const now = new Date()
    const cutoffDate = new Date()
    cutoffDate.setDate(now.getDate() - 90) // 90-day backfill limit

    const overdueSeries = await prisma.recurringTaskSeries.findMany({
      where: {
        active: true,
        nextDueDate: { lt: now }
      },
      include: {
        task: {
          include: {
            team: true,
            project: true
          }
        }
      }
    })

    for (const series of overdueSeries) {
      let currentDate = new Date(series.nextDueDate)
      let generatedCount = 0
      const maxGenerations = 120 // Safety cap

      while (currentDate < now && generatedCount < maxGenerations && currentDate > cutoffDate) {
        // Check if task already exists for this date
        const existingTask = await prisma.task.findFirst({
          where: {
            title: series.task.title,
            teamId: series.task.teamId,
            projectId: series.task.projectId,
            dueDate: {
              gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()),
              lt: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)
            }
          }
        })

        if (!existingTask) {
          // Create new task instance
          await prisma.task.create({
            data: {
              title: series.task.title,
              description: series.task.description,
              status: 'TODO',
              priority: series.task.priority,
              dueDate: new Date(currentDate),
              teamId: series.task.teamId,
              projectId: series.task.projectId,
              createdById: series.task.createdById,
              position: await this.getNextPosition(series.task.teamId)
            }
          })
        }

        // Calculate next occurrence
        currentDate = this.calculateNextDueDate(currentDate, {
          frequency: series.frequency,
          interval: series.interval,
          daysOfWeek: series.daysOfWeek,
          dayOfMonth: series.dayOfMonth ?? undefined
        })
        
        generatedCount++
      }

      // Update next due date
      await prisma.recurringTaskSeries.update({
        where: { id: series.id },
        data: { nextDueDate: currentDate }
      })
    }
  }

  private static async getNextPosition(teamId: string): Promise<number> {
    const lastTask = await prisma.task.findFirst({
      where: { teamId },
      orderBy: { position: 'desc' }
    })
    return (lastTask?.position || 0) + 1
  }

  private static calculateNextDueDate(
    fromDate: Date,
    config: RecurringTaskConfig
  ): Date {
    const nextDate = new Date(fromDate)

    switch (config.frequency) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + config.interval)
        break

      case 'WEEKLY':
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          // Find next occurrence of specified days
          const currentDay = nextDate.getDay()
          const sortedDays = [...config.daysOfWeek].sort((a, b) => a - b)
          
          let nextDay = sortedDays.find(day => day > currentDay)
          if (!nextDay) {
            // Next week
            nextDay = sortedDays[0]
            nextDate.setDate(nextDate.getDate() + (7 - currentDay + nextDay))
          } else {
            nextDate.setDate(nextDate.getDate() + (nextDay - currentDay))
          }
          
          // Apply interval (skip weeks)
          if (config.interval > 1) {
            nextDate.setDate(nextDate.getDate() + (config.interval - 1) * 7)
          }
        } else {
          nextDate.setDate(nextDate.getDate() + (config.interval * 7))
        }
        break

      case 'MONTHLY':
        if (config.dayOfMonth) {
          nextDate.setMonth(nextDate.getMonth() + config.interval)
          nextDate.setDate(config.dayOfMonth)
          
          // Handle months with fewer days
          if (nextDate.getDate() !== config.dayOfMonth) {
            nextDate.setDate(0) // Last day of previous month
          }
        } else {
          nextDate.setMonth(nextDate.getMonth() + config.interval)
        }
        break
    }

    return nextDate
  }

  private static scheduleRecurringTask(taskId: string, config: RecurringTaskConfig): void {
    let cronExpression: string

    switch (config.frequency) {
      case 'DAILY':
        cronExpression = `0 9 */${config.interval} * *` // 9 AM every N days
        break
      case 'WEEKLY':
        if (config.daysOfWeek && config.daysOfWeek.length > 0) {
          const days = config.daysOfWeek.join(',')
          cronExpression = `0 9 * * ${days}` // 9 AM on specified days
        } else {
          cronExpression = `0 9 * * 1` // Default to Monday
        }
        break
      case 'MONTHLY':
        const day = config.dayOfMonth || 1
        cronExpression = `0 9 ${day} * *` // 9 AM on specified day of month
        break
      default:
        return
    }

    const cronJob = cron.schedule(cronExpression, async () => {
      await this.generateTaskInstance(taskId)
    }, {
      scheduled: true,
      timezone: 'UTC'
    })

    this.cronJobs.set(taskId, cronJob)
  }

  private static async generateTaskInstance(taskId: string): Promise<void> {
    const series = await prisma.recurringTaskSeries.findUnique({
      where: { taskId },
      include: {
        task: true
      }
    })

    if (!series || !series.active) {
      return
    }

    // Check if we've reached the end date
    if (series.endDate && new Date() > series.endDate) {
      await this.stopRecurringTask(taskId)
      return
    }

    const now = new Date()
    
    // Check if task already exists for today
    const existingTask = await prisma.task.findFirst({
      where: {
        title: series.task.title,
        teamId: series.task.teamId,
        projectId: series.task.projectId,
        dueDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        }
      }
    })

    if (!existingTask) {
      // Create new task instance
      await prisma.task.create({
        data: {
          title: series.task.title,
          description: series.task.description,
          status: 'TODO',
          priority: series.task.priority,
          dueDate: now,
          teamId: series.task.teamId,
          projectId: series.task.projectId,
          createdById: series.task.createdById,
          position: await this.getNextPosition(series.task.teamId)
        }
      })
    }

    // Update next due date
    const nextDueDate = this.calculateNextDueDate(now, {
      frequency: series.frequency,
      interval: series.interval,
      daysOfWeek: series.daysOfWeek,
      dayOfMonth: series.dayOfMonth ?? undefined
    })

    await prisma.recurringTaskSeries.update({
      where: { id: series.id },
      data: { nextDueDate }
    })
  }

  static async initializeRecurringTasks(): Promise<void> {
    // Load all active recurring tasks and schedule them
    const activeSeries = await prisma.recurringTaskSeries.findMany({
      where: { active: true }
    })

    for (const series of activeSeries) {
      this.scheduleRecurringTask(series.taskId, {
        frequency: series.frequency,
        interval: series.interval,
        daysOfWeek: series.daysOfWeek,
        dayOfMonth: series.dayOfMonth ?? undefined,
        endDate: series.endDate || undefined
      })
    }

    // Schedule daily cleanup job to generate missed tasks
    cron.schedule('0 1 * * *', async () => { // 1 AM daily
      await this.generateMissedTasks()
    })
  }

  static async getRecurringTaskInfo(taskId: string) {
    return await prisma.recurringTaskSeries.findUnique({
      where: { taskId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            description: true,
            priority: true
          }
        }
      }
    })
  }
}