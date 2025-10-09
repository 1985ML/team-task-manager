
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DashboardOverview } from '@/components/dashboard/overview'
import { RecentTasks } from '@/components/dashboard/recent-tasks'
import { TeamActivity } from '@/components/dashboard/team-activity'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getDashboardData(userId: string) {
  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    userTeams,
    recentTasks,
    recentActivity
  ] = await Promise.all([
    // Total tasks assigned to user
    prisma.task.count({
      where: { assignedToId: userId }
    }),
    
    // Completed tasks
    prisma.task.count({
      where: { 
        assignedToId: userId,
        status: 'DONE'
      }
    }),
    
    // Pending tasks
    prisma.task.count({
      where: { 
        assignedToId: userId,
        status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
      }
    }),
    
    // Overdue tasks
    prisma.task.count({
      where: { 
        assignedToId: userId,
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    }),
    
    // User teams count
    prisma.teamMember.count({
      where: { userId }
    }),
    
    // Recent tasks assigned to user
    prisma.task.findMany({
      where: { assignedToId: userId },
      include: {
        createdBy: true,
        team: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),
    
    // Recent activity (tasks created or updated)
    prisma.task.findMany({
      where: {
        team: {
          members: {
            some: { userId }
          }
        }
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })
  ])

  return {
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      userTeams
    },
    recentTasks,
    recentActivity
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const dashboardData = await getDashboardData(session.user.id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {session.user.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          Here&apos;s what&apos;s happening with your tasks and teams today.
        </p>
      </div>

      <DashboardOverview stats={dashboardData.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentTasks tasks={dashboardData.recentTasks} />
        <TeamActivity activities={dashboardData.recentActivity} />
      </div>
    </div>
  )
}
