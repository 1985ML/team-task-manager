'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart3, TrendingUp, Users, Clock, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface AnalyticsData {
  overview: {
    totalTasks: number
    completedTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
    averageCompletionTime: number
  }
  tasksByStatus: {
    todo: number
    inProgress: number
    review: number
    done: number
  }
  tasksByPriority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  weeklyProgress: Array<{
    week: string
    completed: number
    created: number
  }>
}

interface TeamAnalyticsData {
  teamPerformance: Array<{
    userId: string
    name: string
    email: string
    completedTasks: number
    totalTasks: number
    averageCompletionTime: number
    onTimeCompletionRate: number
    overdueCount: number
  }>
  projectAnalytics: Array<{
    projectId: string
    projectName: string
    totalTasks: number
    completedTasks: number
    completionRate: number
    averageTaskCompletionTime: number
    status: string
  }>
}

export default function AnalyticsPage() {
  const { data: session } = useSession()
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [teamAnalyticsData, setTeamAnalyticsData] = useState<TeamAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedTeam !== 'all') {
        params.append('teamId', selectedTeam)
      }

      // Add date range
      const endDate = new Date()
      const startDate = new Date()
      if (timeRange === '7d') {
        startDate.setDate(endDate.getDate() - 7)
      } else if (timeRange === '30d') {
        startDate.setDate(endDate.getDate() - 30)
      } else if (timeRange === '3m') {
        startDate.setMonth(endDate.getMonth() - 3)
      } else if (timeRange === '1y') {
        startDate.setFullYear(endDate.getFullYear() - 1)
      }

      params.append('startDate', startDate.toISOString())
      params.append('endDate', endDate.toISOString())

      const [taskAnalyticsResponse, teamAnalyticsResponse] = await Promise.all([
        fetch(`/api/v1/analytics/tasks?${params}`),
        fetch(`/api/v1/analytics/teams?${params}`)
      ])

      if (taskAnalyticsResponse.ok && teamAnalyticsResponse.ok) {
        const [taskData, teamData] = await Promise.all([
          taskAnalyticsResponse.json(),
          teamAnalyticsResponse.json()
        ])

        setAnalyticsData(taskData)
        setTeamAnalyticsData(teamData)
      } else {
        console.error('Failed to fetch analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeRange, selectedTeam])

  useEffect(() => {
    if (session?.user?.id) {
      fetchAnalytics()
    }
  }, [session, fetchAnalytics])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const statusChartData = analyticsData ? [
    { name: 'To Do', value: analyticsData.tasksByStatus.todo, color: '#6B7280' },
    { name: 'In Progress', value: analyticsData.tasksByStatus.inProgress, color: '#3B82F6' },
    { name: 'Review', value: analyticsData.tasksByStatus.review, color: '#F59E0B' },
    { name: 'Done', value: analyticsData.tasksByStatus.done, color: '#10B981' }
  ] : []

  const priorityChartData = analyticsData ? [
    { name: 'Low', value: analyticsData.tasksByPriority.low, color: '#6B7280' },
    { name: 'Medium', value: analyticsData.tasksByPriority.medium, color: '#3B82F6' },
    { name: 'High', value: analyticsData.tasksByPriority.high, color: '#F59E0B' },
    { name: 'Urgent', value: analyticsData.tasksByPriority.urgent, color: '#EF4444' }
  ] : []

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
          <div className="flex items-center space-x-4">
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
      </div>

      <div className="grid gap-6">
        {/* Key Metrics */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.completedTasks} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.completionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {analyticsData.overview.completedTasks} of {analyticsData.overview.totalTasks} tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analyticsData.overview.averageCompletionTime.toFixed(1)} days</div>
                <p className="text-xs text-muted-foreground">
                  Average time to complete
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
                  Need immediate attention
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tasks by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Tasks by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Progress */}
        {analyticsData && (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.weeklyProgress}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" />
                  <Line type="monotone" dataKey="created" stroke="#3B82F6" name="Created" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Team Performance */}
        {teamAnalyticsData && teamAnalyticsData.teamPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Team Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamAnalyticsData.teamPerformance.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{member.completedTasks}</p>
                        <p className="text-gray-500">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{member.onTimeCompletionRate.toFixed(1)}%</p>
                        <p className="text-gray-500">On Time</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{member.averageCompletionTime.toFixed(1)}d</p>
                        <p className="text-gray-500">Avg Time</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-red-600">{member.overdueCount}</p>
                        <p className="text-gray-500">Overdue</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Project Analytics */}
        {teamAnalyticsData && teamAnalyticsData.projectAnalytics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Project Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamAnalyticsData.projectAnalytics.map((project) => (
                  <div key={project.projectId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{project.projectName}</p>
                        <Badge variant={
                          project.status === 'COMPLETED' ? 'default' :
                          project.status === 'ACTIVE' ? 'secondary' :
                          project.status === 'ON_HOLD' ? 'outline' :
                          'destructive'
                        }>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold">{project.totalTasks}</p>
                        <p className="text-gray-500">Total Tasks</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{project.completedTasks}</p>
                        <p className="text-gray-500">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{project.completionRate.toFixed(1)}%</p>
                        <p className="text-gray-500">Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold">{project.averageTaskCompletionTime.toFixed(1)}d</p>
                        <p className="text-gray-500">Avg Time</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
