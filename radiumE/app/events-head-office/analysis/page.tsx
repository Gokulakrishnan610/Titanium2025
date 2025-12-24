"use client"
import { useState } from "react"
import AdminLayout from "../components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEvents } from "@/lib/hooks/useEvents"
import { useEventParticipants } from "@/lib/hooks/useEvents"
import { Download, Calendar, Users, UserCheck, BarChart3, Eye, PieChart } from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export default function AnalysisPage() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  const { data: eventsData, isLoading: eventsLoading } = useEvents({})

  const { data: participantsData, isLoading: participantsLoading } = useEventParticipants(
    selectedEventId || 0,
    {},
    !!selectedEventId
  )

  const events = eventsData?.results || []

  const selectedEventStats = selectedEventId && participantsData ? (() => {
    const participants = participantsData.results || []
    const totalParticipants = participantsData.count || participants.length
    const attendedCount = participants.filter((p) => (p as any).attendance).length
    const event = events.find(e => e.id === selectedEventId)

    return {
      event_name: event?.event_name || 'Unknown Event',
      event_date: event?.event_date || '',
      total_participants: totalParticipants,
      attended_count: attendedCount,
      attendance_rate: totalParticipants > 0 ? (attendedCount / totalParticipants) * 100 : 0
    }
  })() : null

  const eventStatusData = [
    { name: 'Past Events', value: events.filter(e => !e.is_upcoming).length, color: '#0088FE' },
    { name: 'Upcoming Events', value: events.filter(e => e.is_upcoming).length, color: '#00C49F' }
  ]

  const monthlyData = events.reduce((acc: Record<string, { month: string; events: number; past: number; upcoming: number }>, event) => {
    const date = new Date(event.event_date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, events: 0, past: 0, upcoming: 0 }
    }
    acc[monthKey].events += 1
    if (event.is_upcoming) {
      acc[monthKey].upcoming += 1
    } else {
      acc[monthKey].past += 1
    }
    return acc
  }, {})

  const monthlyChartData = Object.values(monthlyData).sort((a: { month: string }, b: { month: string }) => a.month.localeCompare(b.month))

  const generateContributionData = () => {
    const today = new Date()
    const oneYearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000)

    const contributionMap = new Map<string, number>()

    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0]
      contributionMap.set(dateKey, 0)
    }

    events.forEach(event => {
      const eventDate = new Date(event.event_date).toISOString().split('T')[0]
      if (contributionMap.has(eventDate)) {
        contributionMap.set(eventDate, contributionMap.get(eventDate)! + 1)
      }
    })

    return Array.from(contributionMap.entries()).map(([date, count]) => ({
      date,
      count,
      level: Math.min(count, 4) 
    }))
  }

  const contributionData = generateContributionData()

  const handleViewEventStats = (eventId: number) => {
    setSelectedEventId(selectedEventId === eventId ? null : eventId)
  }

  const handleExportAnalysis = () => {
    const now = new Date()
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000))
    const timestamp = istTime.toISOString().replace('T', '_').replace(/\..+/, '').replace(/:/g, '-')

    const csvHeader = 'Event Name,Event Date,Status\n'
    const csvRows = events.map(event =>
      `"${event.event_name}","${new Date(event.event_date).toLocaleDateString()}","${event.is_upcoming ? 'Upcoming' : 'Past'}"`
    ).join('\n')
    const csvContent = csvHeader + csvRows

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `event_analysis_${timestamp}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <AdminLayout title="Event Analysis">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-4 lg:px-6 xl:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-xl sm:text-2xl font-bold">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Past Events</p>
                  <p className="text-xl sm:text-2xl font-bold">{events.filter(e => !e.is_upcoming).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Upcoming Events</p>
                  <p className="text-xl sm:text-2xl font-bold">{events.filter(e => e.is_upcoming).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Events This Month</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {events.filter(e => {
                      const eventDate = new Date(e.event_date)
                      const now = new Date()
                      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                Event Status Distribution
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Breakdown of events by their current status - past events that have already occurred vs upcoming events scheduled for the future.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                  <RechartsPieChart>
                    <Pie
                      data={eventStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} events (${((value / events.length) * 100).toFixed(1)}%)`,
                        name
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>

                {/* Legend with additional details */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                  {eventStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="text-xs sm:text-sm">
                        <div className="font-medium">{entry.name}</div>
                        <div className="text-muted-foreground">
                          {entry.value} events ({((entry.value / events.length) * 100).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary statistics */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">{events.filter(e => !e.is_upcoming).length}</div>
                    <div className="text-xs text-muted-foreground">Past Events</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{events.filter(e => e.is_upcoming).length}</div>
                    <div className="text-xs text-muted-foreground">Upcoming Events</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                Monthly Event Distribution
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Monthly breakdown showing the number of past and upcoming events over time. Helps identify busy periods and event planning patterns.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `${value} events`,
                        name
                      ]}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="past" stackId="a" fill="#0088FE" name="Past Events" />
                    <Bar dataKey="upcoming" stackId="a" fill="#00C49F" name="Upcoming Events" />
                  </BarChart>
                </ResponsiveContainer>

                {/* Summary statistics for bar chart */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t text-center">
                  <div>
                    <div className="text-base sm:text-lg font-bold text-blue-600">
                      {monthlyChartData.reduce((sum, month) => sum + (month.past || 0), 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Past Events</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-green-600">
                      {monthlyChartData.reduce((sum, month) => sum + (month.upcoming || 0), 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Upcoming Events</div>
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-bold text-purple-600">
                      {monthlyChartData.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Months Tracked</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              Event Activity Calendar
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              GitHub-style contribution calendar showing event activity over the past year. Each square represents a day, with darker colors indicating more events on that date. Hover over squares for detailed information.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <ContributionCalendar data={contributionData} />

              {/* Calendar statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t text-center">
                <div>
                  <div className="text-base sm:text-lg font-bold text-green-600">
                    {contributionData.filter(d => d.count > 0).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active Days</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-blue-600">
                    {Math.max(...contributionData.map(d => d.count))}
                  </div>
                  <div className="text-xs text-muted-foreground">Max Events/Day</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-purple-600">
                    {(contributionData.reduce((sum, d) => sum + d.count, 0) / contributionData.filter(d => d.count > 0).length).toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Events/Day</div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-bold text-orange-600">
                    {contributionData.filter(d => d.count >= 3).length}
                  </div>
                  <div className="text-xs text-muted-foreground">High Activity Days</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0">
          <Button onClick={handleExportAnalysis} className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export Event List 
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Event-wise Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm sm:text-base">Loading events...</span>
              </div>
            ) : events.length > 0 ? (
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Event Name</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Date</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {events.map((event) => (
                        <tr key={event.id} className="hover:bg-muted/50">
                          <td className="px-2 sm:px-4 py-2 sm:py-3">
                            <div className="text-sm font-medium text-foreground">{event.event_name}</div>
                            <div className="text-xs text-muted-foreground sm:hidden">{new Date(event.event_date).toLocaleDateString()}</div>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm text-muted-foreground hidden sm:table-cell">
                            {new Date(event.event_date).toLocaleDateString()}
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <Badge variant={event.is_upcoming ? "default" : "secondary"} className="text-xs">
                              {event.is_upcoming ? 'Upcoming' : 'Past'}
                            </Badge>
                          </td>
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEventStats(event.id)}
                              className="text-xs h-7 w-full sm:w-auto"
                            >
                              <Eye className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">{selectedEventId === event.id ? 'Hide' : 'View'} Stats</span>
                              <span className="sm:hidden">{selectedEventId === event.id ? 'Hide' : 'View'}</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No events found for analysis</p>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedEventId && selectedEventStats && (
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                {selectedEventStats.event_name} - Detailed Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {participantsLoading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm sm:text-base">Loading participant data...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-xl sm:text-2xl font-bold">{selectedEventStats.total_participants}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Total Participants</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-xl sm:text-2xl font-bold">{selectedEventStats.attended_count}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Attended</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-purple-600" />
                    <p className="text-xl sm:text-2xl font-bold">{selectedEventStats.attendance_rate.toFixed(1)}%</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Attendance Rate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}

function ContributionCalendar({ data }: { data: Array<{ date: string; count: number; level: number }> }) {
  const weeks: Array<Array<{ date: string; count: number; level: number } | null>> = []
  const startDate = new Date(data[0]?.date || new Date())

  const firstSunday = new Date(startDate)
  firstSunday.setDate(startDate.getDate() - startDate.getDay())

  let currentWeek: Array<{ date: string; count: number; level: number } | null> = []
  const currentDate = new Date(firstSunday)

  for (let i = 0; i < 53; i++) { 
    for (let j = 0; j < 7; j++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayData = data.find(d => d.date === dateStr)
      currentWeek.push(dayData || { date: dateStr, count: 0, level: 0 })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weeks.push(currentWeek)
    currentWeek = []
  }

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100'
      case 1: return 'bg-green-200'
      case 2: return 'bg-green-300'
      case 3: return 'bg-green-400'
      case 4: return 'bg-green-500'
      default: return 'bg-gray-100'
    }
  }

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-full">
        <div className="flex mb-2">
          <div className="w-6 sm:w-8"></div>
          {Array.from({ length: Math.min(12, Math.ceil(new Date().getMonth() + 1)) }, (_, i) => (
            <div
              key={i}
              className="text-xs text-muted-foreground w-6 sm:w-8 text-center"
            >
              {monthLabels[i]}
            </div>
          ))}
        </div>

        <div className="flex">
          <div className="flex flex-col mr-1 sm:mr-2 text-xs text-muted-foreground">
            {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => (
              <div key={i} className="h-2 w-4 sm:h-3 sm:w-6 leading-3 text-xs flex items-center justify-center">{day}</div>
            ))}
          </div>

          <div className="flex gap-0.5 sm:gap-1 flex-1 min-w-0">
            {weeks.slice(0, Math.min(52, weeks.length)).map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 sm:gap-1 flex-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`flex-1 h-2 sm:h-3 rounded-sm ${getLevelColor(day?.level || 0)} border border-gray-200`}
                    title={day ? `${day.date}: ${day.count} event${day.count !== 1 ? 's' : ''}` : ''}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center sm:justify-end mt-3 sm:mt-4 gap-1 sm:gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm ${getLevelColor(level)} border border-gray-200`}
            />
          ))}
          <span className="hidden sm:inline">More</span>
          <span className="sm:hidden">Events</span>
        </div>
      </div>
    </div>
  )
}