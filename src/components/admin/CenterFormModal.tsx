import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Building2, MapPin, Phone, Activity } from 'lucide-react'
import { CenterService, type Center, type CreateCenterRequest, type UpdateCenterRequest } from '../../services/centerService'
import toast from 'react-hot-toast'

interface CenterFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  mode?: 'create' | 'update'
  center?: Center | null
}

const CenterFormModal: React.FC<CenterFormModalProps> = ({ 
  open, 
  onClose, 
  onSuccess, 
  mode = 'create',
  center = null 
}) => {
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    centerName: '',
    address: '',
    phoneNumber: '',
    isActive: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      if (mode === 'update' && center) {
        setFormData({
          centerName: center.centerName || '',
          address: center.address || '',
          phoneNumber: center.phoneNumber || '',
          isActive: center.isActive
        })
      } else {
        setFormData({
          centerName: '',
          address: '',
          phoneNumber: '',
          isActive: true
        })
      }
      setErrors({})
    }
  }, [open, mode, center])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.centerName.trim()) {
      newErrors.centerName = 'Tên trung tâm là bắt buộc'
    } else if (formData.centerName.trim().length < 3) {
      newErrors.centerName = 'Tên trung tâm phải có ít nhất 3 ký tự'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc'
    } else if (formData.address.trim().length < 10) {
      newErrors.address = 'Địa chỉ phải có ít nhất 10 ký tự'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc'
    } else if (!/^0\d{9,10}$/.test(formData.phoneNumber.trim())) {
      newErrors.phoneNumber = 'Số điện thoại phải có 10-11 chữ số và bắt đầu bằng 0'
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
      const payload = {
        centerName: formData.centerName.trim(),
        address: formData.address.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        isActive: formData.isActive
      }

      if (mode === 'create') {
        await CenterService.createCenter(payload as CreateCenterRequest)
        toast.success('Tạo trung tâm thành công!')
      } else {
        if (!center) {
          toast.error('Không tìm thấy trung tâm để cập nhật')
          return
        }
        await CenterService.updateCenter(center.centerId, payload as UpdateCenterRequest)
        toast.success('Cập nhật trung tâm thành công!')
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {

      // Handle validation errors from backend
      if (error?.response?.status === 400) {
        const validationErrors: Record<string, string> = {}
        
        // Check if errors object exists (structured validation errors)
        if (error?.response?.data?.errors) {
          const backendErrors = error.response.data.errors
          
          // Map backend field names (PascalCase) to form field names (camelCase)
          const fieldMapping: Record<string, string> = {
            'CenterName': 'centerName',
            'Address': 'address',
            'PhoneNumber': 'phoneNumber',
            'IsActive': 'isActive'
          }
          
          // Extract first error message for each field
          Object.keys(backendErrors).forEach((backendField) => {
            const formField = fieldMapping[backendField] || backendField.charAt(0).toLowerCase() + backendField.slice(1)
            const errorMessages = backendErrors[backendField]
            if (Array.isArray(errorMessages) && errorMessages.length > 0) {
              validationErrors[formField] = errorMessages[0]
            }
          })
        }
        
        // Check if message exists and try to map to fields based on keywords
        const errorMessage = error?.response?.data?.message || ''
        if (errorMessage) {
          // Map common error messages to fields
          const messageLower = errorMessage.toLowerCase()
          
          if (messageLower.includes('tên trung tâm') || messageLower.includes('centername') || messageLower.includes('tồn tại')) {
            validationErrors.centerName = errorMessage
          } else if (messageLower.includes('địa chỉ') || messageLower.includes('address')) {
            validationErrors.address = errorMessage
          } else if (messageLower.includes('số điện thoại') || messageLower.includes('phonenumber') || messageLower.includes('phone')) {
            validationErrors.phoneNumber = errorMessage
          } else {
            // If can't map to specific field, try to show on centerName as fallback for center-related errors
            if (messageLower.includes('trung tâm') || messageLower.includes('center')) {
              validationErrors.centerName = errorMessage
            }
          }
        }
        
        // Only set errors if we found any
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
        } else {
          // If no field-specific errors found, show generic message (only for non-validation cases)
          const genericMessage = error?.response?.data?.message || error?.message || 'Không thể lưu trung tâm'
          toast.error(genericMessage)
        }
      } else {
        // Handle other errors (network, server, etc.) - only show toast for these
        const errorMessage = error?.response?.data?.message || error?.message || 'Không thể lưu trung tâm'
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!open) return null

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
          borderRadius: '12px',
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
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
              {mode === 'create' ? 'Tạo Trung tâm Mới' : 'Cập nhật Trung tâm'}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              {mode === 'create' 
                ? 'Thêm trung tâm dịch vụ mới vào hệ thống' 
                : 'Cập nhật thông tin trung tâm dịch vụ'
              }
            </p>
          </div>
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
            <X size={24} style={{ color: '#6b7280' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Tên trung tâm - Cột 1 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <Building2 size={18} style={{ color: '#6b7280' }} />
                Tên trung tâm <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="text"
                  value={formData.centerName}
                  onChange={(e) => handleChange('centerName', e.target.value)}
                  placeholder="Nhập tên trung tâm"
                  style={{
                    width: '420px',
                    minWidth: '420px',
                    maxWidth: '420px',
                    padding: '12px 16px',
                    paddingLeft: '44px',
                    border: `2px solid ${errors.centerName ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.centerName && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.centerName}</div>
              )}
            </div>

            {/* Số điện thoại - Cột 2 */}
            <div>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <Phone size={18} style={{ color: '#6b7280' }} />
                Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  placeholder="Nhập số điện thoại (VD: 0123456789)"
                  style={{
                    width: '420px',
                    minWidth: '420px',
                    maxWidth: '420px',
                    padding: '12px 16px',
                    paddingLeft: '44px',
                    border: `2px solid ${errors.phoneNumber ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.phoneNumber && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.phoneNumber}</div>
              )}
            </div>

            {/* Địa chỉ - Cột 1 (span full width) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginBottom: '10px', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#374151' 
              }}>
                <MapPin size={18} style={{ color: '#6b7280' }} />
                Địa chỉ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin 
                  size={20} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '16px', 
                    color: '#9ca3af',
                    pointerEvents: 'none'
                  }} 
                />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Nhập địa chỉ trung tâm"
                  rows={3}
                  style={{
                    width: '100%',
                    minWidth: '420px',
                    maxWidth: '100%',
                    padding: '12px 16px',
                    paddingLeft: '44px',
                    border: `2px solid ${errors.address ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
              {errors.address && (
                <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{errors.address}</div>
              )}
            </div>

            {/* Toggle Switch hoạt động */}
            <div style={{ 
              gridColumn: '1 / -1',
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
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '20px', borderTop: '2px solid #e5e7eb' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#fff',
                color: '#374151',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#FFD875',
                color: '#111827',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Đang lưu...' : (mode === 'create' ? 'Tạo Trung tâm' : 'Cập nhật Trung tâm')}
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

export default CenterFormModal

