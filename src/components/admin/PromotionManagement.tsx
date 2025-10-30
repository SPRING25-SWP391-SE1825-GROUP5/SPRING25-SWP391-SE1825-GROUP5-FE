import React, { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  FunnelIcon,
  Edit,
  TrashIcon,
  Play,
  Pause,
  Eye,
  Gift,
  Circle,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  X,
  ChevronUp,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw
} from 'lucide-react'
import promotionService from '../../services/promotionService'
import type {
  Promotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  PromotionFilters
} from '../../types/promotion'

interface PromotionFormProps {
  promotion?: Promotion
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreatePromotionRequest | UpdatePromotionRequest) => void
  isLoading: boolean
}

function PromotionForm({ promotion, isOpen, onClose, onSave, isLoading }: PromotionFormProps) {
  const [formData, setFormData] = useState<CreatePromotionRequest>({
    code: '',
    description: '',
    discountValue: 0,
    discountType: 'PERCENT',
    minOrderAmount: 0,
    startDate: '',
    endDate: '',
    maxDiscount: 0,
    status: 'ACTIVE',
    usageLimit: 0
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (promotion) {
      setFormData({
        code: promotion.code,
        description: promotion.description,
        discountValue: promotion.discountValue,
        discountType: promotion.discountType,
        minOrderAmount: promotion.minOrderAmount || 0,
        startDate: promotion.startDate.split('T')[0], // Format date for input
        endDate: promotion.endDate ? promotion.endDate.split('T')[0] : '',
        maxDiscount: promotion.maxDiscount || 0,
        status: promotion.status,
        usageLimit: promotion.usageLimit || 0
      })
    } else {
      // Reset form cho tạo mới
      setFormData({
        code: '',
        description: '',
        discountValue: 0,
        discountType: 'PERCENT',
        minOrderAmount: 0,
        startDate: '',
        endDate: '',
        maxDiscount: 0,
        status: 'ACTIVE',
        usageLimit: 0
      })
    }
    setErrors({})
    setFormError(null)
  }, [promotion, isOpen])

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Mã khuyến mãi là bắt buộc'
    } else if (formData.code.length < 3 || formData.code.length > 50) {
      newErrors.code = 'Mã khuyến mãi phải từ 3-50 ký tự'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả là bắt buộc'
    } else if (formData.description.length < 10 || formData.description.length > 500) {
      newErrors.description = 'Mô tả phải từ 10-500 ký tự'
    }

    if (formData.discountValue <= 0) {
      newErrors.discountValue = 'Giá trị giảm giá phải lớn hơn 0'
    }

    if (formData.discountType === 'PERCENT') {
      if (formData.discountValue > 100) {
        newErrors.discountValue = 'Giảm giá theo % không được vượt quá 100%'
      }
      // Không còn bắt buộc maxDiscount; chỉ cảnh báo nhẹ nếu thiếu
      if (!formData.maxDiscount || formData.maxDiscount <= 0) {
        // Không chặn submit, chỉ gợi ý trong UI
      }
    }

    if (formData.minOrderAmount && formData.minOrderAmount < 0) {
      newErrors.minOrderAmount = 'Giá trị đơn hàng tối thiểu không được âm'
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Ngày bắt đầu là bắt buộc'
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const start = new Date(formData.startDate)
      if (start < today) {
        newErrors.startDate = 'Ngày bắt đầu không được là ngày trong quá khứ'
      }
    }

    if (formData.endDate) {
      const end = new Date(formData.endDate)
      const start = formData.startDate ? new Date(formData.startDate) : null
      if (start && end <= start) {
        newErrors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
      }
    }

    if (formData.maxDiscount && formData.maxDiscount < 0) {
      newErrors.maxDiscount = 'Giảm giá tối đa không được âm'
    }

    if (formData.usageLimit && formData.usageLimit <= 0) {
      newErrors.usageLimit = 'Giới hạn sử dụng phải lớn hơn 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    
    if (validateForm()) {
      try {
        // Sanitize payload to match backend validation (DateOnly, nullable optionals)
        const resolvedMaxDiscount = (formData.discountType === 'PERCENT')
          ? (formData.maxDiscount && formData.maxDiscount > 0 ? Number(formData.maxDiscount) : 1)
          : (formData.maxDiscount && formData.maxDiscount > 0 ? Number(formData.maxDiscount) : null)

        const payload: any = {
          code: formData.code.trim(),
          description: formData.description.trim(),
          discountValue: Number(formData.discountValue),
          discountType: formData.discountType,
          minOrderAmount: formData.minOrderAmount && formData.minOrderAmount > 0 ? Number(formData.minOrderAmount) : null,
          startDate: formData.startDate, // YYYY-MM-DD
          endDate: formData.endDate && formData.endDate.length > 0 ? formData.endDate : null,
          maxDiscount: resolvedMaxDiscount,
          status: formData.status,
          usageLimit: formData.usageLimit && formData.usageLimit > 0 ? Number(formData.usageLimit) : null
        }

        await onSave(payload)
      } catch (error) {
        // Extract server message if available
        // @ts-ignore
        const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message
        const errorMessage = serverMsg
          ? `Không thể lưu khuyến mãi: ${serverMsg}`
          : 'Có lỗi xảy ra khi lưu khuyến mãi. Vui lòng thử lại.'
        setFormError(errorMessage)
      }
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof CreatePromotionRequest, value: any) => {
    // Clamp percentage between 0 and 100; sanitize numerics
    setFormData(prev => {
      const next: any = { ...prev }
      if (field === 'discountValue') {
        const numeric = typeof value === 'number' ? value : parseFloat(value)
        next.discountValue = prev.discountType === 'PERCENT'
          ? Math.max(0, Math.min(100, isNaN(numeric) ? 0 : numeric))
          : Math.max(0, isNaN(numeric) ? 0 : numeric)
      } else if (field === 'discountType') {
        next.discountType = value
        // If switching to percentage, clamp current value
        if (value === 'PERCENT') {
          next.discountValue = Math.max(0, Math.min(100, Number(prev.discountValue) || 0))
        }
      } else if (field === 'minOrderAmount' || field === 'maxDiscount' || field === 'usageLimit') {
        const numeric = typeof value === 'number' ? value : parseFloat(value)
        next[field] = Math.max(0, isNaN(numeric) ? 0 : numeric)
      } else {
        next[field] = value
      }
      return next
    })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    // Clear form error when user starts typing
    if (formError) {
      setFormError(null)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderRadius: '20px',
        border: '1px solid var(--border-primary)',
        width: '700px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        animation: 'modalSlideIn 0.3s ease-out'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '2px solid var(--border-primary)'
        }}>
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              fontSize: '24px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {promotion ? 'Chỉnh sửa khuyến mãi' : 'Tạo khuyến mãi mới'}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              {promotion
                ? 'Cập nhật thông tin khuyến mãi'
                : 'Thêm chương trình khuyến mãi mới vào hệ thống'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '12px',
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--error-50)'
              e.currentTarget.style.color = 'var(--error-600)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Form Error Message */}
          {formError && (
            <div style={{
              background: 'var(--error-50)',
              border: '1px solid var(--error-200)',
              color: 'var(--error-700)',
              padding: '12px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={20} />
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            {/* Mã khuyến mãi */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Mã khuyến mãi <span style={{ color: 'var(--error-500)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${errors.code ? 'var(--error-500)' : 'var(--border-primary)'}`,
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Nhập mã khuyến mãi"
                onFocus={(e) => {
                  e.target.style.borderColor = errors.code ? 'var(--error-500)' : 'var(--primary-500)'
                  e.target.style.boxShadow = errors.code ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.code ? 'var(--error-500)' : 'var(--border-primary)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.code && (
                <div style={{
                  color: 'var(--error-600)',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {errors.code}
                </div>
              )}
            </div>

            {/* Mô tả */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}>
                Mô tả <span style={{ color: 'var(--error-500)' }}>*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${errors.description ? 'var(--error-500)' : 'var(--border-primary)'}`,
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
                rows={3}
                placeholder="Nhập mô tả khuyến mãi"
                onFocus={(e) => {
                  e.target.style.borderColor = errors.description ? 'var(--error-500)' : 'var(--primary-500)'
                  e.target.style.boxShadow = errors.description ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.description ? 'var(--error-500)' : 'var(--border-primary)'
                  e.target.style.boxShadow = 'none'
                }}
              />
              {errors.description && (
                <div style={{
                  color: 'var(--error-600)',
                  fontSize: '12px',
                  marginTop: '4px'
                }}>
                  {errors.description}
                </div>
              )}
            </div>

            {/* Loại giảm giá và giá trị */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Loại giảm giá <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => handleInputChange('discountType', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-500)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="PERCENT">Phần trăm (%)</option>
                  <option value="FIXED">Số tiền cố định (VNĐ)</option>
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Giá trị giảm giá <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => handleInputChange('discountValue', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${errors.discountValue ? 'var(--error-500)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder={formData.discountType === 'PERCENT' ? '0-100' : '0'}
                  min="0"
                  max={formData.discountType === 'PERCENT' ? 100 : undefined}
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.discountValue ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = errors.discountValue ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.discountValue ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {errors.discountValue && (
                  <div style={{
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {errors.discountValue}
                  </div>
                )}
              </div>
            </div>

            {/* Giá trị đơn hàng tối thiểu và giảm giá tối đa */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Giá trị đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount || ''}
                  onChange={(e) => handleInputChange('minOrderAmount', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${errors.minOrderAmount ? 'var(--error-500)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="0"
                  min="0"
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.minOrderAmount ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = errors.minOrderAmount ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.minOrderAmount ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {errors.minOrderAmount && (
                  <div style={{
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {errors.minOrderAmount}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Giảm giá tối đa (VNĐ)
                </label>
                <input
                  type="number"
                  value={formData.maxDiscount || ''}
                  onChange={(e) => handleInputChange('maxDiscount', parseFloat(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${errors.maxDiscount ? 'var(--error-500)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Không giới hạn"
                  min="0"
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.maxDiscount ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = errors.maxDiscount ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.maxDiscount ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {errors.maxDiscount && (
                  <div style={{
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {errors.maxDiscount}
                  </div>
                )}
              </div>
            </div>

            {/* Thời gian hiệu lực */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Ngày bắt đầu <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${errors.startDate ? 'var(--error-500)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.startDate ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = errors.startDate ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.startDate ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {errors.startDate && (
                  <div style={{
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {errors.startDate}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${errors.endDate ? 'var(--error-500)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.endDate ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = errors.endDate ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.endDate ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {errors.endDate && (
                  <div style={{
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {errors.endDate}
                  </div>
                )}
              </div>
            </div>

            {/* Giới hạn sử dụng và trạng thái */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Giới hạn sử dụng
                </label>
                <input
                  type="number"
                  value={formData.usageLimit || ''}
                  onChange={(e) => handleInputChange('usageLimit', parseInt(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: `2px solid ${errors.usageLimit ? 'var(--error-500)' : 'var(--border-primary)'}`,
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Không giới hạn"
                  min="0"
                  onFocus={(e) => {
                    e.target.style.borderColor = errors.usageLimit ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = errors.usageLimit ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.usageLimit ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {errors.usageLimit && (
                  <div style={{
                    color: 'var(--error-600)',
                    fontSize: '12px',
                    marginTop: '4px'
                  }}>
                    {errors.usageLimit}
                  </div>
                )}
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Trạng thái <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid var(--border-primary)',
                    borderRadius: '12px',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-500)'
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="ACTIVE">Hoạt động</option>
                  <option value="INACTIVE">Không hoạt động</option>
                  <option value="EXPIRED">Hết hạn</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '24px',
              borderTop: '2px solid var(--border-primary)',
              marginTop: '8px'
            }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = 'var(--error-500)'
                    e.currentTarget.style.background = 'var(--error-50)'
                    e.currentTarget.style.color = 'var(--error-700)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.background = 'var(--bg-card)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  background: isLoading ? 'var(--text-tertiary)' : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: isLoading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }
                }}
              >
                {isLoading ? 'Đang lưu...' : (promotion ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ===== PROMOTION FILTERS COMPONENT =====
interface PromotionFiltersProps {
  filters: PromotionFilters
  onFiltersChange: (filters: PromotionFilters) => void
  onSearch: () => void
}

function PromotionFiltersComponent({ filters, onFiltersChange, onSearch }: PromotionFiltersProps) {
  const handleFilterChange = (field: keyof PromotionFilters, value: any) => {
    onFiltersChange({ ...filters, [field]: value })
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      padding: '24px',
      borderRadius: '16px',
      border: '1px solid var(--border-primary)',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        alignItems: 'end'
      }}>
        {/* Tìm kiếm */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            Tìm kiếm
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }} />
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '2px solid var(--border-primary)',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Mã, mô tả..."
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-500)'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Trạng thái */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            Trạng thái
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid var(--border-primary)',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Tất cả</option>
            <option value="ACTIVE">Hoạt động</option>
            <option value="INACTIVE">Không hoạt động</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>

        {/* Loại khuyến mãi */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '8px'
          }}>
            Loại khuyến mãi
          </label>
          <select
            value={filters.promotionType || ''}
            onChange={(e) => handleFilterChange('promotionType', e.target.value || undefined)}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid var(--border-primary)',
              borderRadius: '10px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="">Tất cả</option>
            <option value="PERCENT">Phần trăm</option>
            <option value="FIXED">Số tiền cố định</option>
          </select>
        </div>

        {/* Nút tìm kiếm */}
        <div>
          <button 
            onClick={() => {
              onFiltersChange({
                searchTerm: '',
                status: undefined,
                promotionType: undefined
              })
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              border: '2px solid var(--border-primary)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-500)'
              e.currentTarget.style.background = 'var(--primary-50)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)'
              e.currentTarget.style.background = 'var(--bg-secondary)'
            }}
          >
            <RefreshCw size={16} />
            Đặt lại bộ lọc
          </button>
        </div>

      </div>
    </div>
  )
}

// Utility functions
const formatCurrency = (amount: number | undefined | null) => {
  const numeric = typeof amount === 'number' ? amount : Number(amount)
  if (Number.isNaN(numeric)) return '—'
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(numeric)
}

const formatDate = (dateString: string | undefined | null) => {
  if (!dateString) return 'Không giới hạn'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ===== PROMOTION TABLE COMPONENT =====
interface PromotionTableProps {
  promotions: Promotion[]
  onEdit: (promotion: Promotion) => void
  onActivate: (id: number) => void
  onDeactivate: (id: number) => void
  onViewDetails: (promotion: Promotion) => void
  isLoading: boolean
  onSort: (field: string) => void
  getSortIcon: (field: string) => React.ReactNode
}

function PromotionTable({
  promotions,
  onEdit,
  onActivate,
  onDeactivate,
  onViewDetails,
  isLoading,
  onSort,
  getSortIcon
}: PromotionTableProps) {
  // Ensure promotions is always an array
  const safePromotions = Array.isArray(promotions) ? promotions : []
  // Truncate description for mobile
  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (description.length <= maxLength) return description
    return description.substring(0, maxLength) + '...'
  }

  if (isLoading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-primary)',
          borderTop: '3px solid var(--primary-500)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ margin: 0, fontSize: '16px' }}>Đang tải khuyến mãi...</p>
      </div>
    )
  }

  if (safePromotions.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'var(--bg-secondary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--text-tertiary)'
        }}>
          <Gift size={32} />
        </div>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          Không tìm thấy khuyến mãi nào
        </h4>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Thử thay đổi bộ lọc hoặc tạo khuyến mãi mới
        </p>
      </div>
    )
  }

  return (
    <div style={{
      overflow: 'auto',
      width: '100%'
    }}>
      <table style={{
        width: '100%',
        minWidth: '800px', // Set minimum width instead of fixed width
        borderCollapse: 'collapse',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid var(--border-primary)'
      }}>
        <thead>
          <tr style={{
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <th
              onClick={() => onSort('code')}
              style={{
                padding: '16px 12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                width: '140px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Mã khuyến mãi
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  {getSortIcon('code')}
                </div>
              </div>
            </th>
            <th
              style={{
                padding: '16px 12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                minWidth: '200px',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Mô tả

              </div>
            </th>
            <th
              onClick={() => onSort('discountValue')}
              style={{
                padding: '16px 12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                width: '150px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Giá trị giảm
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  {getSortIcon('discountValue')}
                </div>
              </div>
            </th>
            <th
              onClick={() => onSort('startDate')}
              style={{
                padding: '16px 12px',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                width: '140px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Thời gian
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 1,
                  transition: 'opacity 0.2s ease'
                }}>
                  {getSortIcon('startDate')}
                </div>
              </div>
            </th>
            <th style={{
              padding: '16px 12px',
              textAlign: 'left',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              width: '120px'
            }}>
              Sử dụng
            </th>
            <th
              style={{
                padding: '16px 12px',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                width: '130px',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                Trạng thái

              </div>
            </th>
            <th style={{
              padding: '16px 12px',
              textAlign: 'center',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              width: '140px'
            }}>
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody>
          {safePromotions.map((promotion, index) => (
            <tr
              key={`${promotion.promotionId ?? 'row'}-${index}`}
              style={{
                borderBottom: '1px solid var(--border-primary)',
                transition: 'all 0.3s ease',
                transform: 'translateY(0)',
                boxShadow: 'none',
                background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-50)'
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {/* Mã khuyến mãi */}
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: 'var(--text-primary)',
                fontWeight: '600',
                verticalAlign: 'top'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <Gift size={16} />
                  </div>
                  <div style={{
                    wordBreak: 'break-word',
                    lineHeight: '1.4'
                  }}>
                    {promotion.code}
                  </div>
                </div>
              </td>

              {/* Mô tả */}
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                verticalAlign: 'top'
              }}>
                <div
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                    maxHeight: '4.2em'
                  }}
                  title={promotion.description} // Show full description on hover
                >
                  {promotion.description}
                </div>
              </td>

              {/* Giá trị giảm */}
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                verticalAlign: 'top'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {promotion.discountType === 'PERCENT'
                      ? `${promotion.discountValue}%`
                      : formatCurrency(promotion.discountValue)
                    }
                  </div>
                </div>
                {promotion.minOrderAmount && promotion.minOrderAmount > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginTop: '4px',
                    lineHeight: '1.3'
                  }}>
                    Tối thiểu: {formatCurrency(promotion.minOrderAmount)}
                  </div>
                )}
              </td>

              {/* Thời gian */}
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {formatDate(promotion.startDate)}
                </div>
                {promotion.endDate && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginTop: '4px',
                    lineHeight: '1.3'
                  }}>
                    đến {formatDate(promotion.endDate)}
                  </div>
                )}
              </td>

              {/* Sử dụng */}
              <td style={{
                padding: '16px 12px',
                fontSize: '14px',
                color: 'var(--text-secondary)',
                verticalAlign: 'top'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {promotion.usageCount}
                  {promotion.usageLimit && promotion.usageLimit > 0 && ` / ${promotion.usageLimit}`}
                </div>
                {promotion.usageLimit && promotion.usageLimit > 0 && (
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--text-tertiary)',
                    marginTop: '4px',
                    lineHeight: '1.3'
                  }}>
                    Còn lại: {promotion.remainingUsage}
                  </div>
                )}
              </td>

              {/* Trạng thái */}
              <td style={{
                padding: '16px 12px',
                textAlign: 'center',
                verticalAlign: 'top'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: promotion.status === 'ACTIVE' ? 'var(--success-50)' :
                    promotion.status === 'INACTIVE' ? 'var(--error-50)' : 'var(--warning-50)',
                  color: promotion.status === 'ACTIVE' ? 'var(--success-700)' :
                    promotion.status === 'INACTIVE' ? 'var(--error-700)' : 'var(--warning-700)',
                  fontSize: '12px',
                  fontWeight: '600',
                  border: `1px solid ${promotion.status === 'ACTIVE' ? 'var(--success-200)' :
                    promotion.status === 'INACTIVE' ? 'var(--error-200)' : 'var(--warning-200)'}`,
                  whiteSpace: 'nowrap'
                }}>
                  {promotion.status === 'ACTIVE' ? (
                    <>
                      <Circle size={12} fill="currentColor" />
                      Hoạt động
                    </>
                  ) : promotion.status === 'INACTIVE' ? (
                    <>
                      <AlertCircle size={12} fill="currentColor" />
                      Không hoạt động
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} fill="currentColor" />
                      Hết hạn
                    </>
                  )}
                </div>
              </td>

              {/* Thao tác */}
              <td style={{
                padding: '16px 12px',
                textAlign: 'center',
                verticalAlign: 'top'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={() => onViewDetails(promotion)}
                    style={{
                      padding: '6px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-500)'
                      e.currentTarget.style.background = 'var(--primary-50)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)'
                      e.currentTarget.style.background = 'var(--bg-card)'
                    }}
                    title="Xem chi tiết"
                  >
                    <Eye size={14} />
                  </button>

                  <button
                    onClick={() => onEdit(promotion)}
                    style={{
                      padding: '6px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary-500)'
                      e.currentTarget.style.background = 'var(--primary-50)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)'
                      e.currentTarget.style.background = 'var(--bg-card)'
                    }}
                    title="Chỉnh sửa"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() => promotion.status === 'ACTIVE' ? onDeactivate(promotion.promotionId) : onActivate(promotion.promotionId)}
                    style={{
                      padding: '6px',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '6px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      width: '32px',
                      height: '32px',
                      flexShrink: 0
                    }}
                    disabled={isLoading}
                    onMouseEnter={(e) => {
                      if (promotion.status === 'ACTIVE') {
                        e.currentTarget.style.borderColor = 'var(--error-500)'
                        e.currentTarget.style.background = 'var(--error-50)'
                        e.currentTarget.style.color = 'var(--error-600)'
                      } else {
                        e.currentTarget.style.borderColor = 'var(--success-500)'
                        e.currentTarget.style.background = 'var(--success-50)'
                        e.currentTarget.style.color = 'var(--success-600)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)'
                      e.currentTarget.style.background = 'var(--bg-card)'
                      e.currentTarget.style.color = 'var(--text-primary)'
                    }}
                    title={promotion.status === 'ACTIVE' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  >
                    {promotion.status === 'ACTIVE' ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ===== MAIN PROMOTION MANAGEMENT COMPONENT =====
export default function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | undefined>()
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | undefined>()
  const [filters, setFilters] = useState<PromotionFilters>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
    status: undefined,
    promotionType: undefined
  })
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('code')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [stats, setStats] = useState({
    totalPromotions: 0,
    activePromotions: 0,
    inactivePromotions: 0,
    expiredPromotions: 0,
    totalUsage: 0
  })

  // Sort functions
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUp size={14} style={{ opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  // Load promotions from API
  const loadPromotions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Use the main getPromotions method for real API calls
      const response = await promotionService.getPromotions(filters)

      let promotionsData = response.data as Promotion[] || []
      const responseTotalCount = response.totalCount || 0
      const responsePageNumber = response.pageNumber || 1
      const responseTotalPages = response.totalPages || 0

      // Apply sorting to promotions data
      if (promotionsData.length > 0) {
        promotionsData = promotionsData.sort((a, b) => {
          let aValue: any, bValue: any;
          switch (sortBy) {
            case 'code':
              aValue = a.code?.toLowerCase() || '';
              bValue = b.code?.toLowerCase() || '';
              break;
            case 'description':
              aValue = a.description?.toLowerCase() || '';
              bValue = b.description?.toLowerCase() || '';
              break;
            case 'discountValue':
              aValue = a.discountValue || 0;
              bValue = b.discountValue || 0;
              break;
            case 'startDate':
              aValue = new Date(a.startDate).getTime();
              bValue = new Date(b.startDate).getTime();
              break;
            case 'status':
              aValue = a.status?.toLowerCase() || '';
              bValue = b.status?.toLowerCase() || '';
              break;
            default:
              aValue = a.code?.toLowerCase() || '';
              bValue = b.code?.toLowerCase() || '';
          }
          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      }

      // Processed promotions data
      setPromotions(promotionsData)
      setTotalCount(responseTotalCount)
      setCurrentPage(responsePageNumber)
      setTotalPages(responseTotalPages)

      // Calculate stats from promotions data
      const totalPromotions = promotionsData.length
      const activePromotions = promotionsData.filter(p => p.status === 'ACTIVE').length
      const inactivePromotions = promotionsData.filter(p => p.status === 'INACTIVE').length
      const expiredPromotions = promotionsData.filter(p => p.status === 'EXPIRED').length
      const totalUsage = promotionsData.reduce((sum, p) => sum + (p.usageCount || 0), 0)

      setStats({
        totalPromotions,
        activePromotions,
        inactivePromotions,
        expiredPromotions,
        totalUsage
      })

      // Show success message if data loaded
      if (promotionsData.length > 0) {
        setSuccessMessage(`Đã tải ${promotionsData.length} khuyến mãi`)
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setSuccessMessage('Không tìm thấy khuyến mãi nào')
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (error) {

      // Set error message
      const errorMessage = error instanceof Error
        ? `Không thể tải danh sách khuyến mãi: ${error.message}`
        : 'Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.'

      setError(errorMessage)
      setTimeout(() => setError(null), 5000)

      // Reset to empty array on error
      setPromotions([])
      setTotalCount(0)
      setCurrentPage(1)
      setTotalPages(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Load promotions on component mount and when filters change
  useEffect(() => {
    loadPromotions()
  }, [filters, sortBy, sortOrder])

  // Handle create new promotion
  const handleCreateNew = () => {
    setEditingPromotion(undefined)
    setIsFormOpen(true)
  }

  // Handle edit promotion
  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setIsFormOpen(true)
  }

  // Handle save promotion
  const handleSave = async (data: CreatePromotionRequest | UpdatePromotionRequest) => {
    try {
      setIsLoading(true)
      setError(null)
      if (editingPromotion) {
        await promotionService.updatePromotion(editingPromotion.promotionId, data)
        setSuccessMessage('Cập nhật khuyến mãi thành công!')
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        await promotionService.createPromotion(data as CreatePromotionRequest)
        setSuccessMessage('Tạo khuyến mãi mới thành công!')
        setTimeout(() => setSuccessMessage(null), 3000)
      }

      setIsFormOpen(false)
      setEditingPromotion(undefined)
      await loadPromotions()
    } catch (error) {
      // Re-throw error to be handled in form
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Handle activate promotion
  const handleActivate = async (id: number) => {
    // Optimistic UI update: set ACTIVE immediately
    const prev = promotions
    setPromotions(prev.map(p => p.promotionId === id ? { ...p, status: 'ACTIVE', isActive: true } : p))
    try {
      setIsLoading(true)
      setError(null)
      await promotionService.activatePromotion(id)
      setSuccessMessage('Kích hoạt khuyến mãi thành công!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadPromotions()
    } catch (error) {
      // rollback on error
      setPromotions(prev)
      // Extract server message if available
      // @ts-ignore
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message
      const errorMessage = serverMsg
        ? `Không thể kích hoạt: ${serverMsg}`
        : 'Có lỗi xảy ra khi kích hoạt khuyến mãi. Vui lòng thử lại.'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle deactivate promotion
  const handleDeactivate = async (id: number) => {
    const prev = promotions
    setPromotions(prev.map(p => p.promotionId === id ? { ...p, status: 'INACTIVE', isActive: false } : p))
    try {
      setIsLoading(true)
      setError(null)
      await promotionService.deactivatePromotion(id)
      setSuccessMessage('Vô hiệu hóa khuyến mãi thành công!')
      setTimeout(() => setSuccessMessage(null), 3000)
      await loadPromotions()
    } catch (error) {
      setPromotions(prev)
      // Extract server message if available
      // @ts-ignore
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message
      const errorMessage = serverMsg
        ? `Không thể vô hiệu hóa: ${serverMsg}`
        : 'Có lỗi xảy ra khi vô hiệu hóa khuyến mãi. Vui lòng thử lại.'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle view details
  const handleViewDetails = async (promotion: Promotion) => {
    try {
      const promotionDetailsResp = await promotionService.getPromotionById(String(promotion.promotionId))
      setSelectedPromotion(promotionDetailsResp.data?.[0] || promotion)
    } catch (error) {
      const errorMessage = error instanceof Error
        ? `Không thể tải chi tiết khuyến mãi: ${error.message}`
        : 'Không thể tải chi tiết khuyến mãi. Vui lòng thử lại.'
      setError(errorMessage)
      setTimeout(() => setError(null), 5000)
    }
  }

  // Handle search
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, pageNumber: 1 }))
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, pageNumber: page }))
  }

  // Handle refresh data
  const handleRefresh = () => {
    loadPromotions()
  }

  return (
    <>
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div style={{
        padding: '24px',
        background: 'var(--bg-secondary)',
        minHeight: '100vh',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0 0 8px 0',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Quản lý Khuyến mãi
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              margin: '0'
            }}>
              Quản lý và theo dõi các chương trình khuyến mãi và giảm giá
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleRefresh} style={{
              padding: '12px 16px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '2px solid var(--border-primary)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)'
                e.currentTarget.style.background = 'var(--primary-50)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.background = 'var(--bg-card)'
              }}>
              <RefreshCw size={18} />
              Làm mới
            </button>

            <button onClick={handleCreateNew} style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.2s ease',
              transform: 'translateY(0)'
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}>
              <Plus size={18} />
              Tạo khuyến mãi mới
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div style={{
            background: 'var(--success-50)',
            border: '1px solid var(--success-200)',
            color: 'var(--success-700)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={20} />
            {successMessage}
          </div>
        )}

        {error && (
          <div style={{
            background: 'var(--error-50)',
            border: '1px solid var(--error-200)',
            color: 'var(--error-700)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white'
            }}>
              <Gift size={24} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {stats.totalPromotions}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Tổng khuyến mãi
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white'
            }}>
              <CheckCircle size={24} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {stats.activePromotions}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Đang hoạt động
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--error-500), var(--error-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white'
            }}>
              <AlertCircle size={24} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {stats.inactivePromotions}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Không hoạt động
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--warning-500), var(--warning-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white'
            }}>
              <Circle size={24} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {stats.expiredPromotions}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Hết hạn
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white'
            }}>
              <TrendingUp size={24} />
            </div>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              marginBottom: '4px'
            }}>
              {stats.totalUsage}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              Lượt sử dụng
            </div>
          </div>
        </div>

        {/* Filters */}
        <PromotionFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          onSearch={handleSearch}
        />

        {/* Table */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '32px',
          borderRadius: '20px',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--text-primary)',
              margin: '0'
            }}>
              Danh sách Khuyến mãi
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Simple Header Pagination */}
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{ 
                  padding: "6px 10px", 
                  borderRadius: "6px",
                  border: "1px solid var(--border-primary)",
                  background: currentPage === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                  color: currentPage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.background = "var(--primary-50)"
                    e.currentTarget.style.borderColor = "var(--primary-500)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 1) {
                    e.currentTarget.style.background = "var(--bg-card)"
                    e.currentTarget.style.borderColor = "var(--border-primary)"
                  }
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{
                padding: "6px 10px",
                background: "var(--primary-50)",
                borderRadius: "6px",
                color: "var(--primary-700)",
                fontSize: "12px",
                fontWeight: "600",
                minWidth: "60px",
                textAlign: "center"
              }}>
                {currentPage} / {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                style={{ 
                  padding: "6px 10px", 
                  borderRadius: "6px",
                  border: "1px solid var(--border-primary)",
                  background: currentPage === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                  color: currentPage === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.background = "var(--primary-50)"
                    e.currentTarget.style.borderColor = "var(--primary-500)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== totalPages) {
                    e.currentTarget.style.background = "var(--bg-card)"
                    e.currentTarget.style.borderColor = "var(--border-primary)"
                  }
                }}
              >
                <ChevronRight size={14} />
              </button>
              
              
            </div>
          </div>

          <PromotionTable
            promotions={promotions}
            onEdit={handleEdit}
            onActivate={handleActivate}
            onDeactivate={handleDeactivate}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
            onSort={handleSort}
            getSortIcon={getSortIcon}
          />
        </div>

        {/* Enhanced Pagination */}
        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '20px 24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {/* First Page */}
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(1)}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
                background: currentPage === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                color: currentPage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <ChevronsLeft size={16} />
              <span style={{ marginLeft: '4px' }}>Đầu</span>
            </button>

            {/* Previous Page */}
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
                background: currentPage === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                color: currentPage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <ChevronLeft size={16} />
              <span style={{ marginLeft: '4px' }}>Trước</span>
            </button>

            {/* Page Numbers */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              margin: '0 8px'
            }}>
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }

                // First page + ellipsis
                if (startPage > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-primary)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--primary-50)"
                        e.currentTarget.style.borderColor = "var(--primary-500)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-card)"
                        e.currentTarget.style.borderColor = "var(--border-primary)"
                      }}
                    >
                      1
                    </button>
                  );
                  if (startPage > 2) {
                    pages.push(
                      <span key="ellipsis1" style={{ padding: "8px 4px", color: "var(--text-tertiary)" }}>
                        ...
                      </span>
                    );
                  }
                }

                // Visible pages
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: i === currentPage ? "1px solid var(--primary-500)" : "1px solid var(--border-primary)",
                        background: i === currentPage ? "var(--primary-50)" : "var(--bg-card)",
                        color: i === currentPage ? "var(--primary-700)" : "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: i === currentPage ? "600" : "500",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (i !== currentPage) {
                          e.currentTarget.style.background = "var(--primary-50)"
                          e.currentTarget.style.borderColor = "var(--primary-500)"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (i !== currentPage) {
                          e.currentTarget.style.background = "var(--bg-card)"
                          e.currentTarget.style.borderColor = "var(--border-primary)"
                        }
                      }}
                    >
                      {i}
                    </button>
                  );
                }

                // Last page + ellipsis
                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push(
                      <span key="ellipsis2" style={{ padding: "8px 4px", color: "var(--text-tertiary)" }}>
                        ...
                      </span>
                    );
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-primary)",
                        background: "var(--bg-card)",
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--primary-50)"
                        e.currentTarget.style.borderColor = "var(--primary-500)"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--bg-card)"
                        e.currentTarget.style.borderColor = "var(--border-primary)"
                      }}
                    >
                      {totalPages}
                    </button>
                  );
                }

                return pages;
              })()}
            </div>

            {/* Next Page */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
                background: currentPage === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                color: currentPage === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <span style={{ marginRight: '4px' }}>Sau</span>
              <ChevronRight size={16} />
            </button>

            {/* Last Page */}
            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(totalPages)}
              style={{ 
                padding: "8px 12px", 
                borderRadius: "8px",
                border: "1px solid var(--border-primary)",
                background: currentPage === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                color: currentPage === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <span style={{ marginRight: '4px' }}>Cuối</span>
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

        {/* Form Modal */}
        <PromotionForm
          promotion={editingPromotion}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSave}
          isLoading={isLoading}
        />

        {/* Details Modal */}
        {selectedPromotion && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)'
          }}>
            <div style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '20px',
              border: '1px solid var(--border-primary)',
              width: '800px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              animation: 'modalSlideIn 0.3s ease-out'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '2px solid var(--border-primary)'
              }}>
                <div>
                  <h3 style={{
                    margin: '0 0 4px 0',
                    fontSize: '24px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    Chi tiết Khuyến mãi
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    {selectedPromotion.code}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPromotion(undefined)}
                  style={{
                    border: 'none',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    padding: '12px',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--error-50)'
                    e.currentTarget.style.color = 'var(--error-600)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Promotion Details */}
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Basic Info */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Thông tin cơ bản
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mã khuyến mãi</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedPromotion.code}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Trạng thái</div>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: selectedPromotion.status === 'ACTIVE' ? 'var(--success-50)' :
                          selectedPromotion.status === 'INACTIVE' ? 'var(--error-50)' : 'var(--warning-50)',
                        color: selectedPromotion.status === 'ACTIVE' ? 'var(--success-700)' :
                          selectedPromotion.status === 'INACTIVE' ? 'var(--error-700)' : 'var(--warning-700)',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${selectedPromotion.status === 'ACTIVE' ? 'var(--success-200)' :
                          selectedPromotion.status === 'INACTIVE' ? 'var(--error-200)' : 'var(--warning-200)'}`
                      }}>
                        {selectedPromotion.status === 'ACTIVE' ? 'Hoạt động' :
                          selectedPromotion.status === 'INACTIVE' ? 'Không hoạt động' : 'Hết hạn'}
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mô tả</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {selectedPromotion.description}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discount Info */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Thông tin giảm giá
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Loại giảm giá</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedPromotion.discountType === 'PERCENT' ? 'Phần trăm (%)' : 'Số tiền cố định (VNĐ)'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Giá trị giảm</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedPromotion.discountType === 'PERCENT'
                          ? `${selectedPromotion.discountValue}%`
                          : formatCurrency(selectedPromotion.discountValue)
                        }
                      </div>
                    </div>
                    {selectedPromotion.minOrderAmount && selectedPromotion.minOrderAmount > 0 && (
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Đơn hàng tối thiểu</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {formatCurrency(selectedPromotion.minOrderAmount)}
                        </div>
                      </div>
                    )}
                    {selectedPromotion.maxDiscount && selectedPromotion.maxDiscount > 0 && (
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Giảm tối đa</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {formatCurrency(selectedPromotion.maxDiscount)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time Info */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Thời gian hiệu lực
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ngày bắt đầu</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {formatDate(selectedPromotion.startDate)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ngày kết thúc</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedPromotion.endDate ? formatDate(selectedPromotion.endDate) : 'Không giới hạn'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Info */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)'
                }}>
                  <h4 style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Thông tin sử dụng
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Đã sử dụng</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedPromotion.usageCount} lần
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Giới hạn sử dụng</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {selectedPromotion.usageLimit && selectedPromotion.usageLimit > 0
                          ? `${selectedPromotion.usageLimit} lần`
                          : 'Không giới hạn'
                        }
                      </div>
                    </div>
                    {selectedPromotion.usageLimit && selectedPromotion.usageLimit > 0 && (
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Còn lại</div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {selectedPromotion.remainingUsage} lần
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  paddingTop: '24px',
                  borderTop: '2px solid var(--border-primary)'
                }}>
                  <button
                    onClick={() => setSelectedPromotion(undefined)}
                    style={{
                      padding: '12px 24px',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      border: '2px solid var(--border-primary)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--error-500)'
                      e.currentTarget.style.background = 'var(--error-50)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-primary)'
                      e.currentTarget.style.background = 'var(--bg-card)'
                    }}
                  >
                    Đóng
                  </button>
                  <button
                    onClick={() => {
                      const promotionToEdit = selectedPromotion
                      setSelectedPromotion(undefined)
                      handleEdit(promotionToEdit)
                    }}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}