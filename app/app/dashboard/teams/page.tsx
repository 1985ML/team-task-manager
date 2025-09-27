
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, Calendar, CheckSquare, Plus, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

async function getUserTeams(userId: string) {
  return await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: {
            select: {
              tasks: true,
              members: true
            }
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            take: 3 // Show first 3 members
          }
        }
      }
    },
    orderBy: { joinedAt: 'desc' }
  })
}

export default async function TeamsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/auth/login')
  }

  const userTeams = await getUserTeams(session.user.id)

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'default'
      case 'ADMIN':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Teams</h1>
          <p className="text-muted-foreground mt-2">
            Manage your team memberships and collaborate with others.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      {userTeams.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-6">
              Create or join a team to start collaborating with others.
            </p>
            <Button>
              Create Your First Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userTeams.map((teamMember) => {
            const team = teamMember.team
            return (
              <Card key={team.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: team.color || '#6B7280' }}
                        />
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </div>
                      <Badge variant={getRoleBadgeVariant(teamMember.role)} className="text-xs">
                        {teamMember.role}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  {team.description && (
                    <CardDescription className="text-sm">
                      {team.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Tasks</span>
                      <Badge variant="secondary" className="text-xs">
                        {team._count.tasks}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Members</span>
                      <Badge variant="secondary" className="text-xs">
                        {team._count.members}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Team Members</p>
                    <div className="flex items-center space-x-1">
                      {team.members.slice(0, 3).map((member) => (
                        <Avatar key={member.id} className="h-6 w-6">
                          <AvatarImage src="" alt={member.user.name || ''} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {team._count.members > 3 && (
                        <div className="flex items-center justify-center h-6 w-6 bg-muted rounded-full">
                          <span className="text-xs text-muted-foreground">
                            +{team._count.members - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>Joined {format(new Date(teamMember.joinedAt), 'MMM d, yyyy')}</span>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" size="sm" asChild>
                      <Link href={`/dashboard/teams/${team.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button className="flex-1" size="sm" asChild>
                      <Link href={`/dashboard/tasks?teamId=${team.id}`}>
                        View Tasks
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
