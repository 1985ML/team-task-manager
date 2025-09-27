
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { CheckSquare, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  createdAt: Date
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  team: {
    id: string
    name: string
    color: string | null
  }
}

interface RecentTasksProps {
  tasks: Task[]
}

export function RecentTasks({ tasks }: RecentTasksProps) {
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'DONE':
        return 'default'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'REVIEW':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600'
      case 'HIGH':
        return 'text-orange-600'
      case 'MEDIUM':
        return 'text-yellow-600'
      default:
        return 'text-green-600'
    }
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isOverdue = (dueDate: Date | null, status: string) => {
    return dueDate && status !== 'DONE' && new Date(dueDate) < new Date()
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Tasks</CardTitle>
            <CardDescription>
              Your latest task assignments
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/tasks">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent tasks assigned to you.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/dashboard/tasks">Browse All Tasks</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link href={`/dashboard/tasks/${task.id}`}>
                  <div className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex-shrink-0">
                      {getStatusIcon(task.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium truncate">{task.title}</h4>
                        {isOverdue(task.dueDate, task.status) && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-2">
                        <Badge variant={getStatusBadgeVariant(task.status)} className="text-xs">
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span>•</span>
                        <span>{task.team.name}</span>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600' : ''}>
                              Due {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="" alt={task.createdBy.name || ''} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(task.createdBy.name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
