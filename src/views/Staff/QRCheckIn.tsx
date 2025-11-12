import { useState, useRef, useEffect } from 'react'
import { QrCode, Scan, CheckCircle, AlertCircle, Loader2, Clock, User, Car } from 'lucide-react'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'
import './QRCheckIn.scss'

interface CheckedInBooking {
  bookingId: number
  customerName: string
  vehiclePlate: string
  serviceName: string
  checkedInAt: string
  status: string
}

export default function QRCheckIn() {
  const [manualId, setManualId] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ id: number; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [checkedInList, setCheckedInList] = useState<CheckedInBooking[]>([])
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    startCamera()
    fetchCheckedInList()
    return () => stopCamera()
  }, [])

  const fetchCheckedInList = async () => {
    try {
      setLoadingList(true)
      const response = await BookingService.getCheckedInBookings()
      if (response.success) {
        setCheckedInList(response.data)
      }
    } catch (err) {
      console.error('Error fetching checked-in list:', err)
    } finally {
      setLoadingList(false)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      setCameraActive(false)
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
    setCameraActive(false)
  }

  const handleCheckIn = async (bookingId: number) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await BookingService.checkInBooking(bookingId)

      if (response.success) {
        setSuccess({
          id: bookingId,
          message: response.message || 'Check-in thành công'
        })
        toast.success(`Check-in thành công cho booking #${bookingId}`)

        fetchCheckedInList()
        setTimeout(() => {
          setSuccess(null)
          setManualId('')
        }, 3000)
      } else {
        setError(response.message || 'Không thể check-in')
        toast.error(response.message || 'Không thể check-in')
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi check-in'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const handleManualCheckIn = () => {
    const id = parseInt(manualId.trim())
    if (!id || isNaN(id)) {
      setError('Vui lòng nhập mã đặt lịch hợp lệ')
      return
    }
    handleCheckIn(id)
  }

  return (
    <div className="qr-checkin-page">
      <div className="qr-checkin-header">
        <div className="qr-checkin-header-content">
          <QrCode size={24} />
          <div>
            <h1>Quét mã Check-in</h1>
            <p>Quét mã QR hoặc nhập mã đặt lịch để check-in khách hàng</p>
          </div>
        </div>
      </div>

      <div className="qr-checkin-content">
        <div className="qr-checkin-grid">
          <div className="qr-left-section">
            <div className="qr-camera-card">
              <h3>Camera quét mã</h3>
              <div className="qr-camera-wrapper">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="qr-video"
                />
                {!cameraActive && (
                  <div className="qr-camera-loading">
                    <Scan size={48} />
                    <p>Đang khởi động camera...</p>
                  </div>
                )}
                {cameraActive && (
                  <div className="qr-scan-frame">
                    <div className="qr-corner qr-tl"></div>
                    <div className="qr-corner qr-tr"></div>
                    <div className="qr-corner qr-bl"></div>
                    <div className="qr-corner qr-br"></div>
                    <p className="qr-scan-text">Đưa mã QR vào khung</p>
                  </div>
                )}
              </div>
            </div>

            <div className="qr-manual-card">
              <h3>Nhập thủ công</h3>
              
              {error && (
                <div className="qr-message qr-error">
                  <AlertCircle size={20} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="qr-message qr-success">
                  <CheckCircle size={20} />
                  <div>
                    <p>{success.message}</p>
                    <small>Booking ID: #{success.id}</small>
                  </div>
                </div>
              )}

              <div className="qr-input-group">
                <label>Mã đặt lịch</label>
                <input
                  type="number"
                  placeholder="Nhập mã đặt lịch (VD: 123)"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualCheckIn()}
                  disabled={loading}
                />
                <button
                  onClick={handleManualCheckIn}
                  disabled={loading || !manualId.trim()}
                  className="qr-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="qr-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Check-in
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="qr-checkedin-list">
            <h3>Đã check-in</h3>
            {loadingList ? (
              <div className="qr-list-loading">
                <Loader2 size={24} className="qr-spin" />
                <p>Đang tải...</p>
              </div>
            ) : checkedInList.length === 0 ? (
              <div className="qr-list-empty">
                <CheckCircle size={48} />
                <p>Chưa có booking nào check-in</p>
              </div>
            ) : (
              <div className="qr-list-items">
                {checkedInList.map((booking) => (
                  <div key={booking.bookingId} className="qr-booking-item">
                    <div className="qr-booking-id">#{booking.bookingId}</div>
                    <div className="qr-booking-info">
                      <div className="qr-booking-row">
                        <User size={14} />
                        <span>{booking.customerName}</span>
                      </div>
                      <div className="qr-booking-row">
                        <Car size={14} />
                        <span>{booking.vehiclePlate}</span>
                      </div>
                      <div className="qr-booking-row">
                        <Clock size={14} />
                        <span>{new Date(booking.checkedInAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                    <div className="qr-booking-service">{booking.serviceName}</div>
                    <div className="qr-booking-status">{booking.status}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
