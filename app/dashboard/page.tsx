import DashboardLayout from '@/app/components/DashboardLayout'
import LeadsClient from './LeadsClient'

export const metadata = { title: 'Leads — Fast Websites' }

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <LeadsClient />
    </DashboardLayout>
  )
}
