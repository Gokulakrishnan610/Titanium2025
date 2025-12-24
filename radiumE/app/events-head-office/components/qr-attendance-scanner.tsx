"use client"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Camera, QrCode, CheckCircle, XCircle, AlertCircle, Play, Square } from "lucide-react"
import { useEvents, useMarkAttendance } from "@/lib/hooks/useEvents"
import { Html5QrcodeScanner } from "html5-qrcode";
import { cn } from "@/lib/utils"

interface Event {
  id: number
  event_name: string
  event_date: string
  venue: string
}

interface AttendanceResult {
  success: boolean
  message: string
  participant_id?: number
  error?: string
  participant?: any // Add participant field for full details
}

export default function QRAttendanceScanner() {
  const [selectedEvent, setSelectedEvent] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<AttendanceResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  const { data: events, isLoading: eventsLoading } = useEvents()
  const markAttendanceMutation = useMarkAttendance()

  // Mark attendance via API hook
  const markAttendance = async (hash: string) => {
    if (!selectedEvent) {
      setScanResult({
        success: false,
        message: "Please select an event first",
        error: "No event selected"
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await markAttendanceMutation.mutateAsync({
        eventId: parseInt(selectedEvent),
        hash
      })

      if (result.status === 200) {
        setScanResult({
          success: true,
          message: result.data.message,
          participant_id: result.data.participant_id
        })
      } else if (result.status === 208) {
        setScanResult({
          success: false,
          message: result.data.message,
          participant_id: result.data.participant_id
        })
      }
    } catch (error: any) {
      console.error("Error marking attendance:", error)
      setScanResult({
        success: false,
        message: error.message || "Failed to mark attendance",
        error: error.message
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Start scanning
  const startScanning = () => {
    if (!selectedEvent) return

    scannerRef.current = new Html5QrcodeScanner('reader', {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    }, false)

    scannerRef.current.render(onScanSuccess, onScanFailure)
    setIsScanning(true)
  }

  // Stop scanning
  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setIsScanning(false)
  }

  // Scan success callback
  const onScanSuccess = (decodedText: string, decodedResult: any) => {
    markAttendance(decodedText)
  }

  // Scan failure callback
  const onScanFailure = (errorMessage: string) => {
    console.error("QR scan error:", errorMessage)
  }

  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [])
    

  return (
    <div className="w-full">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">QR Attendance Scanner</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Scan QR codes to mark event attendance</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
                Select Event
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-select" className="text-white mb-2 text-sm sm:text-base">Choose Event</Label>
                  <select
                    id="event-select"
                    value={selectedEvent}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-border rounded-md bg-card text-foreground text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="" disabled>Select an event to scan attendance for</option>
                    {eventsLoading ? (
                      <option value="" disabled>Loading events...</option>
                    ) : events?.results?.length ? (
                      events.results.map((event: Event) => (
                        <option key={event.id} value={event.id.toString()}>
                          {event.event_name} - {new Date(event.event_date).toLocaleDateString()}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No events available</option>
                    )}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-base sm:text-lg">Camera Scanner</span>
                </div>
                <Button
                  onClick={isScanning ? stopScanning : startScanning}
                  disabled={!selectedEvent}
                  variant={isScanning ? "destructive" : "default"}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {isScanning ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop Scanning
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Start Scanning
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div id="reader" className="w-full max-w-md mx-auto"></div>

                {!isScanning && (
                  <div className="text-center space-y-2">
                    <Camera className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground text-sm sm:text-base">
                      {selectedEvent ? "Click 'Start Scanning' to begin" : "Select an event first"}
                    </p>
                  </div>
                )}

                {isScanning && (
                  <div className="text-center text-xs sm:text-sm text-muted-foreground">
                    Position QR code within the frame to scan
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


          {scanResult && (
            <Card className={cn(
              "border-2",
              scanResult.success ? "border-green-500 bg-card" : "border-red-500 bg-card"
            )}>
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex items-start sm:items-center gap-3">
                  {scanResult.success ? (
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  ) : (
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base break-words">{scanResult.message}</p>
                    {scanResult.participant && (
                      <div className="mt-2 text-xs sm:text-sm text-muted-foreground space-y-1">
                        <div><span className="font-semibold">Name:</span> {scanResult.participant.user?.first_name} {scanResult.participant.user?.last_name}</div>
                        <div><span className="font-semibold">Username:</span> {scanResult.participant.user?.username}</div>
                        <div><span className="font-semibold">Email:</span> {scanResult.participant.user?.email}</div>
                        {scanResult.participant.user?.rollno && <div><span className="font-semibold">Roll No:</span> {scanResult.participant.user.rollno}</div>}
                        {scanResult.participant.user?.department && <div><span className="font-semibold">Department:</span> {scanResult.participant.user.department}</div>}
                        {scanResult.participant.user?.degree && <div><span className="font-semibold">Degree:</span> {scanResult.participant.user.degree}</div>}
                        {scanResult.participant.user?.college_name && <div><span className="font-semibold">College:</span> {scanResult.participant.user.college_name}</div>}
                        <div><span className="font-semibold">Status:</span> {scanResult.participant.registration_status}</div>
                        <div><span className="font-semibold">Payment:</span> {scanResult.participant.payment_status ? "Paid" : "Unpaid"}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>• Select an event from the dropdown above</li>
                <li>• Click "Start Scanning" to activate your camera</li>
                <li>• Position the QR code within the scanning frame</li>
                <li>• The system will automatically detect and mark attendance</li>
                <li>• Alternatively, manually enter the QR hash if scanning fails</li>
                <li>• Green border indicates successful scan, red indicates error</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}