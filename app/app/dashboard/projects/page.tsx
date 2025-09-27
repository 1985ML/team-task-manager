
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectList } from '@/components/projects/project-list'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getProjectsData(userId: string) {
  const [projects, teams] = await Promise.all([
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
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            tasks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }),

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
    })
  ])

  return { projects, teams }
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const { projects, teams } = await getProjectsData(session.user.id)

  return (
    <div className="container mx-auto py-8">
      <ProjectList initialProjects={projects} teams={teams} />
    </div>
  )
}
