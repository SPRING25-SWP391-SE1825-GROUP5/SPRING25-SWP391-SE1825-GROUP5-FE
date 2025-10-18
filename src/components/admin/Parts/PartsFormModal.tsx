import React, { useState, useEffect } from 'react'
import { Part, PartFormData } from '../../../types/parts'

interface PartsFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PartFormData) => void
  editingPart?: Part | null
}

const categories = [
  'Hệ thống điện',
  'Phụ kiện sạc',
  'Động cơ',
  'Hệ thống phanh',
  'Khung xe',
  'Lốp xe',
  'Phụ kiện khác'
]

const suppliers = [
  'Samsung SDI',
  'Delta Electronics',
  'Bosch',
  'Shimano',
  'Panasonic',
  'LG Chem',
  'Tesla',
  'BYD'
]

export default function PartsFormModal({ isOpen, onClose, onSubmit, editingPart }: PartsFormModalProps) {
  const [formData, setFormData] = useState<PartFormData>({
    partNumber: '',
    name: '',
    category: '',
    stock: 0,
    price: 0,
    supplier: ''
  })

  const [errors, setErrors] = useState<Partial<PartFormData>>({})

  useEffect(() => {
    if (editingPart) {
      setFormData({
        partNumber: editingPart.partNumber,
        name: editingPart.name,
        category: editingPart.category,
        stock: editingPart.stock,
        price: editingPart.price,
        supplier: editingPart.supplier
      })
    } else {
      setFormData({
        partNumber: '',
        name: '',
        category: '',
        stock: 0,
        price: 0,
        supplier: ''
      })
    }
    setErrors({})
  }, [editingPart, isOpen])

  const validateForm = (): boolean => {
    const newErrors: Partial<PartFormData> = {}

    if (!formData.partNumber.trim()) {
      newErrors.partNumber = 'Mã sản phẩm là bắt buộc'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên sản phẩm là bắt buộc'
    }

    if (!formData.category) {
      newErrors.category = 'Danh mục là bắt buộc'
    }

    if (formData.stock < 0) {
      (newErrors as any).stock = 'Số lượng tồn kho không được âm'
    }

    if (formData.price <= 0) {
      (newErrors as any).price = 'Giá sản phẩm phải lớn hơn 0'
    }

    if (!formData.supplier.trim()) {
      newErrors.supplier = 'Nhà cung cấp là bắt buộc'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      onClose()
    }
  }

  const handleInputChange = (field: keyof PartFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '20px',
        padding: '32px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #f1f5f9',
        position: 'relative',
        animation: 'slideUp 0.3s ease-out'
      }}>
        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '50%',
          opacity: 0.05
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-20px',
          left: '-20px',
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          opacity: 0.05
        }} />
        
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: editingPart 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: editingPart 
                ? '0 8px 16px rgba(245, 158, 11, 0.3)'
                : '0 8px 16px rgba(16, 185, 129, 0.3)'
            }}>
              {editingPart ? '✏️' : '➕'}
            </div>
            <div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: '0 0 4px 0',
                fontFamily: '"Inter", system-ui, sans-serif'
              }}>
                {editingPart ? 'Chỉnh sửa phụ tùng' : 'Thêm phụ tùng mới'}
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: 0,
                fontWeight: '500'
              }}>
                {editingPart ? 'Cập nhật thông tin phụ tùng' : 'Điền thông tin phụ tùng mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: 'pointer',
              color: '#6b7280',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ef4444'
              e.currentTarget.style.color = '#ffffff'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f3f4f6'
              e.currentTarget.style.color = '#6b7280'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '10px'
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#ffffff'
              }}>🏷️</span>
              Mã sản phẩm *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${errors.partNumber ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  fontWeight: '500',
                  fontFamily: 'monospace'
                }}
                placeholder="Nhập mã sản phẩm..."
                onFocus={(e) => {
                  e.target.style.borderColor = errors.partNumber ? '#ef4444' : '#8b5cf6'
                  e.target.style.boxShadow = errors.partNumber 
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                    : '0 0 0 3px rgba(139, 92, 246, 0.1)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.partNumber ? '#ef4444' : '#e5e7eb'
                  e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
              {formData.partNumber && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10b981',
                  fontSize: '18px'
                }}>
                  ✓
                </div>
              )}
            </div>
            {errors.partNumber && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ef4444',
                fontSize: '13px',
                marginTop: '6px',
                fontWeight: '500'
              }}>
                <span>⚠️</span>
                <span>{errors.partNumber}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '15px',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '10px'
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                color: '#ffffff'
              }}>📝</span>
              Tên sản phẩm *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${errors.name ? '#ef4444' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: '#ffffff',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  fontWeight: '500'
                }}
                placeholder="Nhập tên sản phẩm..."
                onFocus={(e) => {
                  e.target.style.borderColor = errors.name ? '#ef4444' : '#3b82f6'
                  e.target.style.boxShadow = errors.name 
                    ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
                    : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.name ? '#ef4444' : '#e5e7eb'
                  e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
              {formData.name && (
                <div style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#10b981',
                  fontSize: '18px'
                }}>
                  ✓
                </div>
              )}
            </div>
            {errors.name && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#ef4444',
                fontSize: '13px',
                marginTop: '6px',
                fontWeight: '500'
              }}>
                <span>⚠️</span>
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Danh mục *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${errors.category ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="">Chọn danh mục</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.category}
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Số lượng tồn kho *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.stock ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              {errors.stock && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Giá (VNĐ) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${errors.price ? '#ef4444' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                placeholder="0"
              />
              {errors.price && (
                <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Nhà cung cấp *
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${errors.supplier ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff'
              }}
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p style={{ color: '#ef4444', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.supplier}
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'flex-end',
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '2px solid #f1f5f9'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f3f4f6'
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.borderColor = '#e5e7eb'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <span>❌</span>
              <span>Hủy bỏ</span>
            </button>
            <button
              type="submit"
              style={{
                background: editingPart 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: editingPart
                  ? '0 4px 12px rgba(245, 158, 11, 0.4)'
                  : '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)'
                e.currentTarget.style.boxShadow = editingPart
                  ? '0 8px 20px rgba(245, 158, 11, 0.5)'
                  : '0 8px 20px rgba(16, 185, 129, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)'
                e.currentTarget.style.boxShadow = editingPart
                  ? '0 4px 12px rgba(245, 158, 11, 0.4)'
                  : '0 4px 12px rgba(16, 185, 129, 0.4)'
              }}
            >
              <span>{editingPart ? '✏️' : '➕'}</span>
              <span>{editingPart ? 'Cập nhật' : 'Thêm mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

