import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { QrCode, Download, CheckCircle, Clock, AlertCircle, X } from 'lucide-react'
import './BookingQRCode.scss'

interface BookingQRCodeProps {
  bookingId: number
  bookingDate?: string
  bookingTime?: string
  centerName?: string
  onClose?: () => void
  isModal?: boolean
}

/**
 * QR Code Generator Component for Booking Check-in
 * Generates QR code containing bookingId for staff to scan
 */
const BookingQRCode: React.FC<BookingQRCodeProps> = ({
  bookingId,
  bookingDate,
  bookingTime,
  centerName,
  onClose,
  isModal = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expiryTime, setExpiryTime] = useState<Date | null>(null)

  // Generate QR code data
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        setIsGenerating(true)
        setError(null)

        // QR code data format: JSON with bookingId and timestamp
        // Format: { "bookingId": 123, "timestamp": "2025-01-15T10:30:00Z", "type": "CHECK_IN" }
        const qrData = JSON.stringify({
          bookingId: bookingId,
          timestamp: new Date().toISOString(),
          type: 'CHECK_IN',
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours expiry
        })

        // Set expiry time for display
        setExpiryTime(new Date(Date.now() + 24 * 60 * 60 * 1000))

        // Generate QR code
        const dataUrl = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#10B981', // Green color for check-in
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        })

        setQrCodeDataUrl(dataUrl)

        // Also draw on canvas for download
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, qrData, {
            width: 300,
            margin: 2,
            color: {
              dark: '#10B981',
              light: '#ffffff'
            },
            errorCorrectionLevel: 'M'
          })
        }
      } catch (error: any) {
        setError(error.message || 'Có lỗi xảy ra khi tạo mã QR')
      } finally {
        setIsGenerating(false)
      }
    }

    generateQRCode()
  }, [bookingId])

  const handleDownloadQR = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a')
      link.download = `booking-checkin-${bookingId}.png`
      link.href = qrCodeDataUrl
      link.click()
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A'
    return timeString
  }

  const formatExpiry = (date: Date) => {
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const content = (
    <div className="booking-qr-code">
      <div className="booking-qr-code__header">
        <div className="booking-qr-code__header-left">
          <QrCode size={24} color="#10B981" />
          <h3>Mã QR Check-in</h3>
        </div>
        {isModal && onClose && (
          <button className="booking-qr-code__close" onClick={onClose}>
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div className="booking-qr-code__error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="booking-qr-code__content">
        {/* Booking Info */}
        <div className="booking-qr-code__info">
          <div className="info-row">
            <span className="info-label">Mã đặt lịch:</span>
            <span className="info-value">#{bookingId}</span>
          </div>
          {bookingDate && (
            <div className="info-row">
              <span className="info-label">Ngày hẹn:</span>
              <span className="info-value">{formatDate(bookingDate)}</span>
            </div>
          )}
          {bookingTime && (
            <div className="info-row">
              <span className="info-label">Giờ hẹn:</span>
              <span className="info-value">{formatTime(bookingTime)}</span>
            </div>
          )}
          {centerName && (
            <div className="info-row">
              <span className="info-label">Trung tâm:</span>
              <span className="info-value">{centerName}</span>
            </div>
          )}
        </div>

        {/* QR Code */}
        <div className="booking-qr-code__qr">
          <h4>Quét mã QR tại trung tâm để check-in</h4>

          {isGenerating ? (
            <div className="booking-qr-code__loading">
              <div className="spinner"></div>
              <p>Đang tạo mã QR...</p>
            </div>
          ) : (
            <div className="booking-qr-code__container">
              {qrCodeDataUrl && (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code Check-in"
                  className="booking-qr-code__image"
                />
              )}
              <canvas
                ref={canvasRef}
                style={{ display: 'none' }}
              />

              <div className="booking-qr-code__instructions">
                <p>1. Đến trung tâm đúng giờ hẹn</p>
                <p>2. Mở mã QR này trên điện thoại</p>
                <p>3. Nhân viên sẽ quét mã QR để check-in</p>
                <p>4. Hoặc nhân viên có thể nhập mã đặt lịch: <strong>#{bookingId}</strong></p>
              </div>

              {expiryTime && (
                <div className="booking-qr-code__expiry">
                  <Clock size={14} />
                  <span>Mã QR có hiệu lực đến: {formatExpiry(expiryTime)}</span>
                </div>
              )}

              <button
                onClick={handleDownloadQR}
                className="booking-qr-code__download"
              >
                <Download size={16} />
                Tải mã QR
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="booking-qr-code-modal-overlay" onClick={onClose}>
        <div className="booking-qr-code-modal" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    )
  }

  return content
}

export default BookingQRCode

