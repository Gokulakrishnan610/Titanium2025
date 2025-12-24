"use client"
import AdminLayout from "../components/admin-layout"
import QRAttendanceScanner from "../components/qr-attendance-scanner"

export default function QRAttendancePage() {
  return (
    <AdminLayout title="QR Attendance Scanner">
      <QRAttendanceScanner />
    </AdminLayout>
  )
}