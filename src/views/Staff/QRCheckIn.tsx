import { useState, useRef, useEffect } from 'react'
import { QrCode, Scan, CheckCircle, AlertCircle, Loader2, Clock, User, Car, Video, VideoOff } from 'lucide-react'
import { BookingService } from '@/services/bookingService'
import toast from 'react-hot-toast'
import { BrowserMultiFormatReader, NotFoundException, DecodeHintType, BarcodeFormat } from '@zxing/library'
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
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const scanControlRef = useRef<Promise<void> | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [checkedInList, setCheckedInList] = useState<CheckedInBooking[]>([])
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    fetchCheckedInList()

    // Cleanup khi component unmount
    return () => {
      stopScanner()
    }
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

  const startScanner = async () => {
    try {
      // Đảm bảo stop scanner cũ nếu có
      if (isScanning) {
        await stopScanner()
        // Đợi một chút để cleanup hoàn tất
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Set scanning state trước để video element được hiển thị
      setIsScanning(true)

      // Đợi một chút để React render video element
      await new Promise(resolve => setTimeout(resolve, 100))

      // Tạo hints để chỉ scan QR code và cải thiện độ chính xác
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
      hints.set(DecodeHintType.TRY_HARDER, true)
      hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8')
      hints.set(DecodeHintType.PURE_BARCODE, false)
      hints.set(DecodeHintType.ASSUME_GS1, false)

      const codeReader = new BrowserMultiFormatReader(hints)
      codeReaderRef.current = codeReader

      // Lấy video element
      const videoElement = document.getElementById('qr-video') as HTMLVideoElement
      if (!videoElement) {
        throw new Error('Video element not found')
      }
      videoRef.current = videoElement

      // Lấy danh sách camera
      const videoInputDevices = await codeReader.listVideoInputDevices()

      // Tìm camera mặc định (Integrated Webcam), loại trừ Iriun Webcam
      const defaultCamera = videoInputDevices.find(device => {
        const label = device.label.toLowerCase()
        return !label.includes('iriun') &&
               (label.includes('integrated') ||
                label.includes('default') ||
                label.includes('webcam'))
      }) || videoInputDevices[0] // Nếu không tìm thấy, dùng camera đầu tiên (thường là mặc định)

      console.log('Available cameras:', videoInputDevices.map(d => d.label))
      console.log('Using camera:', defaultCamera?.label || 'default')

      // Bắt đầu decode từ camera
      console.log('🎥 Starting QR scanner with camera:', defaultCamera?.deviceId || 'default')
      console.log('📹 Video element:', videoElement)

      scanControlRef.current = codeReader.decodeFromVideoDevice(
        defaultCamera?.deviceId || null,
        videoElement,
        (result, error) => {
          // Chỉ log khi có result hoặc lỗi quan trọng (giảm spam)
          if (result) {
            // QR code được scan thành công
            const text = result.getText()
            console.log('✅ QR Code scanned successfully:', text)

            // Gọi handler ngay lập tức
            handleQRCodeScanned(text)
          }

          if (error) {
            // Chỉ log lỗi nếu không phải NotFoundException (lỗi thường gặp khi không tìm thấy QR code)
            if (error instanceof NotFoundException) {
              // Không log lỗi này vì nó xảy ra liên tục khi không có QR code
            } else {
              console.warn('❌ QR Scan error:', error.message)
              // Nếu là lỗi khác (không phải "not found"), có thể là QR code không hợp lệ
              if (error.message && !error.message.includes('No MultiFormat Readers') && !error.message.includes('NotFoundException')) {
                toast.error(`Lỗi quét QR: ${error.message}`)
              }
            }
          }
        }
      )

      console.log('✅ decodeFromVideoDevice called, scanControlRef:', scanControlRef.current)

      // Lưu stream để cleanup sau
      // Đợi một chút để stream được gán vào video element
      setTimeout(() => {
        if (videoElement.srcObject) {
          streamRef.current = videoElement.srcObject as MediaStream
          console.log('✅ Video stream attached to video element')
          console.log('📹 Video element state:', {
            srcObject: !!videoElement.srcObject,
            readyState: videoElement.readyState,
            paused: videoElement.paused,
            ended: videoElement.ended
          })
        } else {
          console.warn('⚠️ Video stream not attached yet')
        }
      }, 500)

      // Kiểm tra lại sau 1 giây
      setTimeout(() => {
        if (videoElement.srcObject) {
          streamRef.current = videoElement.srcObject as MediaStream
          console.log('✅ Video stream confirmed after 1s')
        } else {
          console.error('❌ Video stream still not attached after 1s')
        }
      }, 1000)

      toast.success('Camera đã được bật')
      console.log('✅ QR Scanner started successfully')
    } catch (err: unknown) {
      console.error('❌ QR Scanner error:', err)
      setIsScanning(false)
      codeReaderRef.current = null
      videoRef.current = null
      streamRef.current = null

      toast.error('Không thể khởi động camera. Vui lòng kiểm tra quyền truy cập camera.')
    }
  }

  const stopScanner = async () => {
    try {
      // Stop code reader (reset sẽ tự động stop scanning)
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
        codeReaderRef.current = null
      }

      // Clear scan control ref
      scanControlRef.current = null

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current = null
      }
    } catch (err: unknown) {
      console.warn('Error stopping scanner:', err)
    } finally {
      setIsScanning(false)
    }
  }

  const handleToggleScanner = async () => {
    if (isScanning) {
      await stopScanner()
      toast.success('Camera đã được tắt')
    } else {
      await startScanner()
    }
  }

  const handleQRCodeScanned = async (decodedText: string) => {
    console.log('🔍 handleQRCodeScanned called with:', decodedText)
    console.log('🔍 Decoded text type:', typeof decodedText)
    console.log('🔍 Decoded text length:', decodedText.length)

    // Trim và parse
    const trimmedText = decodedText.trim()
    const bookingId = parseInt(trimmedText)
    console.log('📝 Parsed bookingId:', bookingId)
    console.log('📝 Is valid number?', !isNaN(bookingId))
    console.log('📝 Is positive?', bookingId > 0)

    if (!isNaN(bookingId) && bookingId > 0) {
      console.log('✅ Valid booking ID, proceeding with check-in')

      // Tạm dừng scanner để tránh scan nhiều lần
      await stopScanner()

      // Xử lý check-in
      await handleCheckIn(bookingId)

      // Tự động bật lại scanner sau 2 giây
      setTimeout(async () => {
        if (!isScanning) {
          console.log('🔄 Restarting scanner after check-in')
          await startScanner()
        }
      }, 2000)
    } else {
      console.error('❌ Invalid QR code format:', decodedText)
      console.error('❌ Trimmed text:', trimmedText)
      console.error('❌ Parsed result:', bookingId)
      toast.error(`Mã QR không hợp lệ. QR code phải chứa số booking ID. Nhận được: "${trimmedText}"`)
    }
  }

  const handleCheckIn = async (bookingId: number) => {
    try {
      console.log('📞 Calling check-in API for booking:', bookingId)
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await BookingService.checkInBooking(bookingId)
      console.log('📥 Check-in API response:', response)

      if (response.success) {
        console.log('✅ Check-in successful')
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
        console.error('❌ Check-in failed:', response.message)
        setError(response.message || 'Không thể check-in')
        toast.error(response.message || 'Không thể check-in')
      }
    } catch (err: unknown) {
      console.error('❌ Check-in error:', err)
      const errorMsg = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
                       (err as { message?: string })?.message ||
                       'Lỗi khi check-in'
      console.error('❌ Error message:', errorMsg)
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3>Camera quét mã</h3>
                <button
                  onClick={handleToggleScanner}
                  className="qr-toggle-camera-btn"
                  type="button"
                >
                  {isScanning ? (
                    <>
                      <VideoOff size={18} />
                      Tắt camera
                    </>
                  ) : (
                    <>
                      <Video size={18} />
                      Bật camera
                    </>
                  )}
                </button>
              </div>
              <div className="qr-camera-wrapper">
                <video
                  id="qr-video"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: isScanning ? 'block' : 'none',
                    minHeight: '300px',
                    objectFit: 'cover'
                  }}
                  playsInline
                  autoPlay
                  muted
                ></video>
                {!isScanning && (
                  <div className="qr-camera-placeholder">
                    <Scan size={48} />
                    <p>Nhấn "Bật camera" để bắt đầu quét mã QR</p>
                  </div>
                )}
                {isScanning && (
                  <div className="qr-scan-frame">
                    <div className="qr-corner qr-tl"></div>
                    <div className="qr-corner qr-tr"></div>
                    <div className="qr-corner qr-bl"></div>
                    <div className="qr-corner qr-br"></div>
                    <p className="qr-scan-text">Đưa mã QR vào khung</p>
                    <p className="qr-scan-hint">Giữ mã QR ổn định, đảm bảo đủ ánh sáng</p>
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
