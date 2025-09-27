
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { TASK_PRIORITIES, type Task } from '@/lib/types'

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  dueDate: z.string().optional(),
  teamId: z.string().min(1, 'Team is required'),
  projectId: z.string().optional(),
  assignedToId: z.string().optional()
})

interface TaskFormData {
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate: string
  teamId: string
  projectId: string
  assignedToId: string
}

interface TaskFormProps {
  task?: Task
  teams: Array<{ id: string; name: string }>
  projects: Array<{ id: string; name: string; teamId: string; teamName: string }>
  users: Array<{ id: string; name: string | null; email: string }>
  defaultValues?: {
    teamId?: string
    projectId?: string
  }
  onSuccess?: () => void
}

export function TaskForm({ task, teams, projects, users, defaultValues, onSuccess }: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [filteredProjects, setFilteredProjects] = useState(projects)
  const [filteredUsers, setFilteredUsers] = useState(users)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      teamId: task?.teamId || defaultValues?.teamId || '',
      projectId: task?.projectId || defaultValues?.projectId || '',
      assignedToId: task?.assignedToId || ''
    }
  })

  const selectedTeamId = watch('teamId')
  const selectedProjectId = watch('projectId')
  const selectedStatus = watch('status')
  const selectedPriority = watch('priority')
  const selectedAssignedToId = watch('assignedToId')

  useEffect(() => {
    // Filter projects based on selected team
    if (selectedTeamId) {
      const teamProjects = projects.filter(project => project.teamId === selectedTeamId)
      setFilteredProjects(teamProjects)
      
      // Clear project selection if it doesn't belong to the selected team
      if (selectedProjectId && !teamProjects.find(p => p.id === selectedProjectId)) {
        setValue('projectId', '')
      }
    } else {
      setFilteredProjects(projects)
    }
  }, [selectedTeamId, projects, selectedProjectId, setValue])

  useEffect(() => {
    // Filter users based on selected team (this could be improved with team member relationships)
    setFilteredUsers(users)
  }, [selectedTeamId, users])

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true)

    try {
      const url = task ? `/api/tasks/${task.id}` : '/api/tasks'
      const method = task ? 'PATCH' : 'POST'

      const payload = {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        projectId: data.projectId || null,
        assignedToId: data.assignedToId || null
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Something went wrong')
      }

      const result = await response.json()
      toast.success(task ? 'Task updated successfully!' : 'Task created successfully!')
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/tasks')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save task')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold">
          {task ? 'Edit Task' : 'Create New Task'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {task ? 'Update task details' : 'Add a new task to your team\'s workflow'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Enter task title..."
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe the task..."
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={(value) => setValue('priority', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs ${priority.color}`}>
                            {priority.label}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-red-600">{errors.priority.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">To Do</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Team *</Label>
              <Select
                value={selectedTeamId}
                onValueChange={(value) => setValue('teamId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.teamId && (
                <p className="text-sm text-red-600">{errors.teamId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => setValue('projectId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No Project</SelectItem>
                  {filteredProjects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                      {selectedTeamId && project.teamName && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({project.teamName})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-red-600">{errors.projectId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select
                value={selectedAssignedToId}
                onValueChange={(value) => setValue('assignedToId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {filteredUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || 'Unnamed User'} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.assignedToId && (
                <p className="text-sm text-red-600">{errors.assignedToId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
              </Button>
              <Link href="/dashboard/tasks">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
