'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Calendar, Clock, Repeat, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RecurringTaskFormProps {
  taskId: string
  onClose: () => void
  onSuccess?: () => void
  existingConfig?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    interval: number
    daysOfWeek: number[]
    dayOfMonth?: number
    endDate?: string
    active: boolean
  }
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' }
]

export function RecurringTaskForm({ 
  taskId, 
  onClose, 
  onSuccess, 
  existingConfig 
}: RecurringTaskFormProps) {
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    existingConfig?.frequency || 'WEEKLY'
  )
  const [interval, setInterval] = useState(existingConfig?.interval || 1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    existingConfig?.daysOfWeek || [1] // Default to Monday
  )
  const [dayOfMonth, setDayOfMonth] = useState(existingConfig?.dayOfMonth || 1)
  const [hasEndDate, setHasEndDate] = useState(!!existingConfig?.endDate)
  const [endDate, setEndDate] = useState(
    existingConfig?.endDate ? existingConfig.endDate.split('T')[0] : ''
  )
  const [loading, setLoading] = useState(false)

  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    if (checked) {
      setDaysOfWeek(prev => [...prev, day].sort())
    } else {
      setDaysOfWeek(prev => prev.filter(d => d !== day))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data: any = {
        frequency,
        interval
      }

      if (frequency === 'WEEKLY') {
        if (daysOfWeek.length === 0) {
          toast.error('Please select at least one day of the week')
          return
        }
        data.daysOfWeek = daysOfWeek
      }

      if (frequency === 'MONTHLY') {
        data.dayOfMonth = dayOfMonth
      }

      if (hasEndDate && endDate) {
        data.endDate = new Date(endDate).toISOString()
      }

      const url = `/api/v1/tasks/${taskId}/recurring`
      const method = existingConfig ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save recurring task')
      }

      toast.success(
        existingConfig 
          ? 'Recurring task updated successfully!' 
          : 'Recurring task created successfully!'
      )
      
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error('Error saving recurring task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save recurring task')
    } finally {
      setLoading(false)
    }
  }

  const handleStop = async () => {
    if (!confirm('Are you sure you want to stop this recurring task?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/recurring`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to stop recurring task')
      }

      toast.success('Recurring task stopped successfully!')
      
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error) {
      console.error('Error stopping recurring task:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to stop recurring task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Repeat className="h-5 w-5 mr-2" />
            {existingConfig ? 'Edit Recurring Task' : 'Set Up Recurring Task'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interval */}
          <div className="space-y-2">
            <Label htmlFor="interval">
              Repeat every {interval} {frequency.toLowerCase()}
              {interval !== 1 ? 's' : ''}
            </Label>
            <Input
              id="interval"
              type="number"
              min="1"
              max="365"
              value={interval}
              onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Days of Week (for weekly) */}
          {frequency === 'WEEKLY' && (
            <div className="space-y-2">
              <Label>Days of the week</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day.value}`}
                      checked={daysOfWeek.includes(day.value)}
                      onCheckedChange={(checked) => 
                        handleDayOfWeekChange(day.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`day-${day.value}`} className="text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day of Month (for monthly) */}
          {frequency === 'MONTHLY' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Day of the month</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* End Date */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasEndDate"
                checked={hasEndDate}
                onCheckedChange={setHasEndDate}
              />
              <Label htmlFor="hasEndDate">Set end date</Label>
            </div>
            
            {hasEndDate && (
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <div>
              {existingConfig && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleStop}
                  disabled={loading}
                >
                  Stop Recurring
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : existingConfig ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}