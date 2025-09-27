// Project and Task Types
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  startDate: Date | null
  dueDate: Date | null
  teamId: string
  createdById: string
  createdAt: Date
  updatedAt: Date
  team?: {
    id: string
    name: string
  } | null
  createdBy?: {
    id: string
    name: string | null
    email: string
  } | null
  tasks?: Task[] | null
  _count?: {
    tasks: number
  } | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  dueDate: Date | null
  completedAt: Date | null
  position: number
  createdAt: Date
  updatedAt: Date
  createdById: string
  assignedToId: string | null
  teamId: string
  projectId: string | null
  project?: Project | null
  team?: {
    id: string
    name: string
  } | null
  createdBy?: {
    id: string
    name: string | null
    email: string
  } | null
  assignedTo?: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface ProjectFormData {
  name: string
  description: string
  status: ProjectStatus
  startDate: string
  dueDate: string
  teamId: string
}

export interface TaskFormData {
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  dueDate: string
  assignedToId: string
  teamId: string
  projectId: string
}

export type DateRange = {
  from: Date | undefined
  to: Date | undefined
}

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'PLANNING', label: 'Planning', color: 'bg-gray-100 text-gray-800' },
  { value: 'ACTIVE', label: 'Active', color: 'bg-blue-100 text-blue-800' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
]

export const TASK_PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]