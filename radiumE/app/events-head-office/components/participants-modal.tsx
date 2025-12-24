"use client"
import { useState } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useEventParticipants, useDownloadEventODList, useEventQuestions, useUpdateEventQuestions, useEventFormResponses } from "@/lib/hooks/useEvents"
import { useUser } from "@/lib/hooks/useAuth"
import { Users, Search, CheckCircle, XCircle, Clock, Download, FileText, Eye, BarChart2 } from "lucide-react"
import FormBuilder from "./form-builder"

interface ParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: number
  eventName: string
}

interface User {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
  display_name?: string
}

interface EventDetail {
  event_name: string;
  event_date: string;
  venue: string;
}

interface EventRegistration {
  id: number;
  user: User | number;
  registration_status: 'pending' | 'confirmed' | 'cancelled';
  payment_status: boolean;
  registered_at: string;
  attendance?: boolean;
  hash?: string;
  event?: EventDetail | number;
}

interface Question {
  id: number;
  text: string;
  type: string;
  options?: string[];
}
interface FormDataType {
  questions: Question[];
}

interface FormResponse {
  id: number;
  user_details: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name: string;
  };
  answers: Record<string, unknown>;
  submitted_at: string;
}

export default function ParticipantsModal({
  isOpen,
  onClose,
  eventId,
  eventName
}: ParticipantsModalProps) {
  const [statusFilter, setStatusFilter] = useState("")
  const [attendedFilter, setAttendedFilter] = useState("")
  const [search, setSearch] = useState("")
  const [showFormEditor, setShowFormEditor] = useState(false)
  const [formData, setFormData] = useState<FormDataType | null>(null)
  const [showFormResponseModal, setShowFormResponseModal] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<EventRegistration | null>(null)
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)

  const { data: participantsData, isLoading } = useEventParticipants(
    eventId,
    {
      status: statusFilter || undefined,
      attendance: attendedFilter ? (attendedFilter === "true") : undefined,
    },
    isOpen
  )

  const { data: questionsData } = useEventQuestions(eventId, isOpen)

  const downloadODListMutation = useDownloadEventODList()
  const updateQuestionsMutation = useUpdateEventQuestions()

  const hasFormConfigured = questionsData && questionsData.length > 0

  const { data: formResponsesData } = useEventFormResponses(eventId, isOpen && hasFormConfigured)

  const { data: user } = useUser()

  // Transform form responses data to match expected format and filter out empty responses
  const formResponses: FormResponse[] = (formResponsesData || []).filter(response =>
    response.answers && Object.keys(response.answers).length > 0
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return null
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const filteredParticipants = (participantsData?.results as EventRegistration[] || []).filter(participant =>
    !search ||
    (typeof participant.user === 'object' &&
      [participant.user.first_name, participant.user.last_name, participant.user.display_name, participant.user.email, participant.user.username]
        .filter(Boolean)
        .some(val => typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase()))
    )
  )

  const isStaffOrSuperuser = user?.is_eventStaff || user?.is_superuser

  const handleDownloadODList = async () => {
    console.log("Download OD List - Event ID:", eventId, "Event Name:", eventName)

    if (!eventId || eventId <= 0) {
      alert("Invalid event ID. Please try again.")
      return
    }

    // Check if user has staff permissions
    if (!isStaffOrSuperuser) {
      alert("Only staff members can download OD lists. Please contact an administrator if you need access.")
      return
    }

    // Check if we have participants data, which indicates the event exists and is accessible
    if (!participantsData || participantsData.results.length === 0) {
      alert("No participants found for this event. The OD list cannot be generated.")
      return
    }

    try {
      const blob = await downloadODListMutation.mutateAsync(eventId)

      // Set download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${eventName}_od_list_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: unknown) {
      const err = error as Error
      console.error("Download OD List Error:", err, "Event ID:", eventId)

      // Provide more specific error messages based on the error
      if (err.message?.includes("Event not found")) {
        alert("Event not found. The event may have been deleted or you may not have permission to access it.")
      } else if (err.message?.includes("No participants registered for this event")) {
        alert("No participants have registered for this event. The OD list cannot be generated.")
      } else if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
        alert("You don't have permission to download the OD list for this event.")
      } else if (err.message?.includes("500")) {
        alert("Server error occurred while generating the OD list. Please try again later.")
      } else {
        alert(err.message || "Failed to download OD list. Please try again.")
      }
    }
  }

  const handleEditForm = () => {
    setShowFormEditor(true)
  }

  const handleFormDataChange = (data: FormDataType) => {
    setFormData(data)
  }

  const handleSaveForm = async () => {
    if (!formData) return

    try {
      await updateQuestionsMutation.mutateAsync({
        eventId,
        questions: formData.questions || []
      })
      alert("Form updated successfully!")
      setShowFormEditor(false)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      alert(errMsg || "Failed to update form")
    }
  }

  const handleViewFormResponse = (participant: EventRegistration) => {
    setSelectedParticipant(participant)
    setShowFormResponseModal(true)
  }

  const handleDownloadIndividualResponse = (participant: EventRegistration) => {
    const response = formResponses.find(r => r.id === participant.id)
    if (!response) return

    const user = typeof participant.user === 'object' ? participant.user : null
    const username = user?.username || 'Unknown'
    const name = user?.display_name || user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : 'Unknown'
    const email = user?.email || 'No email'

    const csvContent = `Username,Name,Email,Answers,Submitted At\n${username},"${name}","${email}","${formatAnswersForCSV(response.answers)}","${response.submitted_at}"`
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form_response_${username}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const handleDownloadAllResponses = () => {
    const csvHeader = 'Username,Name,Email,Answers,Submitted At\n'
    const csvRows = formResponses.map(response => {
      // Find the participant for this response
      const participant = filteredParticipants.find(p => p.id === response.id)
      const user = participant && typeof participant.user === 'object' ? participant.user : null
      const username = user?.username || 'Unknown'
      const name = user?.display_name || user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : 'Unknown'
      const email = user?.email || 'No email'

      return `${username},"${name}","${email}","${formatAnswersForCSV(response.answers)}","${response.submitted_at}"`
    }).join('\n')
    const csvContent = csvHeader + csvRows
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${eventName}_all_form_responses.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const formatAnswer = (answer: unknown): string => {
    if (answer === null || answer === undefined) return 'Not answered'
    if (typeof answer === 'string' || typeof answer === 'number') return String(answer)
    if (Array.isArray(answer)) return answer.join(', ')
    if (typeof answer === 'boolean') return answer ? 'Yes' : 'No'
    if (typeof answer === 'object') {
      // Handle file uploads or complex objects
      const objAnswer = answer as Record<string, unknown>
      if ('name' in objAnswer && 'url' in objAnswer) {
        return `File: ${String(objAnswer.name)}`
      }
      return JSON.stringify(answer)
    }
    return String(answer)
  }

  const formatAnswersForCSV = (answers: Record<string, unknown>): string => {
    return Object.entries(answers)
      .map(([questionId, answer]) => {
        const questionLabel = getQuestionLabel(questionId)
        const answerValue = formatAnswer(answer)
        return `${questionLabel}: ${answerValue}`
      })
      .join('; ')
  }

  const getQuestionLabel = (questionId: string): string => {
    const question = questionsData?.find(q => q.id === parseInt(questionId))
    return question?.label || `Question ${questionId}`
  }

  const handleAnalyzeForm = () => {
    setShowAnalysisModal(true)
  }

  return (
    <>
      <Modal isOpen={isOpen && !showFormEditor} onClose={onClose} title={`Participants - ${eventName}`} className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[80vh]">
          <div className="flex-shrink-0 space-y-4 sm:space-y-6 pb-4">
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={handleEditForm}
                disabled={!hasFormConfigured}
                className="gap-2 w-full sm:w-auto"
              >
                <FileText className="h-4 w-4" />
                {hasFormConfigured ? "Edit Form" : "No Form Configured"}
              </Button>
              {isStaffOrSuperuser && (
                <Button
                  variant="outline"
                  onClick={handleDownloadODList}
                  disabled={downloadODListMutation.isPending}
                  className="gap-2 w-full sm:w-auto"
                >
                  <Download className="h-4 w-4" />
                  {downloadODListMutation.isPending ? "Downloading..." : "Download OD List"}
                </Button>
              )}
              {hasFormConfigured && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownloadAllResponses}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4" />
                    Download All Responses
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleAnalyzeForm}
                    className="gap-2 w-full sm:w-auto"
                  >
                    <BarChart2 className="h-4 w-4" />
                    Analyze Form
                  </Button>
                </>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
              <label htmlFor="statusFilter" className="sr-only">Status Filter</label>
              <select
                id="statusFilter"
                title="Status Filter"
                value={statusFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <label htmlFor="attendanceFilter" className="sr-only">Attendance Filter</label>
              <select
                id="attendanceFilter"
                title="Attendance Filter"
                value={attendedFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAttendedFilter(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              >
                <option value="">All Attendance</option>
                <option value="true">Attended</option>
                <option value="false">Not Attended</option>
              </select>
            </div>
          </div>

          {/* Participants List - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 sm:py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm sm:text-base">Loading participants...</span>
              </div>
            ) : filteredParticipants.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 pr-1">
                {filteredParticipants.map((participant) => (
                  <div key={participant.id} className="border rounded-lg p-3 sm:p-4 bg-card">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium truncate text-sm sm:text-base">
                          {typeof participant.user === 'object'
                            ? participant.user.display_name || participant.user.username
                            : 'Unknown User'}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {typeof participant.user === 'object' ? participant.user.email : 'No email'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Registered: {new Date(participant.registered_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Badge variant={getStatusBadgeVariant(participant.registration_status)} className="text-xs">
                          {getStatusIcon(participant.registration_status)}
                          <span className="ml-1 capitalize">{participant.registration_status}</span>
                        </Badge>
                        {participant.attendance && (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Attended
                          </Badge>
                        )}
                        <Badge variant={participant.payment_status ? "default" : "destructive"} className="text-xs">
                          {participant.payment_status ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>

                      {typeof participant.user === 'object' && (
                        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded space-y-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                            <span><strong>ID:</strong> {participant.user.id}</span>
                            <span><strong>Username:</strong> {participant.user.username}</span>
                            {participant.user.first_name && (
                              <span className="sm:col-span-2"><strong>Name:</strong> {participant.user.first_name} {participant.user.last_name}</span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 border-t border-muted-foreground/20">
                            <span><strong>Payment:</strong> {participant.payment_status ? 'Paid' : 'Unpaid'}</span>
                            <span><strong>Registered:</strong> {new Date(participant.registered_at).toLocaleString()}</span>
                            {participant.hash && (
                              <span className="col-span-1 sm:col-span-2">
                                <strong>QR:</strong>{' '}
                                <span className="sm:hidden">{participant.hash.length > 15 ? `${participant.hash.substring(0, 15)}...` : participant.hash}</span>
                                <span className="hidden sm:inline">{participant.hash}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {hasFormConfigured && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewFormResponse(participant)}
                            className="flex-1 text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Response
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadIndividualResponse(participant)}
                            className="flex-1 text-xs h-8"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Users className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No participants found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex justify-end items-center pt-3 sm:pt-4 border-t mt-4">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Form Editor Modal */}
      <Modal
        isOpen={showFormEditor}
        onClose={() => setShowFormEditor(false)}
        title={`Edit Form - ${eventName}`}
        className="max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="flex-1 overflow-y-auto min-h-0">
            <FormBuilder
              onFormDataChange={handleFormDataChange}
              initialQuestions={questionsData}
            />
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowFormEditor(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              onClick={handleSaveForm}
              disabled={updateQuestionsMutation.isPending}
              className="w-full sm:w-auto"
            >
              {updateQuestionsMutation.isPending ? "Saving..." : "Save Form"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Form Response Modal */}
      <Modal
        isOpen={showFormResponseModal}
        onClose={() => setShowFormResponseModal(false)}
        title={`Form Response - ${selectedParticipant ? (typeof selectedParticipant.user === 'object' ? selectedParticipant.user.display_name || selectedParticipant.user.username : 'Unknown') : ''}`}
        className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            {selectedParticipant && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 text-sm sm:text-base">Participant Details</h3>
                  <div className="bg-muted/50 p-3 sm:p-4 rounded mb-4">
                    <div className="space-y-2">
                      <p className="text-sm sm:text-base"><strong>Name:</strong> {typeof selectedParticipant.user === 'object' ? selectedParticipant.user.display_name || selectedParticipant.user.username : 'Unknown'}</p>
                      <p className="text-sm sm:text-base"><strong>Email:</strong> {typeof selectedParticipant.user === 'object' ? selectedParticipant.user.email : 'No email'}</p>
                      <p className="text-sm sm:text-base"><strong>Registered:</strong> {new Date(selectedParticipant.registered_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-3 text-sm sm:text-base">Form Responses</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {(() => {
                      const response = formResponses.find(r => r.id === selectedParticipant.id)
                      if (!response) return <p className="text-sm sm:text-base">No response submitted yet.</p>
                      return Object.entries(response.answers).map(([questionId, answer], index) => {
                        // Check if answer is an object with label and value properties
                        const answerObj = typeof answer === 'object' && answer !== null ? answer as Record<string, unknown> : null
                        const hasLabelAndValue = answerObj && 'label' in answerObj && 'value' in answerObj

                        if (hasLabelAndValue) {
                          return (
                            <div key={questionId} className="border rounded p-3 sm:p-4">
                              <p className="font-medium text-sm sm:text-base mb-2">Question {index + 1}</p>
                              <p className="text-sm sm:text-base text-muted-foreground mb-1"><strong>Question:</strong> {String(answerObj.label)}</p>
                              <p className="text-sm sm:text-base text-muted-foreground"><strong>Answer:</strong> {String(answerObj.value)}</p>
                            </div>
                          )
                        } else {
                          // Fallback for other answer formats
                          return (
                            <div key={questionId} className="border rounded p-3 sm:p-4">
                              <p className="font-medium text-sm sm:text-base mb-2">Question {index + 1}</p>
                              <p className="text-sm sm:text-base text-muted-foreground mb-1"><strong>Question:</strong> {getQuestionLabel(questionId)}</p>
                              <p className="text-sm sm:text-base text-muted-foreground"><strong>Answer:</strong> {formatAnswer(answer)}</p>
                            </div>
                          )
                        }
                      })
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 flex justify-end gap-2 pt-3 sm:pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowFormResponseModal(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Analysis Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        title={`Form Analysis - ${eventName}`}
        className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-4xl w-full mx-2 sm:mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex flex-col h-full max-h-[80vh]">
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <div className="space-y-4 sm:space-y-6">
              <h3 className="font-semibold text-base sm:text-lg">Form Response Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-muted p-3 sm:p-4 rounded">
                  <p className="text-xl sm:text-2xl font-bold">{filteredParticipants.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Participants</p>
                </div>
                <div className="bg-muted p-3 sm:p-4 rounded">
                  <p className="text-xl sm:text-2xl font-bold">{formResponses.length}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Responses Submitted</p>
                </div>
                <div className="bg-muted p-3 sm:p-4 rounded">
                  <p className="text-xl sm:text-2xl font-bold">{Math.round((formResponses.length / filteredParticipants.length) * 100)}%</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Response Rate</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-end gap-2 pt-3 sm:pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setShowAnalysisModal(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}