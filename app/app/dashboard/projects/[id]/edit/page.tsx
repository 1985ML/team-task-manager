
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectForm } from '@/components/projects/project-form'
import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getProjectAndTeams(projectId: string, userId: string) {
  const [project, teams] = await Promise.all([
    prisma.project.findFirst({
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
        }
      }
    }),

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

  return { project, teams }
}

export default async function EditProjectPage({
  params
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const { project, teams } = await getProjectAndTeams(params.id, session.user.id)

  if (!project) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <ProjectForm project={project} teams={teams} />
    </div>
  )
}
