import DashboardLayout from '@/app/components/DashboardLayout'
import RedditClient from './RedditClient'

export const metadata = { title: 'Reddit Monitor — Fast Websites' }

export default function RedditPage() {
  return (
    <DashboardLayout>
      <RedditClient />
    </DashboardLayout>
  )
}
