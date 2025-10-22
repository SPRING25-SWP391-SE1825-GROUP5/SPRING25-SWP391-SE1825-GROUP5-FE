import React from 'react'
import { User, Car, Wrench, MapPin, UserPlus, CheckCircle } from 'lucide-react'

interface StepsProgressIndicatorProps {
  currentStep: number
  completedSteps: number[]
  onStepClick: (step: number) => void
  isGuest: boolean
}

const StepsProgressIndicator: React.FC<StepsProgressIndicatorProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  isGuest
}) => {
  const steps = isGuest ? [
    // Khách vãng lai: 4 bước (gộp Dịch vụ & Xe)
    { 
      number: 1, 
      label: 'Dịch vụ & Xe', 
      icon: Wrench,
      description: 'Chọn dịch vụ và thông tin xe'
    },
    { 
      number: 2, 
      label: 'Địa điểm & Thời gian', 
      icon: MapPin,
      description: 'Nơi và thời gian thực hiện'
    },
    { 
      number: 3, 
      label: 'Thông tin liên hệ', 
      icon: UserPlus,
      description: 'Họ tên, SĐT, Email, Mật khẩu'
    },
    { 
      number: 4, 
      label: 'Xác nhận cuối cùng', 
      icon: CheckCircle,
      description: 'Hoàn tất đặt lịch'
    }
  ] : [
    // Đã đăng nhập: 3 bước (gộp Dịch vụ & Xe)
    { 
      number: 1, 
      label: 'Dịch vụ & Xe', 
      icon: Wrench,
      description: 'Chọn dịch vụ và thông tin xe'
    },
    { 
      number: 2, 
      label: 'Địa điểm & Thời gian', 
      icon: MapPin,
      description: 'Nơi và thời gian thực hiện'
    },
    { 
      number: 3, 
      label: 'Xác nhận cuối cùng', 
      icon: CheckCircle,
      description: 'Hoàn tất đặt lịch'
    }
  ]

  const getStepStatus = (stepNumber: number) => {
    if (completedSteps.includes(stepNumber)) {
      return 'completed'
    } else if (stepNumber === currentStep) {
      return 'current'
    } else if (stepNumber < currentStep) {
      return 'completed'
    } else {
      return 'pending'
    }
  }

  const getStepColor = (stepNumber: number) => {
    const status = getStepStatus(stepNumber)
    
    switch (status) {
      case 'completed':
        return {
          circle: 'var(--progress-completed)',
          text: 'var(--progress-completed)',
          background: 'var(--primary-50)',
          border: 'var(--progress-completed)'
        }
      case 'current':
        return {
          circle: 'var(--progress-current)',
          text: 'var(--progress-current)',
          background: 'var(--primary-50)',
          border: 'var(--progress-current)'
        }
      case 'pending':
        return {
          circle: 'var(--progress-pending)',
          text: 'var(--text-secondary)',
          background: '#f9fafb',
          border: 'var(--border-primary)'
        }
      default:
        return {
          circle: 'var(--progress-pending)',
          text: 'var(--text-secondary)',
          background: '#f9fafb',
          border: 'var(--border-primary)'
        }
    }
  }

  const handleStepClick = (stepNumber: number) => {
    // Chỉ cho phép click vào các bước đã hoàn thành hoặc bước hiện tại
    if (completedSteps.includes(stepNumber) || stepNumber === currentStep || stepNumber <= currentStep) {
      onStepClick(stepNumber)
    }
  }

  return (
    <div className="steps-progress-indicator">
      <div className="steps-container">
        {steps.map((step, index) => {
          const IconComponent = step.icon
          const colors = getStepColor(step.number)
          const status = getStepStatus(step.number)
          const isClickable = completedSteps.includes(step.number) || step.number === currentStep || step.number <= currentStep

          return (
            <div key={step.number} className="step-item">
              {/* Step Circle */}
              <div 
                className={`step-circle ${status} ${isClickable ? 'clickable' : ''}`}
                style={{
                  backgroundColor: colors.circle,
                  borderColor: colors.border,
                  color: status === 'completed' ? '#ffffff' : colors.text,
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => handleStepClick(step.number)}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = `0 4px 12px ${colors.circle}40`
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }
                }}
              >
                {status === 'completed' ? (
                  <CheckCircle size={20} />
                ) : (
                  <IconComponent size={20} />
                )}
              </div>

              {/* Step Content */}
              <div className="step-content">
                <div 
                  className="step-label"
                  style={{ color: colors.text }}
                >
                  {step.label}
                </div>
                <div 
                  className="step-description"
                  style={{ color: colors.text }}
                >
                  {step.description}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="step-connector">
                  <div 
                    className="connector-line"
                    style={{
                      backgroundColor: completedSteps.includes(step.number) ? 'var(--progress-completed)' : 'var(--progress-connector)'
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* CSS Styles */}
      <style>{`
        .steps-progress-indicator {
          margin: 1.5rem 0 2rem 0;
          padding: 0 1rem;
        }

        .steps-container {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          max-width: 1000px;
          margin: 0 auto;
        }

        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex: 1;
          z-index: 2;
        }

        .step-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 3;
          background: #ffffff;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .step-circle.completed {
          animation: completedPulse 0.6s ease-out;
        }

        .step-circle.current {
          animation: currentPulse 2s infinite;
        }

        .step-circle.clickable:hover {
          transform: scale(1.05);
        }

        .step-content {
          margin-top: 10px;
          text-align: center;
          max-width: 140px;
        }

        .step-label {
          font-size: 0.875rem;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 4px;
          transition: color 0.3s ease;
        }

        .step-description {
          font-size: 0.75rem;
          line-height: 1.2;
          opacity: 0.8;
          transition: color 0.3s ease;
        }

        .step-connector {
          position: absolute;
          top: 24px;
          left: 50%;
          right: -50%;
          height: 3px;
          z-index: 1;
        }

        .connector-line {
          width: 100%;
          height: 100%;
          border-radius: 2px;
          transition: background-color 0.3s ease;
        }

        /* Animations */
        @keyframes completedPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes currentPulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0);
          }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .steps-container {
            flex-direction: column;
            gap: 1rem;
          }

          .step-item {
            flex-direction: row;
            align-items: center;
            width: 100%;
            text-align: left;
          }

          .step-circle {
            width: 44px;
            height: 44px;
            margin-right: 16px;
            flex-shrink: 0;
          }

          .step-content {
            margin-top: 0;
            text-align: left;
            max-width: none;
            flex: 1;
          }

          .step-label {
            font-size: 0.8rem;
          }

          .step-description {
            font-size: 0.7rem;
          }

          .step-connector {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .step-circle {
            width: 36px;
            height: 36px;
          }

          .step-label {
            font-size: 0.75rem;
          }

          .step-description {
            font-size: 0.65rem;
          }
        }
      `}</style>
    </div>
  )
}

export default StepsProgressIndicator