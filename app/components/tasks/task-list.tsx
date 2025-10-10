
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckSquare, Clock, AlertTriangle, MessageSquare, Calendar, User, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

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
  _count: {
    comments: number
  }
}

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({})

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all' && value !== false) {
          params.append(key, String(value))
        }
      })

      const response = await fetch(`/api/tasks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      
      const data = await response.json()
      setTasks(data)
    } catch (error) {
      toast.error('Failed to fetch tasks')
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update task')
      
      toast.success('Task updated successfully')
      fetchTasks() // Refresh the task list
    } catch (error) {
      toast.error('Failed to update task')
      console.error('Error updating task:', error)
    }
  }

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
        return 'text-red-600 bg-red-50'
      case 'HIGH':
        return 'text-orange-600 bg-orange-50'
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-green-600 bg-green-50'
    }
  }

  const getUserInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const isOverdue = (dueDate: Date | null, status: string) => {
    return dueDate && status !== 'DONE' && new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-12 text-center">
          <CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No tasks found</h3>
          <p className="text-muted-foreground mb-6">
            Get started by creating your first task or adjust your filters.
          </p>
          <Button asChild>
            <Link href="/dashboard/tasks/new">
              Create New Task
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <motion.div
          key={task.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(task.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Link href={`/dashboard/tasks/${task.id}`}>
                        <h3 className="text-lg font-semibold hover:text-primary cursor-pointer truncate">
                          {task.title}
                        </h3>
                      </Link>
                      {isOverdue(task.dueDate, task.status) && (
                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-3 flex-wrap gap-2">
                      <Badge variant={getStatusBadgeVariant(task.status)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      
                      <Badge variant="outline" style={{ 
                        borderColor: task.team.color || '#6B7280',
                        color: task.team.color || '#6B7280'
                      }}>
                        {task.team.name}
                      </Badge>
                    </div>
                    
                    {task.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {task.assignedTo && (
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>{task.assignedTo.name || task.assignedTo.email}</span>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600' : ''}>
                            Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      
                      {task._count.comments > 0 && (
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-3 w-3" />
                          <span>{task._count.comments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {task.assignedTo && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={task.assignedTo.name || ''} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(task.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/tasks/${task.id}`}>
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/tasks/${task.id}/edit`}>
                          Edit Task
                        </Link>
                      </DropdownMenuItem>
                      {task.status !== 'IN_PROGRESS' && (
                        <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}>
                          Mark In Progress
                        </DropdownMenuItem>
                      )}
                      {task.status !== 'DONE' && (
                        <DropdownMenuItem onClick={() => updateTaskStatus(task.id, 'DONE')}>
                          Mark Complete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
