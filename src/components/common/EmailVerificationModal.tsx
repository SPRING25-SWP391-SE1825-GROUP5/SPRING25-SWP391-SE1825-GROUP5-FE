import { useState } from 'react'
import { X, Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { AuthService } from '@/services/authService'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { getCurrentUser } from '@/store/authSlice'
import './EmailVerificationModal.scss'

interface EmailVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export default function EmailVerificationModal({ isOpen, onClose, userEmail }: EmailVerificationModalProps) {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [step, setStep] = useState<'verify' | 'success'>('verify')
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  if (!isOpen) return null

  const handleVerify = async () => {
    if (!otp.trim() || !user?.id) return

    setLoading(true)
    setMessage(null)

    try {
      await AuthService.verifyEmail({ userId: user.id, otpCode: otp.trim() })
      setMessage({ type: 'success', text: 'Xác thực email thành công!' })
      setStep('success')
      
      // Refresh user data to update emailVerified status immediately
      await dispatch(getCurrentUser())
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Mã OTP không đúng. Vui lòng thử lại.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!userEmail) return

    setLoading(true)
    setMessage(null)

    try {
      await AuthService.resendVerification(userEmail)
      setMessage({ type: 'success', text: 'Đã gửi lại mã OTP. Vui lòng kiểm tra email.' })
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && otp.trim()) {
      handleVerify()
    }
  }

  return (
    <div className="email-verification-modal-overlay" onClick={onClose}>
      <div className="email-verification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="email-verification-modal__header">
          <div className="email-verification-modal__title">
            {step === 'verify' ? (
              <>
                <Mail className="email-verification-modal__icon" />
                <span>Xác thực Email</span>
              </>
            ) : (
              <>
                <CheckCircle className="email-verification-modal__icon success" />
                <span>Xác thực thành công</span>
              </>
            )}
          </div>
          <button className="email-verification-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="email-verification-modal__content">
          {step === 'verify' ? (
            <>
              <div className="email-verification-modal__description">
                <p>Chúng tôi đã gửi mã xác thực đến email:</p>
                <p className="email-verification-modal__email">{userEmail}</p>
                <p>Vui lòng nhập mã OTP 6 chữ số để xác thực tài khoản.</p>
              </div>

              <div className="email-verification-modal__form">
                <div className="email-verification-modal__input-group">
                  <label htmlFor="otp" className="email-verification-modal__label">
                    Mã OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    className="email-verification-modal__input"
                    placeholder="Nhập mã OTP 6 chữ số"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyPress={handleKeyPress}
                    maxLength={6}
                    disabled={loading}
                  />
                </div>

                {message && (
                  <div className={`email-verification-modal__message ${message.type}`}>
                    {message.type === 'error' ? (
                      <AlertCircle size={16} />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <div className="email-verification-modal__actions">
                  <button
                    className="email-verification-modal__btn email-verification-modal__btn--secondary"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                  </button>
                  <button
                    className="email-verification-modal__btn email-verification-modal__btn--primary"
                    onClick={handleVerify}
                    disabled={!otp.trim() || loading}
                  >
                    {loading ? 'Đang xác thực...' : 'Xác thực'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="email-verification-modal__success">
              <CheckCircle className="email-verification-modal__success-icon" />
              <h3>Xác thực email thành công!</h3>
              <p>Tài khoản của bạn đã được xác thực. Bạn có thể sử dụng đầy đủ các tính năng của hệ thống.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
