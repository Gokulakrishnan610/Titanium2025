"use client"
import AdminLayout from "../components/admin-layout"
import UserManagement from "../components/user-management"

export default function UserManagementPage() {
  return (
    <AdminLayout title="User Management">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <UserManagement />
      </div>
    </AdminLayout>
  )
}