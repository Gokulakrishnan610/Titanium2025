"use client"
import AdminLayout from "./components/admin-layout"
import EventCreationForm from "./components/event-creation-form"

export default function Page() {
  return (
    <AdminLayout title="Event Management">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <EventCreationForm />
      </div>
    </AdminLayout>
  )
}
