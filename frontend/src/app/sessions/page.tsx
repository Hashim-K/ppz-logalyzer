import { Metadata } from 'next'
import SessionsPage from '@/components/SessionsPage'

export const metadata: Metadata = {
  title: 'Sessions - PPZ Logalyzer',
  description: 'Manage your processed log sessions',
}

export default function Page() {
  return <SessionsPage />
}