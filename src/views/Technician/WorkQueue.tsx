import './technician.scss'
import WorkQueueComponent from '@/components/technician/WorkQueue'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default function WorkQueue() {
  const handleViewDetails = (work: any) => {
    console.log('View details for work:', work)
    // TODO: Implement view details functionality
  }

  return (
    <section className="container py-4 technician-page">
      <ErrorBoundary>
        <WorkQueueComponent onViewDetails={handleViewDetails} />
      </ErrorBoundary>
    </section>
  )
}
