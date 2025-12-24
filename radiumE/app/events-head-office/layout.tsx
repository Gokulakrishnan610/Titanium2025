import type { Metadata } from 'next'
import AdminProtectedRoute from '../components/AdminProtectedRoute'
import './globals.css'
import styles from './event-theme.module.css'

export const metadata: Metadata = {
  title: 'Events Management - Admin',
  description: 'Admin panel for managing events',
  generator: 'v0.app',
}

export default function EventsLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AdminProtectedRoute>
      <div className={styles.theme}>
        {children}
      </div>
    </AdminProtectedRoute>
  )
}