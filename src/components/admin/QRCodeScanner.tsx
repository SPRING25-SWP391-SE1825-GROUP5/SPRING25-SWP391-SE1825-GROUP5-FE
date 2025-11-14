import React, { useRef, useEffect, useState } from 'react'
import { QrCode, X, Camera, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'
import './QRCodeScanner.scss'

interface QRCodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onCheckInSuccess?: (bookingId: number) => void
}

/**
 * QR Code Scanner Component for Staff Check-in
 * Scans QR code and calls check-in API
 */
const QRCodeScanner: React.FC<QRCodeScannerProps> = ({
  isOpen,
  onClose,
  onCheckInSuccess
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [scanning, setScanning] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ bookingId: number; message: string } | null>(null)
  const [manualBookingId, setManualBookingId] = useState<string>('')
  const [showManualInput, setShowManualInput] = useState(false)

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      resetState()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setError(null)
      setScanning(true)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Use back camera on mobile
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      // Start QR code scanning
      startQRScanning()
    } catch (err: any) {
      setError('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
      setScanning(false)
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const resetState = () => {
    setScanning(false)
    setCheckingIn(false)
    setError(null)
    setSuccess(null)
    setManualBookingId('')
    setShowManualInput(false)
  }

  const startQRScanning = () => {
    // For now, we'll use manual input or a library like html5-qrcode
    // In production, you might want to use a library like:
    // - html5-qrcode
    // - jsQR
    // - @zxing/library

    // For this implementation, we'll provide manual input as fallback
    // and show instructions for using a QR scanner library
  }

  const handleManualCheckIn = async () => {
    const bookingId = parseInt(manualBookingId.trim())

    if (!bookingId || isNaN(bookingId)) {
      setError('Vui lòng nhập mã đặt lịch hợp lệ')
      return
    }

    await performCheckIn(bookingId)
  }

  const performCheckIn = async (bookingId: number) => {
    try {
      setCheckingIn(true)
      setError(null)
      setSuccess(null)

      const response = await BookingService.checkInBooking(bookingId)

      if (response.success) {
        setSuccess({
          bookingId: bookingId,
          message: response.message || 'Check-in thành công!'
        })
        toast.success(`Check-in thành công cho booking #${bookingId}`)

        if (onCheckInSuccess) {
          onCheckInSuccess(bookingId)
        }

        // Reset after 2 seconds
        setTimeout(() => {
          resetState()
          if (showManualInput) {
            setShowManualInput(false)
          }
        }, 2000)
      } else {
        setError(response.message || 'Không thể check-in')
        toast.error(response.message || 'Không thể check-in')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi khi thực hiện check-in'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setCheckingIn(false)
    }
  }

  const handleQRCodeScanned = (bookingId: number) => {
    // This will be called when QR code is successfully scanned
    performCheckIn(bookingId)
  }

  if (!isOpen) return null

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-scanner__header">
          <div className="qr-scanner__header-left">
            <QrCode size={24} color="#10B981" />
            <h2>Quét mã QR Check-in</h2>
          </div>
          <button className="qr-scanner__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="qr-scanner__content">
          {/* Camera View */}
          <div className="qr-scanner__camera">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="qr-scanner__video"
            />
            {!scanning && (
              <div className="qr-scanner__camera-placeholder">
                <Camera size={48} color="#9ca3af" />
                <p>Camera đang được khởi động...</p>
              </div>
            )}
            {scanning && (
              <div className="qr-scanner__scan-area">
                <div className="scan-frame"></div>
                <p>Đưa mã QR vào khung</p>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="qr-scanner__error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="qr-scanner__success">
              <CheckCircle size={16} />
              <span>{success.message}</span>
              <p className="qr-scanner__success-id">Booking ID: #{success.bookingId}</p>
            </div>
          )}

          {/* Manual Input */}
          <div className="qr-scanner__manual">
            <button
              className="qr-scanner__manual-toggle"
              onClick={() => setShowManualInput(!showManualInput)}
            >
              {showManualInput ? 'Ẩn' : 'Nhập mã đặt lịch thủ công'}
            </button>

            {showManualInput && (
              <div className="qr-scanner__manual-input">
                <input
                  type="number"
                  placeholder="Nhập mã đặt lịch (ví dụ: 123)"
                  value={manualBookingId}
                  onChange={(e) => setManualBookingId(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualCheckIn()
                    }
                  }}
                  disabled={checkingIn}
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={checkingIn || !manualBookingId.trim()}
                  className="qr-scanner__manual-submit"
                >
                  {checkingIn ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Check-in'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="qr-scanner__instructions">
            <h4>Hướng dẫn:</h4>
            <ul>
              <li>Quét mã QR từ điện thoại của khách hàng</li>
              <li>Hoặc nhập mã đặt lịch thủ công</li>
              <li>Chỉ có thể check-in booking ở trạng thái "Đã xác nhận"</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QRCodeScanner

