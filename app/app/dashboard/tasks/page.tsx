
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TaskList } from '@/components/tasks/task-list'
import { TaskFilters } from '@/components/tasks/task-filters'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getUserTeams(userId: string) {
  return await prisma.team.findMany({
    where: {
      members: {
        some: { userId }
      }
    },
    include: {
      _count: {
        select: { tasks: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const teams = await getUserTeams(session.user.id)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-2">
            Manage and track your team&apos;s tasks efficiently.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/tasks/new">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Link>
        </Button>
      </div>

      <TaskFilters teams={teams} />
      <TaskList />
    </div>
  )
}
