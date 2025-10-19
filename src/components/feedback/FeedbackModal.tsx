import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import FeedbackForm, { FeedbackData } from './FeedbackForm'
import './FeedbackModal.scss'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId: string
  serviceName: string
  technician: string
  partsUsed: string[]
  onSubmit: (feedback: FeedbackData) => Promise<void>
  initialData?: Partial<FeedbackData>
}

export default function FeedbackModal({
  isOpen,
  onClose,
  bookingId,
  serviceName,
  technician,
  partsUsed,
  onSubmit,
  initialData
}: FeedbackModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  const handleSubmit = async (feedback: FeedbackData) => {
    setIsLoading(true)
    try {
      await onSubmit(feedback)
      onClose()
    } catch (error) {
      console.error('Error submitting feedback:', error)
      // Error handling could be improved with toast notifications
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="feedback-modal">
      <div className="feedback-modal__backdrop" onClick={handleClose} />
      
      <div className="feedback-modal__container">
        <div className="feedback-modal__content">
          <FeedbackForm
            bookingId={bookingId}
            serviceName={serviceName}
            technician={technician}
            partsUsed={partsUsed}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            initialData={initialData}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
