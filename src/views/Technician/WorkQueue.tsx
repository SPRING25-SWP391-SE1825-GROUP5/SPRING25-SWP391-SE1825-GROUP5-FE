import './technician.scss'
import WorkQueueComponent from '@/components/technician/WorkQueue'

export default function WorkQueue() {
  const handleViewDetails = (work: any) => {
    console.log('View details for work:', work)
    // TODO: Implement view details functionality
  }

  return (
    <section className="container py-4 technician-page">
      <WorkQueueComponent onViewDetails={handleViewDetails} />
    </section>
  )
}
