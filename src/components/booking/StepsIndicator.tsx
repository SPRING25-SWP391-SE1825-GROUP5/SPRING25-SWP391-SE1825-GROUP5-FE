import React from 'react'

interface StepsIndicatorProps {
  currentStep: number
  onStepClick: (step: number) => void
}

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep, onStepClick }) => {
  const steps = [
    { number: 1, label: 'Dịch vụ' },
    { number: 2, label: 'Xe' },
    { number: 3, label: 'Thời gian' },
    { number: 4, label: 'Xác nhận' }
  ]

  const handleStepClick = (stepNumber: number) => {
    // Allow clicking on any step (for navigation)
    onStepClick(stepNumber)
    setTimeout(() => {
      const stepsIndicator = document.querySelector('.steps-indicator')
      if (stepsIndicator) {
        stepsIndicator.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  return (
    <div className="steps-indicator" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      marginBottom: '2rem',
      marginTop: '4rem',
      padding: '1rem 0'
    }}>
      {steps.map((step, index) => (
        <div key={step.number} style={{ display: 'flex', alignItems: 'center' }}>
          {/* Step Circle */}
          <div 
            className={`step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
            style={{ 
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: currentStep >= step.number ? '#10b981' : '#f3f4f6',
              color: currentStep >= step.number ? '#ffffff' : '#9ca3af',
              fontWeight: '700',
              fontSize: '14px',
              cursor: step.number <= currentStep ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              border: currentStep >= step.number ? '2px solid #10b981' : '2px solid #e5e7eb',
              position: 'relative',
              zIndex: 2
            }}
            onClick={() => handleStepClick(step.number)}
            onMouseEnter={(e) => {
              if (step.number <= currentStep) {
                e.currentTarget.style.transform = 'scale(1.02)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {currentStep > step.number ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            ) : (
              step.number
            )}
          </div>
          
          {/* Step Label */}
          <div style={{ 
            marginLeft: '8px',
            color: currentStep >= step.number ? '#10b981' : '#6b7280',
            fontWeight: currentStep >= step.number ? '600' : '500',
            fontSize: '12px',
            minWidth: '70px',
            textAlign: 'center',
            transition: 'all 0.2s ease'
          }}>
            {step.label}
          </div>
          
          {/* Connector Line */}
          {index < steps.length - 1 && (
            <div style={{
              width: '40px',
              height: '2px',
              backgroundColor: currentStep > step.number ? '#10b981' : '#e5e7eb',
              margin: '0 12px',
              transition: 'all 0.2s ease',
              borderRadius: '1px',
              position: 'relative',
              zIndex: 1
            }}>
              {/* Animated progress line */}
              {currentStep > step.number && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: '100%',
                  backgroundColor: '#10b981',
                  borderRadius: '2px',
                  animation: 'progressLine 0.5s ease-out'
                }} />
              )}
            </div>
          )}
        </div>
      ))}
      
      <style jsx>{`
        @keyframes progressLine {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default StepsIndicator
