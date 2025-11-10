import './technician.scss'
import WorkQueueComponent from '@/components/technician/WorkQueue'
import ErrorBoundary from '@/components/common/ErrorBoundary'

export default function WorkQueue() {
  return (
    <section className="container py-4 technician-page">
      <ErrorBoundary>
        <WorkQueueComponent />
      </ErrorBoundary>
    </section>
  )
}
