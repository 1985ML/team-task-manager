
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckSquare, Users, BarChart3, Bell, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <CheckSquare className="h-12 w-12 text-indigo-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Team Task Manager</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your team's workflow with powerful task management and collaboration tools
            </p>
            <div className="mt-8 space-x-4">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckSquare className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle className="text-lg">Task Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Create, assign, and track tasks with priorities, due dates, and progress updates
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Organize teams, manage memberships, and collaborate seamlessly on projects
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Monitor team productivity with detailed analytics and progress reports
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Smart Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center">
                  Stay updated with real-time notifications for task assignments and updates
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold mb-4">Ready to boost your team's productivity?</h2>
                <p className="text-xl opacity-90 mb-8">
                  Join thousands of teams already using our task management solution
                </p>
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary" className="bg-white text-indigo-600 hover:bg-gray-100">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  )
}
