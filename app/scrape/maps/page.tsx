import DashboardLayout from '@/app/components/DashboardLayout'
import MapsClient from './MapsClient'

export const metadata = { title: 'Google Maps Scraper — Fast Websites' }

export default function MapsPage() {
  return (
    <DashboardLayout>
      <MapsClient />
    </DashboardLayout>
  )
}
