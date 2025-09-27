
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Trash2, Users, CheckSquare, Calendar } from 'lucide-react'
import { PROJECT_STATUSES, type Project } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'react-hot-toast'

interface ProjectCardProps {
  project: Project
  onUpdate: () => void
}

export function ProjectCard({ project, onUpdate }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
      onUpdate()
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const dueDateStatus = project.dueDate ? {
    date: new Date(project.dueDate),
    isOverdue: new Date(project.dueDate) < new Date() && project.status !== 'COMPLETED',
    isUpcoming: new Date(project.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
  } : null

  return (
    <>
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            <Link 
              href={`/dashboard/projects/${project.id}`}
              className="hover:text-primary"
            >
              {project.name}
            </Link>
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/projects/${project.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Badge className={statusInfo?.color}>
              {statusInfo?.label}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckSquare className="h-4 w-4" />
              {project._count?.tasks || 0} tasks
            </div>
          </div>

          {project.dueDate && (
            <div className={`flex items-center gap-2 text-sm ${
              dueDateStatus?.isOverdue ? 'text-red-600' : 
              dueDateStatus?.isUpcoming ? 'text-orange-600' : 
              'text-muted-foreground'
            }`}>
              <Calendar className="h-4 w-4" />
              Due {formatDistanceToNow(new Date(project.dueDate), { addSuffix: true })}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground border-t">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {project.team?.name}
            </div>
            <div>
              {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </div>
          </div>
        </CardContent>
      </Card>

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
