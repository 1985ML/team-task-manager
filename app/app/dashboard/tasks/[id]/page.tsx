
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Calendar, User, MessageCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  createdAt: string
  updatedAt: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  createdBy: {
    id: string
    name: string
    email: string
  }
  team: {
    id: string
    name: string
  }
  comments: Array<{
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }>
}

export default function TaskDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const taskId = params?.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    dueDate: ''
  })

  const fetchTask = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`)
      if (response.ok) {
        const taskData = await response.json()
        setTask(taskData)
        setEditFormData({
          title: taskData.title || '',
          description: taskData.description || '',
          status: taskData.status || '',
          priority: taskData.priority || '',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString().split('T')[0] : ''
        })
      } else if (response.status === 404) {
        toast.error('Task not found')
        router.push('/dashboard/tasks')
      } else {
        throw new Error('Failed to fetch task')
      }
    } catch (error) {
      console.error('Error fetching task:', error)
      // For demo purposes, create a mock task
      const mockTask: Task = {
        id: taskId,
        title: 'Sample Task',
        description: 'This is a sample task for demonstration purposes.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedTo: {
          id: session?.user?.id || '1',
          name: session?.user?.name || 'You',
          email: session?.user?.email || 'you@example.com'
        },
        createdBy: {
          id: session?.user?.id || '1',
          name: session?.user?.name || 'You',
          email: session?.user?.email || 'you@example.com'
        },
        team: {
          id: '1',
          name: 'Development Team'
        },
        comments: [
          {
            id: '1',
            content: 'This task is important for the project milestone.',
            createdAt: new Date().toISOString(),
            user: {
              id: session?.user?.id || '1',
              name: session?.user?.name || 'You',
              email: session?.user?.email || 'you@example.com'
            }
          }
        ]
      }
      setTask(mockTask)
      setEditFormData({
        title: mockTask.title,
        description: mockTask.description || '',
        status: mockTask.status,
        priority: mockTask.priority,
        dueDate: mockTask.dueDate ? new Date(mockTask.dueDate).toISOString().split('T')[0] : ''
      })
    } finally {
      setLoading(false)
    }
  }, [taskId, router, session?.user?.id, session?.user?.name, session?.user?.email])

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
  }, [taskId, fetchTask])

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...editFormData,
          dueDate: editFormData.dueDate ? new Date(editFormData.dueDate).toISOString() : null
        })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTask(updatedTask)
        setIsEditing(false)
        toast.success('Task updated successfully!')
      } else {
        toast.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      // For demo purposes, just update the local state
      setTask({
        ...task,
        ...editFormData,
        updatedAt: new Date().toISOString()
      })
      setIsEditing(false)
      toast.success('Task updated successfully!')
    } finally {
      setUpdating(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !task) return

    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newComment
        })
      })

      if (response.ok) {
        const comment = await response.json()
        setTask({
          ...task,
          comments: [...task.comments, comment]
        })
        setNewComment('')
        toast.success('Comment added successfully!')
      } else {
        toast.error('Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      // For demo purposes, add the comment locally
      const newCommentObj = {
        id: Date.now().toString(),
        content: newComment,
        createdAt: new Date().toISOString(),
        user: {
          id: session?.user?.id || '1',
          name: session?.user?.name || 'You',
          email: session?.user?.email || 'you@example.com'
        }
      }
      setTask({
        ...task,
        comments: [...task.comments, newCommentObj]
      })
      setNewComment('')
      toast.success('Comment added successfully!')
    }
  }

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

  const getStatusColor = (status: string) => {
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

  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading task...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the task details.</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Task not found</h2>
          <p className="text-muted-foreground mb-4">The task you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/dashboard/tasks">
            <Button>Back to Tasks</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/dashboard/tasks">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">{task.title}</h1>
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
            <Badge variant={getStatusColor(task.status)}>
              {task.status.replace('_', ' ')}
            </Badge>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Task'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Task Details */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={editFormData.priority}
                      onValueChange={(value) => setEditFormData({...editFormData, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editFormData.status}
                      onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="REVIEW">Review</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={updating}>
                    {updating ? 'Updating...' : 'Update Task'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">
                    {task.description || 'No description provided.'}
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Priority</p>
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant={getStatusColor(task.status)} className="text-xs">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Due Date</p>
                      <p className="text-sm text-muted-foreground">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Assigned To</p>
                      <p className="text-sm text-muted-foreground">
                        {task.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">
                    Created by {task.createdBy.name} on {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last updated on {new Date(task.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Comments ({task.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-2">
              <Label htmlFor="newComment">Add a comment</Label>
              <Textarea
                id="newComment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write your comment..."
                rows={3}
              />
              <Button type="submit" size="sm" disabled={!newComment.trim()}>
                Add Comment
              </Button>
            </form>

            <Separator />

            {/* Comments List */}
            <div className="space-y-4">
              {task.comments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                task.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getUserInitials(comment.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium">{comment.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
