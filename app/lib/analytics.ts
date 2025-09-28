import { prisma } from './db'

export interface TaskAnalytics {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  completionRate: number
  averageCompletionTime: number
}

export interface TeamPerformance {
  userId: string
  name: string
  email: string
  completedTasks: number
  totalTasks: number
  averageCompletionTime: number
  onTimeCompletionRate: number
  overdueCount: number
}

export interface ProjectAnalytics {
  projectId: string
  projectName: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  averageTaskCompletionTime: number
  status: string
}

export interface TasksByStatus {
  todo: number
  inProgress: number
  review: number
  done: number
}

export interface TasksByPriority {
  low: number
  medium: number
  high: number
  urgent: number
}

export class AnalyticsService {
  static async getTaskAnalytics(
    userId: string,
    teamId?: string,
    projectId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TaskAnalytics> {
    const where: any = {
      team: {
        members: {
          some: { userId }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    const [totalTasks, completedTasks, inProgressTasks, overdueTasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { ...where, status: 'DONE' } }),
      prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.task.count({
        where: {
          ...where,
          status: { not: 'DONE' },
          dueDate: { lt: new Date() }
        }
      })
    ])

    // Calculate average completion time
    const completedTasksWithTimes = await prisma.task.findMany({
      where: {
        ...where,
        status: 'DONE',
        completedAt: { not: null }
      },
      select: {
        createdAt: true,
        completedAt: true
      }
    })

    let averageCompletionTime = 0
    if (completedTasksWithTimes.length > 0) {
      const totalCompletionTime = completedTasksWithTimes.reduce((sum: number, task: any) => {
        const completionTime = task.completedAt!.getTime() - task.createdAt.getTime()
        return sum + completionTime
      }, 0)

      averageCompletionTime = totalCompletionTime / completedTasksWithTimes.length / (1000 * 60 * 60 * 24) // Convert to days
    }

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      completionRate,
      averageCompletionTime
    }
  }

  static async getTeamPerformance(
    userId: string,
    teamId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TeamPerformance[]> {
    const where: any = {
      team: {
        members: {
          some: { userId }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    // Get all team members who have tasks
    const teamMembers = await prisma.user.findMany({
      where: {
        assignedTasks: {
          some: where
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    const performance: TeamPerformance[] = []

    for (const member of teamMembers) {
      const memberWhere = { ...where, assignedToId: member.id }

      const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
        prisma.task.count({ where: memberWhere }),
        prisma.task.count({ where: { ...memberWhere, status: 'DONE' } }),
        prisma.task.count({
          where: {
            ...memberWhere,
            status: { not: 'DONE' },
            dueDate: { lt: new Date() }
          }
        })
      ])

      // Calculate on-time completion rate
      const onTimeCompletedTasks = await prisma.task.count({
        where: {
          ...memberWhere,
          status: 'DONE',
          completedAt: { not: null },
          dueDate: { not: null },
          AND: {
            completedAt: { lte: prisma.task.fields.dueDate }
          }
        }
      })

      const tasksWithDueDate = await prisma.task.count({
        where: {
          ...memberWhere,
          status: 'DONE',
          dueDate: { not: null }
        }
      })

      const onTimeCompletionRate = tasksWithDueDate > 0 
        ? (onTimeCompletedTasks / tasksWithDueDate) * 100 
        : 0

      // Calculate average completion time
      const completedTasksWithTimes = await prisma.task.findMany({
        where: {
          ...memberWhere,
          status: 'DONE',
          completedAt: { not: null }
        },
        select: {
          createdAt: true,
          completedAt: true
        }
      })

      let averageCompletionTime = 0
      if (completedTasksWithTimes.length > 0) {
        const totalCompletionTime = completedTasksWithTimes.reduce((sum, task) => {
          const completionTime = task.completedAt!.getTime() - task.createdAt.getTime()
          return sum + completionTime
        }, 0)

        averageCompletionTime = totalCompletionTime / completedTasksWithTimes.length / (1000 * 60 * 60 * 24)
      }

      performance.push({
        userId: member.id,
        name: member.name || member.email,
        email: member.email,
        completedTasks,
        totalTasks,
        averageCompletionTime,
        onTimeCompletionRate,
        overdueCount: overdueTasks
      })
    }

    return performance.sort((a, b) => b.completedTasks - a.completedTasks)
  }

  static async getProjectAnalytics(
    userId: string,
    teamId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<ProjectAnalytics[]> {
    const where: any = {
      team: {
        members: {
          some: { userId }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    const projects = await prisma.project.findMany({
      where,
      select: {
        id: true,
        name: true,
        status: true,
        tasks: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            completedAt: true
          }
        }
      }
    })

    return projects.map(project => {
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Calculate average task completion time
      const completedTasksWithTimes = project.tasks.filter(
        task => task.status === 'DONE' && task.completedAt
      )

      let averageTaskCompletionTime = 0
      if (completedTasksWithTimes.length > 0) {
        const totalCompletionTime = completedTasksWithTimes.reduce((sum, task) => {
          const completionTime = task.completedAt!.getTime() - task.createdAt.getTime()
          return sum + completionTime
        }, 0)
        
        averageTaskCompletionTime = totalCompletionTime / completedTasksWithTimes.length / (1000 * 60 * 60 * 24)
      }

      return {
        projectId: project.id as string,
        projectName: project.name as string,
        totalTasks: totalTasks as number,
        completedTasks: completedTasks as number,
        completionRate: completionRate as number,
        averageTaskCompletionTime: averageTaskCompletionTime as number,
        status: project.status as string
      } as {
        projectId: string;
        projectName: string;
        totalTasks: number;
        completedTasks: number;
        completionRate: number;
        averageTaskCompletionTime: number;
        status: string;
      }
    })
  }

  static async getTasksByStatus(
    userId: string,
    teamId?: string,
    projectId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TasksByStatus> {
    const where: any = {
      team: {
        members: {
          some: { userId }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    const [todo, inProgress, review, done] = await Promise.all([
      prisma.task.count({ where: { ...where, status: 'TODO' } }),
      prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { ...where, status: 'REVIEW' } }),
      prisma.task.count({ where: { ...where, status: 'DONE' } })
    ])

    return { todo, inProgress, review, done }
  }

  static async getTasksByPriority(
    userId: string,
    teamId?: string,
    projectId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<TasksByPriority> {
    const where: any = {
      team: {
        members: {
          some: { userId }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end
      }
    }

    const [low, medium, high, urgent] = await Promise.all([
      prisma.task.count({ where: { ...where, priority: 'LOW' } }),
      prisma.task.count({ where: { ...where, priority: 'MEDIUM' } }),
      prisma.task.count({ where: { ...where, priority: 'HIGH' } }),
      prisma.task.count({ where: { ...where, priority: 'URGENT' } })
    ])

    return { low, medium, high, urgent }
  }

  static async getWeeklyProgress(
    userId: string,
    teamId?: string,
    projectId?: string,
    weeks: number = 4
  ): Promise<Array<{ week: string; completed: number; created: number }>> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - (weeks * 7))

    const where: any = {
      team: {
        members: {
          some: { userId }
        }
      }
    }

    if (teamId) {
      where.teamId = teamId
    }

    if (projectId) {
      where.projectId = projectId
    }

    const weeklyData = []
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(startDate.getDate() + (i * 7))
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const [completed, created] = await Promise.all([
        prisma.task.count({
          where: {
            ...where,
            status: 'DONE',
            completedAt: {
              gte: weekStart,
              lte: weekEnd
            }
          }
        }),
        prisma.task.count({
          where: {
            ...where,
            createdAt: {
              gte: weekStart,
              lte: weekEnd
            }
          }
        })
      ])

      weeklyData.push({
        week: `Week ${i + 1}`,
        completed,
        created
      })
    }

    return weeklyData
  }
}