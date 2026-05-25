import DashboardLayout from '@/app/components/DashboardLayout'
import LeadDetailClient from './LeadDetailClient'

export const metadata = { title: 'Lead Detail — Fast Websites' }

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <DashboardLayout>
      <LeadDetailClient id={id} />
    </DashboardLayout>
  )
}
