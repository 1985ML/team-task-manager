
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProjectForm } from '@/components/projects/project-form'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getUserTeams(userId: string) {
  return await prisma.team.findMany({
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
}

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const teams = await getUserTeams(session.user.id)

  return (
    <div className="container mx-auto py-8">
      <ProjectForm teams={teams} />
    </div>
  )
}
