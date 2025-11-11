import React, { useState, useEffect } from 'react'
import { X, CreditCard, QrCode, Wallet } from 'lucide-react'
import { PaymentService, type PaymentBreakdownResponse } from '@/services/paymentService'
import { WorkOrderPartService, type WorkOrderPartItem } from '@/services/workOrderPartService'
import { PartService } from '@/services/partService'
import { PayOSService } from '@/services/payOSService'
import { PromotionBookingService, type BookingPromotionInfo } from '@/services/promotionBookingService'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface PaymentModalProps {
  bookingId: number
  totalAmount: number
  open: boolean
  onClose: () => void
  onPaymentSuccess?: () => void
}

export default function PaymentModal({
  bookingId,
  totalAmount,
  open,
  onClose,
  onPaymentSuccess
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'PAYOS' | 'VNPAY' | 'SEPAY_QR' | 'OFFLINE' | null>(null)
  const [processing, setProcessing] = useState(false)
  const [loadingBreakdown, setLoadingBreakdown] = useState(false)
  const [breakdown, setBreakdown] = useState<PaymentBreakdownResponse['data'] | null>(null)
  const [workParts, setWorkParts] = useState<WorkOrderPartItem[]>([])
  const [appliedPromotions, setAppliedPromotions] = useState<BookingPromotionInfo[]>([])

  // Load breakdown khi modal mở
  useEffect(() => {
    if (open && bookingId) {
      loadBreakdown()
      loadAppliedPromotions()
      // Load thêm work order parts để có đơn giá làm fallback (giống như kỹ thuật viên)
      ;(async () => {
        try {
          // 1. Load phụ tùng từ API /Booking/{bookingId}/parts
          let list = await WorkOrderPartService.list(Number(bookingId))
          
          // 2. Load chi tiết từ API /api/Part/{id} để lấy đơn giá và thông tin đầy đủ
          list = await Promise.all(list.map(async (p) => {
            try {
              // Luôn gọi API /api/Part/{id} để lấy unitPrice chính xác
              const partDetail = await PartService.getPartById(p.partId)
              
              if (partDetail.success && partDetail.data) {
                const raw = partDetail.data as any
                // Map từ nhiều field name có thể: unitPrice, price, Price, UnitPrice
                const unitPrice = raw.unitPrice ?? raw.UnitPrice ?? raw.price ?? raw.Price ?? p.unitPrice ?? 0
                
                return {
                  ...p,
                  partNumber: partDetail.data.partNumber || p.partNumber,
                  partName: partDetail.data.partName || p.partName,
                  brand: partDetail.data.brand || p.brand,
                  unitPrice: unitPrice, // Lấy đơn giá từ API Part/{id}
                  totalStock: partDetail.data.totalStock ?? p.totalStock
                }
              }
            } catch (err) {
              console.error(`Lỗi khi load chi tiết phụ tùng ${p.partId}:`, err)
            }
            
            return p
          }))
          
          setWorkParts(list || [])
        } catch { /* ignore */ }
      })()
    }
  }, [open, bookingId])

  const loadBreakdown = async () => {
    try {
      setLoadingBreakdown(true)
      const response = await PaymentService.getBookingBreakdown(bookingId)
      if (response.success && response.data) {
        setBreakdown(response.data)
        // Log để debug promotion
        console.log('PaymentModal - Breakdown loaded:', {
          bookingId,
          total: response.data.total,
          subtotal: response.data.subtotal,
          promotion: response.data.promotion,
          partsAmount: response.data.partsAmount
        })
      } else {
        toast.error(response.message || 'Không thể tải thông tin hóa đơn')
      }
    } catch (error: any) {
      console.error('PaymentModal - Error loading breakdown:', error)
      toast.error(error?.message || 'Lỗi khi tải thông tin hóa đơn')
    } finally {
      setLoadingBreakdown(false)
    }
  }

  const loadAppliedPromotions = async () => {
    try {
      const promotions = await PromotionBookingService.getBookingPromotions(bookingId)
      setAppliedPromotions(promotions || [])
    } catch (error: any) {
      // Không hiển thị lỗi nếu không có promotion hoặc lỗi nhỏ
      setAppliedPromotions([])
    }
  }

  if (!open) return null

  const handleVNPayPayment = async () => {
    setProcessing(true)
    try {
      const response = await PaymentService.createBookingVNPayLink(bookingId)
      if (response.success && response.vnp_Url) {
        // Mở link VNPay trong tab mới
        window.open(response.vnp_Url, '_blank')
        toast.success('Đang chuyển đến trang thanh toán VNPay...')
        // Có thể đóng modal hoặc giữ lại để user quay lại
        onClose()
      } else {
        toast.error(response.message || 'Không thể tạo link thanh toán VNPay')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi tạo thanh toán VNPay')
    } finally {
      setProcessing(false)
    }
  }

  const handleSepayQRPayment = async () => {
    setProcessing(true)
    try {
      const response = await PaymentService.createBookingSepayQR(bookingId)
      if (response.success && response.data?.qrCode) {
        // Hiển thị QR code trong modal riêng
        // Tạm thời mở link nếu có
        if (response.data.qrCode) {
          // Có thể hiển thị QR code trong modal hoặc redirect
          toast.success('QR code đã được tạo. Vui lòng quét mã để thanh toán.')
          // TODO: Hiển thị QR code modal
          onClose()
        }
      } else {
        toast.error(response.message || 'Không thể tạo QR code thanh toán')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi tạo QR code thanh toán')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayOSPayment = async () => {
    setProcessing(true)
    try {
      // Sử dụng giá đã giảm từ breakdown nếu có, nếu không thì dùng totalAmount prop
      const finalAmount = breakdown?.total ?? totalAmount
      
      // BE: POST /api/Payment/booking/{bookingId}/link
      const response = await PayOSService.createPaymentLink(bookingId, finalAmount)
      if (response.success && response.data?.checkoutUrl) {
        window.open(response.data.checkoutUrl, '_blank')
        toast.success('Đang chuyển đến trang thanh toán PayOS...')
        onClose()
      } else if (response.success && response.data?.paymentLink) {
        // fallback field name
        window.open(response.data.paymentLink, '_blank')
        toast.success('Đang chuyển đến trang thanh toán PayOS...')
        onClose()
      } else {
        toast.error(response.message || 'Không thể tạo link thanh toán PayOS')
      }
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi tạo link thanh toán PayOS')
    } finally {
      setProcessing(false)
    }
  }

  const handleOfflinePayment = async () => {
    setProcessing(true)
    try {
      // Sử dụng giá đã giảm từ breakdown nếu có, nếu không thì dùng totalAmount prop
      const finalAmount = breakdown?.total ?? totalAmount
      
      // Gọi API offline payment
      const { data } = await api.post(`/Payment/booking/${bookingId}/payments/offline`, {
        bookingId,
        amount: Math.round(finalAmount),
        paidByUserId: 0, // TODO: Lấy từ auth context
        note: 'Thanh toán tại trung tâm'
      })
      
      if (data.success) {
        toast.success('Đã ghi nhận thanh toán offline. Vui lòng thanh toán tại trung tâm.')
        onPaymentSuccess?.()
        onClose()
      } else {
        toast.error(data.message || 'Không thể ghi nhận thanh toán offline')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Lỗi khi xử lý thanh toán offline')
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán')
      return
    }

    switch (selectedMethod) {
      case 'PAYOS':
        handlePayOSPayment()
        break
      case 'VNPAY':
        handleVNPayPayment()
        break
      case 'SEPAY_QR':
        handleSepayQRPayment()
        break
      case 'OFFLINE':
        handleOfflinePayment()
        break
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 20000, paddingTop: 80, paddingBottom: 24 }}>
      <div style={{
        width: 'min(1000px, 95vw)',
        maxHeight: '90vh',
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        border: '1px solid var(--border-primary)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Hóa đơn thanh toán</h3>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Grid: Breakdown (left) | Methods (right) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Left: Invoice Breakdown */}
          {loadingBreakdown ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
              Đang tải thông tin hóa đơn...
            </div>
          ) : breakdown ? (
            <div style={{ marginBottom: 0 }}>
            {/* Service */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Dịch vụ:</span>
                <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{breakdown.service.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>Giá dịch vụ:</span>
                <span style={{ fontSize: 13, color: '#111827' }}>{breakdown.service.basePrice.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            {/* Package */}
            {breakdown.package.applied && (
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>Gói dịch vụ:</span>
                  <span style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>-{breakdown.package.discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Giá lần đầu:</span>
                  <span style={{ fontSize: 13, color: '#111827' }}>{breakdown.package.firstTimePrice.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            )}

            {/* Parts */}
            {(() => {
              // Xử lý parts: có thể là array hoặc object với fromInventory và fromCustomer
              const partsArray = Array.isArray(breakdown.parts) 
                ? breakdown.parts 
                : (breakdown.parts as any)?.fromInventory || []
              const customerParts = !Array.isArray(breakdown.parts) 
                ? (breakdown.parts as any)?.fromCustomer || []
                : []
              const allParts = [...partsArray, ...customerParts]
              
              if (allParts.length === 0) return null
              
              return (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ fontSize: 14, color: '#374151', fontWeight: 600, marginBottom: 12 }}>
                    Phụ tùng phát sinh:
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 400, marginLeft: 8 }}>
                      (Không áp dụng khuyến mãi)
                    </span>
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f9fafb' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                          <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #e5e7eb' }}>SL</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #e5e7eb' }}>Đơn giá</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6B7280', borderBottom: '1px solid #e5e7eb' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allParts.map((part: any, idx: number) => {
                          const matched = workParts.find(p => p.partId === part.partId)
                          const unitPrice = part.unitPrice ?? part.referenceUnitPrice ?? matched?.unitPrice ?? 0
                          const qty = part.qty ?? matched?.quantity ?? 0
                          const amount = part.amount ?? (unitPrice * qty)
                          const isCustomerSupplied = part.sourceOrderItemId != null
                          return (
                            <tr key={`${part.partId}-${idx}`} style={{ borderBottom: idx < allParts.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                              <td style={{ padding: '8px 12px', fontSize: 13, color: '#374151' }}>
                                {part.name}
                                {isCustomerSupplied && (
                                  <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 4 }}>(Khách cung cấp)</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13, color: '#374151' }}>{qty}</td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
                                {isCustomerSupplied && amount === 0 ? 'Miễn phí' : `${Number(unitPrice).toLocaleString('vi-VN')} VNĐ`}
                              </td>
                              <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, color: '#111827', fontWeight: 600 }}>
                                {isCustomerSupplied && amount === 0 ? 'Miễn phí' : `${Number(amount).toLocaleString('vi-VN')} VNĐ`}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: 13, color: '#6B7280' }}>Tổng phụ tùng:</span>
                    <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>
                      {typeof breakdown.partsAmount === 'number' 
                        ? breakdown.partsAmount.toLocaleString('vi-VN') 
                        : allParts.reduce((sum: number, part: any) => {
                            const matched = workParts.find(p => p.partId === part.partId)
                            const unitPrice = part.unitPrice ?? part.referenceUnitPrice ?? matched?.unitPrice ?? 0
                            const qty = part.qty ?? matched?.quantity ?? 0
                            return sum + (part.amount ?? (unitPrice * qty))
                          }, 0).toLocaleString('vi-VN')
                      } VNĐ
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* Promotion */}
            {breakdown.promotion.applied && (
              <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 14, color: '#374151', fontWeight: 600 }}>
                      Khuyến mãi:
                      {appliedPromotions.length > 0 && (
                        <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginLeft: 8 }}>
                          {appliedPromotions[0].code}
                        </span>
                      )}
                    </span>
                    {appliedPromotions.length > 0 && appliedPromotions[0].description && (
                      <span style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                        {appliedPromotions[0].description}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 400 }}>
                      (Chỉ áp dụng cho dịch vụ/gói)
                    </span>
                  </div>
                  <span style={{ fontSize: 14, color: '#059669', fontWeight: 600 }}>-{breakdown.promotion.discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ marginBottom: 16, padding: '16px', background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#6B7280' }}>Tạm tính:</span>
                <span style={{ fontSize: 14, color: '#111827', fontWeight: 600 }}>{breakdown.subtotal.toLocaleString('vi-VN')} VNĐ</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '2px solid #e5e7eb', marginTop: 12 }}>
                <span style={{ fontSize: 16, color: '#111827', fontWeight: 700 }}>Tổng cộng:</span>
                <span style={{ fontSize: 20, color: '#111827', fontWeight: 700 }}>{breakdown.total.toLocaleString('vi-VN')} VNĐ</span>
              </div>
            </div>

            {/* Notes */}
            {breakdown.notes && (
              <div style={{ marginBottom: 16, padding: '12px', background: '#FEF3C7', borderRadius: 8, border: '1px solid #FCD34D' }}>
                <p style={{ margin: 0, fontSize: 12, color: '#92400E', lineHeight: 1.5 }}> {breakdown.notes}</p>
              </div>
            )}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
              Không thể tải thông tin hóa đơn
            </div>
          )}

          {/* Right: Payment Methods Section */}
          <div style={{ marginBottom: 0, padding: 16, border: '1px solid #e5e7eb', borderRadius: 12, height: 'fit-content', position: 'sticky', top: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Phương thức thanh toán</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* PayOS */}
            <button
              onClick={() => setSelectedMethod('PAYOS')}
              disabled={loadingBreakdown || !breakdown}
              style={{
                padding: '16px',
                borderRadius: 8,
                border: selectedMethod === 'PAYOS' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: selectedMethod === 'PAYOS' ? '#EFF6FF' : '#fff',
                cursor: (loadingBreakdown || !breakdown) ? 'not-allowed' : 'pointer',
                opacity: (loadingBreakdown || !breakdown) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={24} color={selectedMethod === 'PAYOS' ? '#3B82F6' : '#6B7280'} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>PayOS</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Thanh toán qua PayOS</div>
              </div>
            </button>
            {/* VNPay */}
            <button
              onClick={() => setSelectedMethod('VNPAY')}
              disabled={loadingBreakdown || !breakdown}
              style={{
                padding: '16px',
                borderRadius: 8,
                border: selectedMethod === 'VNPAY' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: selectedMethod === 'VNPAY' ? '#EFF6FF' : '#fff',
                cursor: (loadingBreakdown || !breakdown) ? 'not-allowed' : 'pointer',
                opacity: (loadingBreakdown || !breakdown) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={24} color={selectedMethod === 'VNPAY' ? '#3B82F6' : '#6B7280'} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>VNPay</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Thanh toán qua cổng VNPay</div>
              </div>
            </button>
            {/* SEPAY QR */}
            <button
              onClick={() => setSelectedMethod('SEPAY_QR')}
              disabled={loadingBreakdown || !breakdown}
              style={{
                padding: '16px',
                borderRadius: 8,
                border: selectedMethod === 'SEPAY_QR' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: selectedMethod === 'SEPAY_QR' ? '#EFF6FF' : '#fff',
                cursor: (loadingBreakdown || !breakdown) ? 'not-allowed' : 'pointer',
                opacity: (loadingBreakdown || !breakdown) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s'
              }}
            >
              <QrCode size={24} color={selectedMethod === 'SEPAY_QR' ? '#3B82F6' : '#6B7280'} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>QR Code (SEPAY)</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Quét mã QR để thanh toán</div>
              </div>
            </button>
            {/* Offline */}
            <button
              onClick={() => setSelectedMethod('OFFLINE')}
              disabled={loadingBreakdown || !breakdown}
              style={{
                padding: '16px',
                borderRadius: 8,
                border: selectedMethod === 'OFFLINE' ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                background: selectedMethod === 'OFFLINE' ? '#EFF6FF' : '#fff',
                cursor: (loadingBreakdown || !breakdown) ? 'not-allowed' : 'pointer',
                opacity: (loadingBreakdown || !breakdown) ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.2s'
              }}
            >
              <Wallet size={24} color={selectedMethod === 'OFFLINE' ? '#3B82F6' : '#6B7280'} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: '#111827' }}>Thanh toán tại trung tâm</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>Thanh toán trực tiếp khi nhận xe</div>
              </div>
            </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={processing}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              background: '#fff',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: '#6B7280'
            }}
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !selectedMethod}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: processing || !selectedMethod ? '#9CA3AF' : '#3B82F6',
              cursor: processing || !selectedMethod ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: '#fff'
            }}
          >
            {processing ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </div>
  )
}

