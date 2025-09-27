
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { ProjectOverview } from '@/components/projects/project-overview'

export const dynamic = 'force-dynamic'

async function getProject(projectId: string, userId: string) {
  return await prisma.project.findFirst({
    where: {
      id: projectId,
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
      tasks: {
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          position: 'asc'
        }
      },
      _count: {
        select: {
          tasks: true
        }
      }
    }
  })
}

export default async function ProjectDetailPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const project = await getProject(params.id, session.user.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <ProjectOverview project={project} />
    </div>
  )
}
