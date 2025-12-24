"use client"
import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import AdminLayout from "../../components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEventODList, useDownloadEventODList, useEvent } from "@/lib/hooks/useEvents"
import { Download, Search, Filter, ArrowLeft, Users, CheckCircle, XCircle } from "lucide-react"

interface ODListEntry {
  id: number
  user_id: number
  user_name: string
  user_email: string
  user_phone: string
  user_college: string
  user_department: string
  user_year: string
  attended: boolean
  registration_date: string
}

export default function EventODListPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = parseInt(params.eventId as string)

  const [searchTerm, setSearchTerm] = useState("")
  const [attendanceFilter, setAttendanceFilter] = useState("")

  const { data: odListData, isLoading, error } = useEventODList(eventId)
  const { data: eventData } = useEvent(eventId)
  const downloadMutation = useDownloadEventODList()

  const filteredData = useMemo(() => {
    if (!odListData) return []

    return odListData.filter((entry: ODListEntry) => {
      const matchesSearch = !searchTerm ||
        entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user_college.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user_department.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesAttendance = !attendanceFilter ||
        (attendanceFilter === "attended" && entry.attended) ||
        (attendanceFilter === "not_attended" && !entry.attended)

      return matchesSearch && matchesAttendance
    })
  }, [odListData, searchTerm, attendanceFilter])

  const stats = useMemo(() => {
    if (!odListData) return { total: 0, attended: 0, notAttended: 0 }
    const attended = odListData.filter((entry: ODListEntry) => entry.attended).length
    return {
      total: odListData.length,
      attended,
      notAttended: odListData.length - attended
    }
  }, [odListData])

  const handleDownload = async () => {
    try {
      const blob = await downloadMutation.mutateAsync(eventId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `od_list_${eventId}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      alert(error.message || "Failed to download OD list")
    }
  }

  if (isLoading) {
    return (
      <AdminLayout title="OD List">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading OD list...</span>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="OD List">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading OD list: {error.message}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </AdminLayout>
    )
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/events-head-office/manage-events');
    }
  };

  return (
    <AdminLayout title="OD List">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="shrink-0"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">OD List</h1>
                <p className="text-sm sm:text-base text-muted-foreground font-medium truncate">{eventData?.event_name || `Event #${eventId}`}</p>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={downloadMutation.isPending} size="sm" className="shrink-0">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{downloadMutation.isPending ? "Downloading..." : "Download CSV"}</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>

          {/* Event Info Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs px-2 py-1">
              <span className="font-medium">Deadline:</span> {eventData ? new Date(eventData.registration_deadline).toLocaleDateString() : 'Loading...'}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-1">
              <span className="font-medium">Event:</span> {eventData ? `${new Date(eventData.event_date).toLocaleDateString()} ${eventData.start_time}-${eventData.end_time}` : 'Loading...'}
            </Badge>
            {eventData?.event_end_date && eventData.event_end_date !== eventData.event_date && (
              <Badge variant="outline" className="text-xs px-2 py-1">
                <span className="font-medium">End:</span> {new Date(eventData.event_end_date).toLocaleDateString()} {eventData.end_time}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Participants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.attended}</p>
                  <p className="text-sm text-muted-foreground">Attended</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.notAttended}</p>
                  <p className="text-sm text-muted-foreground">Not Attended</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background h-10 sm:h-11"
                />
              </div>
              <select
                value={attendanceFilter}
                onChange={(e) => setAttendanceFilter(e.target.value)}
                className="w-full h-10 sm:h-11 px-3 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                title="Filter by attendance status"
              >
                <option value="">All Participants</option>
                <option value="attended">Attended Only</option>
                <option value="not_attended">Not Attended Only</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
  <Card className="overflow-hidden w-full max-w-full">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Participants ({filteredData.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 overflow-hidden w-full max-w-full">
            {/* Mobile Card View */}
            <div className="sm:hidden space-y-3 pb-4 w-full max-w-full">
              {filteredData.map((entry: ODListEntry) => (
                <div key={entry.id} className="bg-card border border-border rounded-lg p-4 space-y-3 w-full max-w-full">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-base truncate">{entry.user_name}</div>
                      <div className="text-sm text-muted-foreground truncate">{entry.user_email}</div>
                    </div>
                    <Badge variant={entry.attended ? "default" : "secondary"} className="ml-2 shrink-0">
                      {entry.attended ? "Attended" : "Not Attended"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="font-medium">Phone:</span>
                      <span className="truncate ml-2">{entry.user_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">College:</span>
                      <span className="truncate ml-2">{entry.user_college}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Department:</span>
                      <span className="truncate ml-2">{entry.user_department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Year:</span>
                      <span className="truncate ml-2">{entry.user_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Registered:</span>
                      <span className="truncate ml-2">{new Date(entry.registration_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Phone</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">College</th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">Department</th>
                    <th className="text-left p-3 font-medium hidden xl:table-cell">Year</th>
                    <th className="text-left p-3 font-medium">Attendance</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((entry: ODListEntry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{entry.user_name}</div>
                        <div className="text-xs text-muted-foreground sm:hidden">{entry.user_email}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{entry.user_email}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{entry.user_phone}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{entry.user_college}</td>
                      <td className="p-3 text-muted-foreground hidden lg:table-cell">{entry.user_department}</td>
                      <td className="p-3 text-muted-foreground hidden xl:table-cell">{entry.user_year}</td>
                      <td className="p-3">
                        <Badge variant={entry.attended ? "default" : "secondary"}>
                          {entry.attended ? "Attended" : "Not Attended"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">
                        {new Date(entry.registration_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredData.length === 0 && (
              <div className="text-center py-8 px-4">
                <p className="text-muted-foreground">No participants found matching your criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
