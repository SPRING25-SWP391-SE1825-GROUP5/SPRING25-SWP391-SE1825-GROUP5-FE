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
    // Khách vãng lai: 4 bước (1. Thông tin liên hệ -> 2. Dịch vụ & Xe -> 3. Địa điểm & Thời gian -> 4. Xác nhận)
    { 
      number: 1, 
      label: 'Thông tin liên hệ', 
      icon: UserPlus,
      description: 'Họ tên, SĐT, Email'
    },
    { 
      number: 2, 
      label: 'Dịch vụ & Xe', 
      icon: Wrench,
      description: 'Chọn dịch vụ và thông tin xe'
    },
    { 
      number: 3, 
      label: 'Địa điểm & Thời gian', 
      icon: MapPin,
      description: 'Nơi và thời gian thực hiện'
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
          circle: '#004030', // Brand primary color
          text: '#004030',
          background: '#e6f2f0',
          border: '#004030',
          icon: '#ffffff'
        }
      case 'current':
        return {
          circle: '#4A9782', // Brand secondary color
          text: '#4A9782',
          background: '#cce5e0',
          border: '#4A9782',
          icon: '#ffffff'
        }
      case 'pending':
        return {
          circle: '#f3f4f6', // Gray
          text: '#6b7280',
          background: '#f9fafb',
          border: '#e5e7eb',
          icon: '#9ca3af'
        }
      default:
        return {
          circle: '#f3f4f6',
          text: '#6b7280',
          background: '#f9fafb',
          border: '#e5e7eb',
          icon: '#9ca3af'
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
                  color: colors.icon,
                  cursor: isClickable ? 'pointer' : 'default'
                }}
                onClick={() => handleStepClick(step.number)}
                onMouseEnter={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = `0 8px 25px ${colors.circle}30`
                  }
                }}
                onMouseLeave={(e) => {
                  if (isClickable) {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'
                  }
                }}
              >
                {status === 'completed' ? (
                  <CheckCircle size={20} strokeWidth={2.5} />
                ) : (
                  <IconComponent size={20} strokeWidth={2} />
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
                      backgroundColor: completedSteps.includes(step.number) ? '#004030' : '#e5e7eb'
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
          margin: 2rem 0 3rem 0;
          padding: 0 1rem;
          background: linear-gradient(135deg, #e6f2f0 0%, #cce5e0 100%);
          border-radius: 20px;
          padding: 2rem 1rem;
          box-shadow: 0 4px 20px rgba(74, 151, 130, 0.15);
        }

        .steps-container {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
          max-width: 1200px;
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
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 3;
          background: #ffffff;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }

        .step-circle.completed {
          animation: completedPulse 0.8s ease-out;
          box-shadow: 0 8px 30px rgba(0, 64, 48, 0.3);
        }

        .step-circle.current {
          animation: currentPulse 2.5s infinite;
          box-shadow: 0 8px 30px rgba(74, 151, 130, 0.3);
        }

        .step-circle.clickable:hover {
          transform: scale(1.08);
        }

        .step-content {
          margin-top: 16px;
          text-align: center;
          max-width: 160px;
          padding: 0 8px;
        }

        .step-label {
          font-size: 1rem;
          font-weight: 700;
          line-height: 1.3;
          margin-bottom: 6px;
          transition: all 0.3s ease;
          letter-spacing: -0.025em;
        }

        .step-description {
          font-size: 0.8rem;
          line-height: 1.4;
          opacity: 0.85;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .step-connector {
          position: absolute;
          top: 28px;
          left: 50%;
          right: -50%;
          height: 4px;
          z-index: 1;
        }

        .connector-line {
          width: 100%;
          height: 100%;
          border-radius: 2px;
          transition: all 0.4s ease;
          background: linear-gradient(90deg, #e5e7eb 0%, #e5e7eb 100%);
        }

        .connector-line[style*="004030"] {
          background: linear-gradient(90deg, #004030 0%, #004030 100%);
          box-shadow: 0 2px 8px rgba(0, 64, 48, 0.3);
        }

        /* Animations */
        @keyframes completedPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 12px 40px rgba(0, 64, 48, 0.4);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 8px 30px rgba(0, 64, 48, 0.3);
          }
        }

        @keyframes currentPulse {
          0%, 100% {
            box-shadow: 0 8px 30px rgba(74, 151, 130, 0.3);
          }
          50% {
            box-shadow: 0 8px 30px rgba(74, 151, 130, 0.3), 0 0 0 12px rgba(74, 151, 130, 0.1);
          }
        }

        /* Enhanced hover effects */
        .step-item:hover .step-label {
          transform: translateY(-2px);
        }

        .step-item:hover .step-description {
          opacity: 1;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .steps-container {
            gap: 1rem;
          }
          
          .step-circle {
            width: 56px;
            height: 56px;
          }
          
          .step-content {
            max-width: 140px;
          }
          
          .step-label {
            font-size: 0.9rem;
          }
          
          .step-description {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 768px) {
          .steps-progress-indicator {
            margin: 1.5rem 0 2rem 0;
            padding: 1.5rem 1rem;
            border-radius: 16px;
          }

          .steps-container {
            flex-direction: column;
            gap: 1.5rem;
          }

          .step-item {
            flex-direction: row;
            align-items: center;
            width: 100%;
            text-align: left;
            background: rgba(255, 255, 255, 0.7);
            padding: 1rem;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }

          .step-circle {
            width: 48px;
            height: 48px;
            margin-right: 16px;
            flex-shrink: 0;
          }

          .step-content {
            margin-top: 0;
            text-align: left;
            max-width: none;
            flex: 1;
            padding: 0;
          }

          .step-label {
            font-size: 0.9rem;
            margin-bottom: 4px;
          }

          .step-description {
            font-size: 0.8rem;
          }

          .step-connector {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .steps-progress-indicator {
            padding: 1rem;
            margin: 1rem 0;
          }

          .step-item {
            padding: 0.75rem;
          }

          .step-circle {
            width: 40px;
            height: 40px;
            margin-right: 12px;
          }

          .step-label {
            font-size: 0.8rem;
          }

          .step-description {
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  )
}

export default StepsProgressIndicator