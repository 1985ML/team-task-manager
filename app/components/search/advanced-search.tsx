'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Search, Filter, Save, Star, X, FileText, FolderOpen, MessageSquare } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SearchResult {
  id: string
  entityType: 'TASK' | 'PROJECT' | 'COMMENT'
  title?: string
  name?: string
  content?: string
  description?: string
  relevanceScore: number
  team?: {
    id: string
    name: string
    color?: string
  }
  project?: {
    id: string
    name: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  user?: {
    id: string
    name: string
    email: string
  }
  task?: {
    id: string
    title: string
  }
  status?: string
  priority?: string
  createdAt: string
  updatedAt?: string
}

interface SavedSearch {
  id: string
  name: string
  description?: string
  filters: {
    query?: string
    entityTypes?: string[]
    teamId?: string
    projectId?: string
    status?: string
    priority?: string
    assignedToId?: string
    dueDate?: {
      from?: string
      to?: string
    }
  }
  isDefault: boolean
  createdAt: string
}

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void
}

export function AdvancedSearch({ onResultSelect }: AdvancedSearchProps) {
  const [query, setQuery] = useState('')
  const [entityTypes, setEntityTypes] = useState<string[]>(['TASK', 'PROJECT'])
  const [teamId, setTeamId] = useState('all')
  const [projectId, setProjectId] = useState('all')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [assignedToId, setAssignedToId] = useState('all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveSearchName, setSaveSearchName] = useState('')

  useEffect(() => {
    fetchSavedSearches()
  }, [])

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch('/api/saved-searches')
      if (response.ok) {
        const data = await response.json()
        setSavedSearches(data.savedSearches)
      }
    } catch (error) {
      console.error('Error fetching saved searches:', error)
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        entityTypes: entityTypes.join(','),
        limit: '50'
      })

      if (teamId !== 'all') params.append('teamId', teamId)
      if (projectId !== 'all') params.append('projectId', projectId)

      const response = await fetch(`/api/v1/search?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setResults(data.results)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Search failed')
      }
    } catch (error) {
      console.error('Error performing search:', error)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEntityTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setEntityTypes(prev => [...prev, type])
    } else {
      setEntityTypes(prev => prev.filter(t => t !== type))
    }
  }

  const handleSaveSearch = async () => {
    if (!saveSearchName.trim()) {
      toast.error('Please enter a name for the saved search')
      return
    }

    try {
      const filters = {
        query,
        entityTypes,
        teamId: teamId !== 'all' ? teamId : undefined,
        projectId: projectId !== 'all' ? projectId : undefined,
        status: status !== 'all' ? status : undefined,
        priority: priority !== 'all' ? priority : undefined,
        assignedToId: assignedToId !== 'all' ? assignedToId : undefined
      }

      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: saveSearchName.trim(),
          filters
        })
      })

      if (response.ok) {
        toast.success('Search saved successfully!')
        setSaveSearchName('')
        setShowSaveDialog(false)
        fetchSavedSearches()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to save search')
      }
    } catch (error) {
      console.error('Error saving search:', error)
      toast.error('Failed to save search')
    }
  }

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    const filters = savedSearch.filters
    setQuery(filters.query || '')
    setEntityTypes(filters.entityTypes || ['TASK', 'PROJECT'])
    setTeamId(filters.teamId || 'all')
    setProjectId(filters.projectId || 'all')
    setStatus(filters.status || 'all')
    setPriority(filters.priority || 'all')
    setAssignedToId(filters.assignedToId || 'all')
    
    toast.success(`Loaded search: ${savedSearch.name}`)
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'TASK':
        return <FileText className="h-4 w-4" />
      case 'PROJECT':
        return <FolderOpen className="h-4 w-4" />
      case 'COMMENT':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getResultTitle = (result: SearchResult) => {
    switch (result.entityType) {
      case 'TASK':
        return result.title || 'Untitled Task'
      case 'PROJECT':
        return result.name || 'Untitled Project'
      case 'COMMENT':
        return `Comment on: ${result.task?.title || 'Unknown Task'}`
      default:
        return 'Unknown'
    }
  }

  const getResultDescription = (result: SearchResult) => {
    switch (result.entityType) {
      case 'TASK':
      case 'PROJECT':
        return result.description || 'No description'
      case 'COMMENT':
        return result.content || 'No content'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Advanced Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Search tasks, projects, and comments..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(true)}
              disabled={!query.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Entity Types */}
                <div className="space-y-2">
                  <Label>Search in:</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'TASK', label: 'Tasks' },
                      { value: 'PROJECT', label: 'Projects' },
                      { value: 'COMMENT', label: 'Comments' }
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={type.value}
                          checked={entityTypes.includes(type.value)}
                          onCheckedChange={(checked) => 
                            handleEntityTypeChange(type.value, checked as boolean)
                          }
                        />
                        <Label htmlFor={type.value} className="text-sm">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Filter */}
                <div className="space-y-2">
                  <Label>Team:</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All teams" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All teams</SelectItem>
                      {/* Add team options here */}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Filter */}
                <div className="space-y-2">
                  <Label>Project:</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All projects</SelectItem>
                      <SelectItem value="no-project">No project</SelectItem>
                      {/* Add project options here */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 mr-2" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((savedSearch) => (
                <Button
                  key={savedSearch.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSavedSearch(savedSearch)}
                  className="flex items-center"
                >
                  {savedSearch.isDefault && <Star className="h-3 w-3 mr-1 fill-current" />}
                  {savedSearch.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={`${result.entityType}-${result.id}`}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onResultSelect?.(result)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getEntityIcon(result.entityType)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium truncate">
                            {getResultTitle(result)}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {result.entityType}
                          </Badge>
                          {result.relevanceScore > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {result.relevanceScore}% match
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {getResultDescription(result)}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {result.team && (
                            <span>Team: {result.team.name}</span>
                          )}
                          {result.project && (
                            <span>Project: {result.project.name}</span>
                          )}
                          {result.assignedTo && (
                            <span>Assigned: {result.assignedTo.name}</span>
                          )}
                          {result.status && (
                            <Badge variant="outline" className="text-xs">
                              {result.status}
                            </Badge>
                          )}
                          {result.priority && (
                            <Badge variant="outline" className="text-xs">
                              {result.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Save Search</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="searchName">Search Name</Label>
                <Input
                  id="searchName"
                  placeholder="Enter a name for this search"
                  value={saveSearchName}
                  onChange={(e) => setSaveSearchName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveSearch}>
                  Save Search
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}