import React, { useState } from 'react'
import { ServiceBookingForm } from '@/components/booking'
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
      <ServiceBookingForm
        showStepper={false}
        externalStep={externalStep}
        onStateChange={({ currentStep, completedSteps, isGuest }) => {
          setCurrentStep(currentStep)
          setCompletedSteps(completedSteps)
          setIsGuest(isGuest)
        }}
        progressBarProps={{
          currentStep,
          completedSteps,
          onStepClick: handleStepClick,
          isGuest
        }}
      />
    </div>
  )
}

export default ServiceBookingView

