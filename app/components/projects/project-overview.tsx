
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  CheckSquare, 
  Plus,
  ArrowLeft,
  Clock,
  User
} from 'lucide-react'
import { PROJECT_STATUSES, type Project } from '@/lib/types'
import { formatDistanceToNow, format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface ProjectOverviewProps {
  project: Project
}

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const statusInfo = PROJECT_STATUSES.find(s => s.value === project.status)
  
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      toast.success('Project deleted successfully')
      router.push('/dashboard/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const tasksByStatus = project.tasks?.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = []
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, typeof project.tasks>) || {}

  const completedTasks = tasksByStatus.DONE?.length || 0
  const totalTasks = project.tasks?.length || 0
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const dueDateStatus = project.dueDate ? {
    date: new Date(project.dueDate),
    isOverdue: new Date(project.dueDate) < new Date() && project.status !== 'COMPLETED',
    isUpcoming: new Date(project.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  } : null

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
            <Badge className={statusInfo?.color}>
              {statusInfo?.label}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/projects/${project.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {project.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{project.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Tasks ({totalTasks})
                </CardTitle>
                <Button asChild size="sm">
                  <Link href={`/dashboard/tasks/new?projectId=${project.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {totalTasks === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No tasks yet</p>
                    <p className="mb-4">Add your first task to get started</p>
                    <Button asChild>
                      <Link href={`/dashboard/tasks/new?projectId=${project.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{completedTasks}/{totalTasks} completed ({completionPercentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <Separator />

                    {/* Task List */}
                    <div className="space-y-3">
                      {project.tasks?.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              task.status === 'DONE' ? 'bg-green-500' :
                              task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                              task.status === 'REVIEW' ? 'bg-yellow-500' :
                              'bg-gray-300'
                            }`} />
                            <div>
                              <Link 
                                href={`/dashboard/tasks/${task.id}`}
                                className="font-medium hover:text-primary"
                              >
                                {task.title}
                              </Link>
                              {task.assignedTo && (
                                <p className="text-sm text-muted-foreground">
                                  Assigned to {task.assignedTo.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={
                              task.priority === 'URGENT' ? 'border-red-200 text-red-700' :
                              task.priority === 'HIGH' ? 'border-orange-200 text-orange-700' :
                              task.priority === 'MEDIUM' ? 'border-blue-200 text-blue-700' :
                              'border-gray-200 text-gray-700'
                            }>
                              {task.priority.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      
                      {(project.tasks?.length || 0) > 5 && (
                        <div className="text-center pt-2">
                          <Button variant="outline" asChild>
                            <Link href={`/dashboard/tasks?projectId=${project.id}`}>
                              View all {totalTasks} tasks
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Team:</span>
                  <span className="text-sm">{project.team?.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created by:</span>
                  <span className="text-sm">{project.createdBy?.name}</span>
                </div>

                {project.startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Started:</span>
                    <span className="text-sm">{format(new Date(project.startDate), 'MMM d, yyyy')}</span>
                  </div>
                )}

                {project.dueDate && (
                  <div className={`flex items-center gap-2 ${
                    dueDateStatus?.isOverdue ? 'text-red-600' : 
                    dueDateStatus?.isUpcoming ? 'text-orange-600' : ''
                  }`}>
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Due:</span>
                    <span className="text-sm">{format(new Date(project.dueDate), 'MMM d, yyyy')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created:</span>
                  <span className="text-sm">
                    {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Tasks</span>
                  <span className="font-medium">{totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-medium">{completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">In Progress</span>
                  <span className="font-medium">{tasksByStatus.IN_PROGRESS?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">To Do</span>
                  <span className="font-medium">{tasksByStatus.TODO?.length || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone.
              All tasks in this project will remain but will no longer be associated with the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete Project'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
