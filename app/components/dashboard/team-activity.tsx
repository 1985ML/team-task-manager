
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CheckSquare, Clock, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'

interface Activity {
  id: string
  title: string
  status: string
  priority: string
  updatedAt: Date
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  assignedTo: {
    id: string
    name: string | null
    email: string
  } | null
  team: {
    id: string
    name: string
    color: string | null
  }
}

interface TeamActivityProps {
  activities: Activity[]
}

export function TeamActivity({ activities }: TeamActivityProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DONE':
        return <CheckSquare className="h-4 w-4 text-green-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'REVIEW':
        return <Clock className="h-4 w-4 text-purple-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getActivityDescription = (activity: Activity) => {
    if (activity.status === 'DONE') {
      return `completed "${activity.title}"`
    } else if (activity.status === 'IN_PROGRESS') {
      return `started working on "${activity.title}"`
    } else if (activity.status === 'REVIEW') {
      return `moved "${activity.title}" to review`
    } else {
      return `updated "${activity.title}"`
    }
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Team Activity</CardTitle>
            <CardDescription>
              Recent updates from your teams
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/teams">
              View Teams
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent team activity.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/teams">Join a Team</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex-shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={activity.createdBy.name || ''} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(activity.createdBy.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(activity.status)}
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.createdBy.name || 'Someone'}
                        </span>{' '}
                        {getActivityDescription(activity)}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {activity.team.name}
                      </Badge>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(activity.updatedAt), { addSuffix: true })}</span>
                      {activity.assignedTo && (
                        <>
                          <span>•</span>
                          <span>Assigned to {activity.assignedTo.name || 'Someone'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
