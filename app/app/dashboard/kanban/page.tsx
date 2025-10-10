
'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FolderKanban, Plus, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'


export default function KanbanPage() {
  const { data: session } = useSession()

  // Mock tasks organized by status
  const mockTasks = {
    TODO: [
      {
        id: '1',
        title: 'Design user interface mockups',
        description: 'Create wireframes and mockups for the new dashboard',
        priority: 'HIGH',
        dueDate: new Date(2025, 9, 30),
        assignedTo: { name: 'John Doe', initials: 'JD' },
        tags: ['Design', 'UI/UX']
      },
      {
        id: '2',
        title: 'Review project requirements',
        description: 'Go through all project requirements with stakeholders',
        priority: 'MEDIUM',
        dueDate: new Date(2025, 10, 5),
        assignedTo: { name: 'Jane Smith', initials: 'JS' },
        tags: ['Planning', 'Requirements']
      }
    ],
    IN_PROGRESS: [
      {
        id: '3',
        title: 'Implement authentication system',
        description: 'Build secure login and registration functionality',
        priority: 'URGENT',
        dueDate: new Date(2025, 9, 25),
        assignedTo: { name: 'Mike Johnson', initials: 'MJ' },
        tags: ['Development', 'Security']
      },
      {
        id: '4',
        title: 'Database schema optimization',
        description: 'Optimize database queries for better performance',
        priority: 'HIGH',
        dueDate: new Date(2025, 10, 2),
        assignedTo: { name: 'Sarah Wilson', initials: 'SW' },
        tags: ['Database', 'Performance']
      }
    ],
    REVIEW: [
      {
        id: '5',
        title: 'API documentation update',
        description: 'Update API docs with latest endpoint changes',
        priority: 'MEDIUM',
        dueDate: new Date(2025, 9, 28),
        assignedTo: { name: 'Tom Brown', initials: 'TB' },
        tags: ['Documentation', 'API']
      }
    ],
    DONE: [
      {
        id: '6',
        title: 'Setup CI/CD pipeline',
        description: 'Configure automated testing and deployment',
        priority: 'HIGH',
        dueDate: new Date(2025, 9, 20),
        assignedTo: { name: 'Alex Davis', initials: 'AD' },
        tags: ['DevOps', 'Automation']
      },
      {
        id: '7',
        title: 'Initial project setup',
        description: 'Setup project structure and development environment',
        priority: 'HIGH',
        dueDate: new Date(2025, 9, 15),
        assignedTo: { name: 'Lisa Chen', initials: 'LC' },
        tags: ['Setup', 'Environment']
      }
    ]
  }

  const columns = [
    { id: 'TODO', title: 'To Do', color: 'bg-slate-100' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'REVIEW', title: 'Review', color: 'bg-yellow-100' },
    { id: 'DONE', title: 'Done', color: 'bg-green-100' }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive'
      case 'HIGH':
        return 'default'
      case 'MEDIUM':
        return 'secondary'
      case 'LOW':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const isOverdue = (dueDate: Date) => {
    return dueDate < new Date()
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view the kanban board.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FolderKanban className="h-8 w-8 mr-3" />
              Kanban Board
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your tasks with drag-and-drop workflow
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/tasks/new">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Link>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(column => (
          <Card key={column.id} className="h-fit">
            <CardHeader className={`${column.color} rounded-t-lg`}>
              <CardTitle className="flex items-center justify-between">
                <span>{column.title}</span>
                <Badge variant="secondary">
                  {mockTasks[column.id as keyof typeof mockTasks]?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {mockTasks[column.id as keyof typeof mockTasks]?.map(task => (
                <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Task Header */}
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-sm leading-tight">{task.title}</h3>
                        <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Task Footer */}
                      <div className="flex items-center justify-between">
                        {/* Assignee */}
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {task.assignedTo.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {task.assignedTo.name}
                          </span>
                        </div>

                        {/* Due Date */}
                        <div className={`flex items-center space-x-1 text-xs ${
                          isOverdue(task.dueDate) ? 'text-destructive' : 'text-muted-foreground'
                        }`}>
                          {isOverdue(task.dueDate) && <AlertCircle className="h-3 w-3" />}
                          <Clock className="h-3 w-3" />
                          <span>{task.dueDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Task Button */}
              <Button
                variant="outline"
                className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link href="/dashboard/tasks/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Board Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {columns.map(column => {
              const count = mockTasks[column.id as keyof typeof mockTasks]?.length || 0
              return (
                <div key={column.id} className="text-center p-4 rounded-lg border">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground">{column.title}</div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
