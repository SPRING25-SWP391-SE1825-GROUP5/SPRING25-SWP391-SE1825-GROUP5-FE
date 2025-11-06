import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { XMarkIcon } from '@heroicons/react/24/outline'
import api from '@/services/api'
import toast from 'react-hot-toast'

interface Part {
  id: string
  name: string
  supplier: string
  price: number
  isActive: boolean
}

interface PartsFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingPart?: Part | null
}

const PartsFormModal: React.FC<PartsFormModalProps> = ({ isOpen, onClose, onSuccess, editingPart }) => {
  const [formData, setFormData] = useState({
    partNumber: '',
    partName: '',
    brand: '',
    unitPrice: 0,
    isActive: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      if (editingPart) {
        setFormData({
          partNumber: '',
          partName: editingPart.name || '',
          brand: editingPart.supplier || '',
          unitPrice: editingPart.price || 0,
          isActive: editingPart.isActive ?? true
        })
      } else {
        setFormData({
          partNumber: '',
          partName: '',
          brand: '',
          unitPrice: 0,
          isActive: true
        })
      }
      setErrors({})
    }
  }, [isOpen, editingPart])

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!editingPart && !formData.partNumber.trim()) {
      newErrors.partNumber = 'Vui lòng nhập mã phụ tùng'
    }

    if (!formData.partName.trim()) {
      newErrors.partName = 'Vui lòng nhập tên phụ tùng'
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Vui lòng nhập thương hiệu'
    }

    if (!formData.unitPrice || formData.unitPrice < 0) {
      newErrors.unitPrice = 'Vui lòng nhập đơn giá hợp lệ (≥ 0)'
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
    try {
      if (editingPart) {
        // Update part
        const payload = {
          partName: formData.partName.trim(),
          brand: formData.brand.trim(),
          unitPrice: formData.unitPrice,
          imageUrl: '',
          isActive: formData.isActive
        }
        await api.put(`/Part/${editingPart.id}`, payload)
        toast.success('Cập nhật phụ tùng thành công!')
      } else {
        // Create part
        const payload = {
          partNumber: formData.partNumber.trim(),
          partName: formData.partName.trim(),
          brand: formData.brand.trim(),
          unitPrice: formData.unitPrice,
          isActive: formData.isActive
        }
        await api.post('/Part', payload)
        toast.success('Tạo phụ tùng thành công!')
      }
      onSuccess()
      onClose()
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      
      if (err.response?.status === 400 && err.response.data?.errors) {
        const backendErrors = err.response.data.errors
        const validationErrors: Record<string, string> = {}
        
        Object.keys(backendErrors).forEach((field) => {
          const messages = backendErrors[field]
          if (Array.isArray(messages) && messages.length > 0) {
            // Map backend field names to form field names
            const fieldMapping: Record<string, string> = {
              'PartNumber': 'partNumber',
              'PartName': 'partName',
              'Brand': 'brand',
              'UnitPrice': 'unitPrice'
            }
            const formField = fieldMapping[field] || field.toLowerCase()
            validationErrors[formField] = messages[0]
          }
        })
        
        setErrors(validationErrors)
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể thực hiện thao tác'
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '32px',
          width: '900px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            {editingPart ? 'Chỉnh sửa phụ tùng' : 'Thêm phụ tùng'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <XMarkIcon width={24} height={24} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Mã phụ tùng - Cột 1 (chỉ hiển thị khi create) */}
            {!editingPart && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '10px', 
                  fontSize: '14px', 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  Mã phụ tùng <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.partNumber}
                  onChange={(e) => handleChange('partNumber', e.target.value)}
                  placeholder="Nhập mã phụ tùng"
                  style={{
                    width: '420px',
                    minWidth: '420px',
                    maxWidth: '420px',
                    padding: '12px 16px',
                    border: `2px solid ${errors.partNumber ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.partNumber && (
                  <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.partNumber}</div>
                )}
              </div>
            )}

            {/* Tên phụ tùng - Cột 1 hoặc 2 */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Tên phụ tùng <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.partName}
                onChange={(e) => handleChange('partName', e.target.value)}
                placeholder="Nhập tên phụ tùng"
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.partName ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.partName && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.partName}</div>
              )}
            </div>

            {/* Thương hiệu - Cột 1 hoặc 2 */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Thương hiệu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Nhập thương hiệu"
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.brand ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.brand && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.brand}</div>
              )}
            </div>

            {/* Đơn giá - Cột 1 hoặc 2 */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                Đơn giá <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="number"
                value={formData.unitPrice}
                onChange={(e) => handleChange('unitPrice', parseFloat(e.target.value) || 0)}
                placeholder="Nhập đơn giá"
                min="0"
                style={{
                  width: '420px',
                  minWidth: '420px',
                  maxWidth: '420px',
                  padding: '12px 16px',
                  border: `2px solid ${errors.unitPrice ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '15px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.unitPrice && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.unitPrice}</div>
              )}
            </div>
          </div>

          {/* Toggle Switch hoạt động */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '32px'
          }}>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              style={{
                position: 'relative',
                width: '48px',
                height: '24px',
                borderRadius: '12px',
                border: 'none',
                background: formData.isActive ? '#10b981' : '#d1d5db',
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
                  transform: formData.isActive ? 'translateX(24px)' : 'translateX(0)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                }}
              />
            </button>
            <span style={{ fontSize: '15px', color: '#6b7280', fontWeight: '400' }}>Hoạt động</span>
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
              {loading ? 'Đang xử lý...' : (editingPart ? 'Cập nhật' : 'Tạo mới')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // Render modal using portal to document.body
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return null
}

export default PartsFormModal

