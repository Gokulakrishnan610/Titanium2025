"use client"
import { useProfile } from "@/lib/hooks/useAuth"
import Link from "next/link"

export default function DebugUserPage() {
  const { data: user, isLoading, error } = useProfile()

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {String(error)}</div>
  }

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">User Debug Information</h1>
      
      <div className="mb-6">
        <Link href="/" className="text-blue-400 hover:underline">← Back to Home</Link>
      </div>

      {!user ? (
        <div className="text-yellow-400">No user logged in</div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">User Object</h2>
            <pre className="bg-black p-4 rounded overflow-x-auto text-xs">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Admin Status Check</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-mono text-gray-400">is_eventStaff:</span>{' '}
                <span className={user.is_eventStaff ? 'text-green-400' : 'text-red-400'}>
                  {String(user.is_eventStaff)} ({typeof user.is_eventStaff})
                </span>
              </div>
              <div>
                <span className="font-mono text-gray-400">is_superuser:</span>{' '}
                <span className={user.is_superuser ? 'text-green-400' : 'text-red-400'}>
                  {String(user.is_superuser)} ({typeof user.is_superuser})
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <span className="font-mono text-gray-400">Computed isAdmin:</span>{' '}
                <span className={user.is_eventStaff || user.is_superuser ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {String(user.is_eventStaff || user.is_superuser)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">All Keys in User Object</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(user).map(key => (
                <span key={key} className="bg-blue-900 px-2 py-1 rounded text-xs font-mono">
                  {key}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
