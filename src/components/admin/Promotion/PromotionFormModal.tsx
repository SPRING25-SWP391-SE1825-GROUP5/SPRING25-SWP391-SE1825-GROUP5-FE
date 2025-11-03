import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PromotionService } from '@/services/promotionService'
import type { Promotion, CreatePromotionRequest, UpdatePromotionRequest } from '@/types/promotion'
import toast from 'react-hot-toast'
import './_promotion-form-modal.scss'

interface PromotionFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editingPromotion?: Promotion | null
}

const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
  open,
  onClose,
  onSuccess,
  editingPromotion = null
}) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT' as 'PERCENT' | 'FIXED',
    discountValue: '',
    maxDiscount: '',
    minOrderAmount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (editingPromotion) {
        setFormData({
          code: editingPromotion.code || '',
          description: editingPromotion.description || '',
          discountType: editingPromotion.discountType || 'PERCENT',
          discountValue: editingPromotion.discountValue?.toString() || '',
          maxDiscount: editingPromotion.maxDiscount?.toString() || '',
          minOrderAmount: editingPromotion.minOrderAmount?.toString() || '',
          startDate: editingPromotion.startDate ? editingPromotion.startDate.split('T')[0] : '',
          endDate: editingPromotion.endDate ? editingPromotion.endDate.split('T')[0] : '',
          usageLimit: editingPromotion.usageLimit?.toString() || '',
          status: editingPromotion.status || 'ACTIVE'
        })
      } else {
        setFormData({
          code: '',
          description: '',
          discountType: 'PERCENT',
          discountValue: '',
          maxDiscount: '',
          minOrderAmount: '',
          startDate: '',
          endDate: '',
          usageLimit: '',
          status: 'ACTIVE'
        })
      }
      setErrors({})
    }
  }, [open, editingPromotion])

  const handleChange = (field: string, value: string | 'PERCENT' | 'FIXED' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED') => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Mã khuyến mãi là bắt buộc'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả là bắt buộc'
    }

    if (!formData.discountValue || parseFloat(formData.discountValue) <= 0) {
      newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0'
    }

    if (formData.discountType === 'PERCENT') {
      const discountValue = parseFloat(formData.discountValue)
      if (discountValue > 100) {
        newErrors.discountValue = 'Giảm giá phần trăm không được vượt quá 100%'
      }
      if (formData.maxDiscount && parseFloat(formData.maxDiscount) <= 0) {
        newErrors.maxDiscount = 'Giảm giá tối đa phải lớn hơn 0'
      }
    }

    if (formData.minOrderAmount && parseFloat(formData.minOrderAmount) < 0) {
      newErrors.minOrderAmount = 'Đơn tối thiểu phải lớn hơn hoặc bằng 0'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc'
    }

    if (formData.endDate && formData.startDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end < start) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
      }
    }

    if (formData.usageLimit && parseInt(formData.usageLimit) <= 0) {
      newErrors.usageLimit = 'Giới hạn lượt sử dụng phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)
    setErrors({}) // Clear previous errors

    try {
      const payload: CreatePromotionRequest | UpdatePromotionRequest = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue),
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        status: formData.status
      }

      if (editingPromotion) {
        // Update
        const updatePayload: UpdatePromotionRequest = { ...payload }
        await PromotionService.updatePromotion(editingPromotion.promotionId, updatePayload)
        toast.success('Cập nhật khuyến mãi thành công!')
      } else {
        // Create
        await PromotionService.createPromotion(payload as CreatePromotionRequest)
        toast.success('Tạo khuyến mãi thành công!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      // Handle validation errors from backend
      if (error.response?.status === 400 && error.response.data?.errors) {
        const backendErrors = error.response.data.errors
        const fieldErrors: Record<string, string> = {}

        // Map backend field errors to form fields
        if (Array.isArray(backendErrors)) {
          // If errors is an array
          backendErrors.forEach((errMsg: string) => {
            // Try to map common error messages to fields
            if (errMsg.toLowerCase().includes('code') || errMsg.toLowerCase().includes('mã')) {
              fieldErrors.code = errMsg
            } else if (errMsg.toLowerCase().includes('description') || errMsg.toLowerCase().includes('mô tả')) {
              fieldErrors.description = errMsg
            } else if (errMsg.toLowerCase().includes('discount') || errMsg.toLowerCase().includes('giảm giá')) {
              fieldErrors.discountValue = errMsg
            } else {
              // Add to first field if no specific match
              if (!fieldErrors.code) {
                fieldErrors.code = errMsg
              }
            }
          })
        } else if (typeof backendErrors === 'object') {
          // If errors is an object with field names
          Object.keys(backendErrors).forEach((field) => {
            const messages = backendErrors[field]
            if (Array.isArray(messages) && messages.length > 0) {
              // Map backend field names to form field names
              const formField = field.toLowerCase()
              if (formField.includes('code')) {
                fieldErrors.code = messages[0]
              } else if (formField.includes('description')) {
                fieldErrors.description = messages[0]
              } else if (formField.includes('discountvalue')) {
                fieldErrors.discountValue = messages[0]
              } else if (formField.includes('maxdiscount')) {
                fieldErrors.maxDiscount = messages[0]
              } else if (formField.includes('minorderamount')) {
                fieldErrors.minOrderAmount = messages[0]
              } else if (formField.includes('startdate')) {
                fieldErrors.startDate = messages[0]
              } else if (formField.includes('enddate')) {
                fieldErrors.endDate = messages[0]
              } else if (formField.includes('usagelimit')) {
                fieldErrors.usageLimit = messages[0]
              }
            }
          })
        }

        setErrors(fieldErrors)
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra'
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const modalContent = (
    <div className="promotion-form-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="promotion-form-modal__overlay">
        {/* Header */}
        <div className="promotion-form-modal__header">
          <div className="promotion-form-modal__header-left">
            <div className={`promotion-form-modal__icon ${editingPromotion ? 'promotion-form-modal__icon--edit' : 'promotion-form-modal__icon--add'}`}>
              <GiftIcon />
            </div>
            <div>
              <h3 className="promotion-form-modal__title">
                {editingPromotion ? 'Chỉnh sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
              </h3>
              <p className="promotion-form-modal__subtitle">
                {editingPromotion ? 'Cập nhật thông tin khuyến mãi' : 'Điền thông tin để tạo khuyến mãi mới'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="promotion-form-modal__close-btn"
            disabled={loading}
          >
            <XMarkIcon width={24} height={24} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Code - Column 1 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Mã khuyến mãi <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                placeholder="Nhập mã khuyến mãi"
                disabled={!!editingPromotion}
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.code ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.code && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.code}</div>
              )}
            </div>

            {/* Description - Column 2 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Mô tả <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Nhập mô tả khuyến mãi"
                rows={3}
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.description ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.description && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.description}</div>
              )}
            </div>

            {/* Discount Type - Column 1 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Loại giảm giá <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.discountType}
                onChange={(e) => handleChange('discountType', e.target.value as 'PERCENT' | 'FIXED')}
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.discountType ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937',
                  cursor: 'pointer'
                }}
              >
                <option value="PERCENT">Phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định</option>
              </select>
              {errors.discountType && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.discountType}</div>
              )}
            </div>

            {/* Discount Value - Column 2 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Giá trị giảm giá <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => handleChange('discountValue', e.target.value)}
                placeholder={formData.discountType === 'PERCENT' ? 'Nhập % giảm giá' : 'Nhập số tiền giảm'}
                min="0"
                step={formData.discountType === 'PERCENT' ? '0.01' : '1000'}
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.discountValue ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.discountValue && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.discountValue}</div>
              )}
            </div>

            {/* Max Discount - Column 1 (only show when PERCENT) */}
            {formData.discountType === 'PERCENT' && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Giảm giá tối đa (VND)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscount}
                  onChange={(e) => handleChange('maxDiscount', e.target.value)}
                  placeholder="Nhập giảm giá tối đa (tùy chọn)"
                  min="0"
                  step="1000"
                  style={{
                    width: '420px',
                    minWidth: '420px',
                    maxWidth: '420px',
                    padding: '12px 16px',
                    border: `2px solid ${errors.maxDiscount ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '0',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    backgroundColor: '#f3f4f6',
                    color: '#1f2937'
                  }}
                />
                {errors.maxDiscount && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.maxDiscount}</div>
                )}
              </div>
            )}

            {/* Min Order Amount - Column 1 or 2 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Đơn tối thiểu (VND)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => handleChange('minOrderAmount', e.target.value)}
                placeholder="Nhập đơn tối thiểu (tùy chọn)"
                min="0"
                step="1000"
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.minOrderAmount ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.minOrderAmount && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.minOrderAmount}</div>
              )}
            </div>

            {/* Start Date - Column 1 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Ngày bắt đầu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.startDate ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.startDate && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.startDate}</div>
              )}
            </div>

            {/* End Date - Column 2 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Ngày kết thúc
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                min={formData.startDate}
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.endDate ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.endDate && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.endDate}</div>
              )}
            </div>

            {/* Usage Limit - Column 1 */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Giới hạn lượt sử dụng
              </label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => handleChange('usageLimit', e.target.value)}
                placeholder="Nhập giới hạn lượt sử dụng (tùy chọn)"
                min="1"
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.usageLimit ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '0',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }}
              />
              {errors.usageLimit && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.usageLimit}</div>
              )}
            </div>
          </div>

          {/* Toggle Switch Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '32px'
          }}>
            <button
              type="button"
              onClick={() => {
                const newStatus = formData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                handleChange('status', newStatus)
              }}
              style={{
                position: 'relative',
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: formData.status === 'ACTIVE' ? '#10b981' : '#d1d5db',
                cursor: 'pointer',
                outline: 'none',
                transition: 'background-color 0.2s ease',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'transform 0.2s ease',
                  transform: formData.status === 'ACTIVE' ? 'translateX(24px)' : 'translateX(0)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
            </button>
            <span style={{ fontSize: '15px', color: '#6b7280', fontWeight: '400' }}>
              {formData.status === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#f9fafb'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#fff'
                }
              }}
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#FFD875',
                color: '#111827',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFE082'
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#FFD875'
                }
              }}
            >
              {loading ? 'Đang xử lý...' : (editingPromotion ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}

// Simple Gift icon component
const GiftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 8V21M12 8C11.4696 8 10.9609 7.78929 10.5858 7.41421C10.2107 7.03914 10 6.53043 10 6C10 5.46957 10.2107 4.96086 10.5858 4.58579C10.9609 4.21071 11.4696 4 12 4C12.5304 4 13.0391 4.21071 13.4142 4.58579C13.7893 4.96086 14 5.46957 14 6C14 6.53043 13.7893 7.03914 13.4142 7.41421C13.0391 7.78929 12.5304 8 12 8ZM12 8H7M12 8H17M7 8C6.46957 8 5.96086 8.21071 5.58579 8.58579C5.21071 8.96086 5 9.46957 5 10V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V10C19 9.46957 18.7893 8.96086 18.4142 8.58579C18.0391 8.21071 17.5304 8 17 8M7 8V4C7 3.46957 7.21071 2.96086 7.58579 2.58579C7.96086 2.21071 8.46957 2 9 2H10M17 8V4C17 3.46957 16.7893 2.96086 16.4142 2.58579C16.0391 2.21071 15.5304 2 15 2H14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default PromotionFormModal

