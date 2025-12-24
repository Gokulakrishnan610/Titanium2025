"use client"

interface AccessDeniedProps {
  title?: string
  message?: string
}

export default function AccessDenied({
  title = "Access Denied",
  message = "Redirecting to home page..."
}: AccessDeniedProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p>{message}</p>
      </div>
    </div>
  )
}