import React, { useState } from 'react'
import { ServiceBookingForm } from '@/components/booking'
import StepsProgressIndicator from '@/components/booking/StepsProgressIndicator'
import './service-booking.scss'

const ServiceBookingView: React.FC = () => {
  const [externalStep, setExternalStep] = useState<number>(1)
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isGuest, setIsGuest] = useState<boolean>(true)

  const handleStepClick = (step: number) => {
    setExternalStep(step)
  }

  return (
    <div className="service-booking-view booking-page" style={{ width: '100vw', position: 'relative' }}>
      {/* Fixed Progress Rail - outside flow to avoid overlap */}
      <aside style={{
        position: 'fixed',
        left: 60,
        top: '50vh',
        transform: 'translateY(-50%)',
        width: '20vw',
        minWidth: 220,
        maxWidth: 360,
        maxHeight: '70vh',
        overflowY: 'auto',
        padding: '8px 4px',
        zIndex: 10
      }}>
        <StepsProgressIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
          isGuest={isGuest}
          orientation="vertical"
          size="compact"
        />
      </aside>

      {/* Content Grid reserves space with a spacer column so content won't be under the fixed rail */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(220px, 20vw) 1fr',
        gap: '1.25rem',
        alignItems: 'start',
        width: '100vw',
        margin: 0,
        padding: '0 24px',
        boxSizing: 'border-box'
      }}>
        <div aria-hidden="true" />
        <div style={{ minWidth: 0 }}>
          <ServiceBookingForm
            showStepper={false}
            externalStep={externalStep}
            onStateChange={({ currentStep, completedSteps, isGuest }) => {
              setCurrentStep(currentStep)
              setCompletedSteps(completedSteps)
              setIsGuest(isGuest)
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default ServiceBookingView

