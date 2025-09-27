
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, TrendingUp, Users, Clock, CheckCircle, AlertTriangle, Calendar } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [timeRange, setTimeRange] = useState('7d')

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalTasks: 24,
      completedTasks: 18,
      inProgressTasks: 4,
      overdueTasks: 2,
      completionRate: 75,
      averageCompletionTime: '2.3 days'
    },
    teamPerformance: [
      { name: 'John Doe', completedTasks: 8, avgTime: '1.8 days', efficiency: 92 },
      { name: 'Jane Smith', completedTasks: 6, avgTime: '2.1 days', efficiency: 88 },
      { name: 'Mike Johnson', completedTasks: 4, avgTime: '3.2 days', efficiency: 76 },
      { name: 'Sarah Wilson', completedTasks: 5, avgTime: '2.8 days', efficiency: 82 }
    ],
    tasksByPriority: {
      urgent: 3,
      high: 7,
      medium: 10,
      low: 4
    },
    tasksByStatus: {
      todo: 6,
      inProgress: 4,
      review: 2,
      done: 12
    },
    weeklyProgress: [
      { week: 'Week 1', completed: 3, created: 5 },
      { week: 'Week 2', completed: 4, created: 3 },
      { week: 'Week 3', completed: 6, created: 4 },
      { week: 'Week 4', completed: 5, created: 6 }
    ]
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to view analytics.</p>
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
              <BarChart3 className="h-8 w-8 mr-3" />
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track team performance and project insights
            </p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalTasks}</div>
              <p className="text-xs text-muted-foreground">
                +2 from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +5% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.averageCompletionTime}</div>
              <p className="text-xs text-muted-foreground">
                -0.5 days improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{analyticsData.overview.overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                -1 from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analyticsData.tasksByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status === 'done' ? 'bg-green-500' :
                      status === 'inProgress' ? 'bg-blue-500' :
                      status === 'review' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="capitalize">{status.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Tasks by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analyticsData.tasksByPriority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      priority === 'urgent' ? 'destructive' :
                      priority === 'high' ? 'default' :
                      priority === 'medium' ? 'secondary' :
                      'outline'
                    }>
                      {priority.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.teamPerformance.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {member.completedTasks} tasks completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{member.avgTime} avg</div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-muted-foreground">Efficiency:</span>
                      <Badge variant={member.efficiency >= 90 ? 'default' : member.efficiency >= 80 ? 'secondary' : 'outline'}>
                        {member.efficiency}%
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Weekly Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {analyticsData.weeklyProgress.map((week, index) => (
                <div key={index} className="p-4 rounded-lg border text-center">
                  <h3 className="font-medium mb-2">{week.week}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created:</span>
                      <span className="font-medium">{week.created}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="font-medium text-green-600">{week.completed}</span>
                    </div>
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
