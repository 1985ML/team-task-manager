
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

export default function CalendarPage() {
  const { data: session } = useSession()
  const [currentDate, setCurrentDate] = useState(new Date())

  // Mock tasks with due dates
  const mockTasks = [
    {
      id: '1',
      title: 'Complete project proposal',
      dueDate: new Date(2025, 8, 28),
      priority: 'HIGH',
      status: 'IN_PROGRESS'
    },
    {
      id: '2',
      title: 'Review team performance',
      dueDate: new Date(2025, 8, 30),
      priority: 'MEDIUM',
      status: 'TODO'
    },
    {
      id: '3',
      title: 'Client presentation',
      dueDate: new Date(2025, 9, 2),
      priority: 'URGENT',
      status: 'TODO'
    },
    {
      id: '4',
      title: 'Code review session',
      dueDate: new Date(2025, 9, 5),
      priority: 'MEDIUM',
      status: 'REVIEW'
    }
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1)
    } else {
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getTasksForDate = (date: Date) => {
    if (!date) return []
    return mockTasks.filter(task => 
      task.dueDate.toDateString() === date.toDateString()
    )
  }

  const days = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view the calendar.</p>
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
              <Calendar className="h-8 w-8 mr-3" />
              Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              View your tasks and deadlines in calendar format
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Calendar Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{monthName}</CardTitle>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center font-semibold text-sm text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                const tasksForDate = date ? getTasksForDate(date) : []
                const isToday = date && date.toDateString() === new Date().toDateString()
                
                return (
                  <div 
                    key={index} 
                    className={`min-h-[120px] p-2 border rounded-md ${
                      date ? 'bg-background' : 'bg-muted/30'
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${
                          isToday ? 'text-primary font-bold' : ''
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {tasksForDate.map(task => (
                            <div
                              key={task.id}
                              className="text-xs p-1 rounded truncate cursor-pointer hover:bg-muted/50"
                              title={task.title}
                            >
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="flex-1 truncate">{task.title}</span>
                              </div>
                              <div className="flex space-x-1 mt-1">
                                <Badge variant={getPriorityColor(task.priority)} className="text-xs px-1">
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Due {task.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusColor(task.status)}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
