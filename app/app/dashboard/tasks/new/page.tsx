
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TaskForm } from '@/components/tasks/task-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getTaskFormData(userId: string, searchParams: URLSearchParams) {
  const [teams, projects, teamMembers] = await Promise.all([
    // Get all teams the user is a member of
    prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    }),

    // Get all projects from teams the user is a member of
    prisma.project.findMany({
      where: {
        team: {
          members: {
            some: {
              userId: userId
            }
          }
        }
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    }),

    // Get all users from teams the user is a member of
    prisma.user.findMany({
      where: {
        teamMemberships: {
          some: {
            team: {
              members: {
                some: {
                  userId: userId
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: {
        name: 'asc'
      }
    })
  ])

  // Get default values from URL params
  const defaultTeamId = searchParams.get('teamId') || ''
  const defaultProjectId = searchParams.get('projectId') || ''

  return { 
    teams, 
    projects: projects.map(project => ({
      ...project,
      teamName: project.team.name
    })), 
    users: teamMembers,
    defaultValues: {
      teamId: defaultTeamId,
      projectId: defaultProjectId
    }
  }
}

interface NewTaskPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const urlSearchParams = new URLSearchParams(
    Object.entries(searchParams).reduce((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, string>)
  )

  const { teams, projects, users, defaultValues } = await getTaskFormData(session.user.id, urlSearchParams)

  return (
    <div className="container mx-auto py-8">
      <TaskForm 
        teams={teams} 
        projects={projects} 
        users={users}
        defaultValues={defaultValues}
      />
    </div>
  )
}
