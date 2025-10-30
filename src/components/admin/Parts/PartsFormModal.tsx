import React, { useState, useEffect } from 'react'
import { Part, PartFormData } from '../../../types/parts'
import { SUPPLIER_NAMES } from '../../../constants/appConstants'
import './PartsFormModal.scss'

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

const suppliers = SUPPLIER_NAMES

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
    <div className="parts-form-modal">
      <div className="parts-form-modal__overlay">
        {/* Decorative elements */}
        <div className="parts-form-modal__decorative-circle parts-form-modal__decorative-circle--top-right" />
        <div className="parts-form-modal__decorative-circle parts-form-modal__decorative-circle--bottom-left" />
        
        <div className="parts-form-modal__header">
          <div className="parts-form-modal__header-left">
            <div className={`parts-form-modal__icon ${editingPart ? 'parts-form-modal__icon--edit' : 'parts-form-modal__icon--add'}`}>
              {editingPart ? '✏️' : '➕'}
            </div>
            <div>
              <h3 className="parts-form-modal__title">
                {editingPart ? 'Chỉnh sửa phụ tùng' : 'Thêm phụ tùng mới'}
              </h3>
              <p className="parts-form-modal__subtitle">
                {editingPart ? 'Cập nhật thông tin phụ tùng' : 'Điền thông tin phụ tùng mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="parts-form-modal__close-button"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="parts-form-modal__form">
          <div className="parts-form-modal__form-group">
            <label className="parts-form-modal__label">
              <span className="parts-form-modal__label-icon parts-form-modal__label-icon--purple">🏷️</span>
              Mã sản phẩm *
            </label>
            <div className="parts-form-modal__input-container">
              <input
                type="text"
                value={formData.partNumber}
                onChange={(e) => handleInputChange('partNumber', e.target.value)}
                className={`parts-form-modal__input parts-form-modal__input--monospace ${errors.partNumber ? 'parts-form-modal__input--error' : ''}`}
                placeholder="Nhập mã sản phẩm..."
              />
              {formData.partNumber && (
                <div className="parts-form-modal__success-icon">✓</div>
              )}
            </div>
            {errors.partNumber && (
              <div className="parts-form-modal__error-message">
                <span>⚠️</span>
                <span>{errors.partNumber}</span>
              </div>
            )}
          </div>

          <div className="parts-form-modal__form-group">
            <label className="parts-form-modal__label">
              <span className="parts-form-modal__label-icon parts-form-modal__label-icon--blue">📝</span>
              Tên sản phẩm *
            </label>
            <div className="parts-form-modal__input-container">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`parts-form-modal__input ${errors.name ? 'parts-form-modal__input--error' : ''}`}
                placeholder="Nhập tên sản phẩm..."
              />
              {formData.name && (
                <div className="parts-form-modal__success-icon">✓</div>
              )}
            </div>
            {errors.name && (
              <div className="parts-form-modal__error-message">
                <span>⚠️</span>
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          <div className="parts-form-modal__form-group parts-form-modal__form-group--small">
            <label className="parts-form-modal__label parts-form-modal__label--simple">
              Danh mục *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`parts-form-modal__select ${errors.category ? 'parts-form-modal__select--error' : ''}`}
            >
              <option value="">Chọn danh mục</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="parts-form-modal__error-text">
                {errors.category}
              </p>
            )}
          </div>

          <div className="parts-form-modal__form-group parts-form-modal__form-group--grid">
            <div>
              <label className="parts-form-modal__label parts-form-modal__label--simple">
                Số lượng tồn kho *
              </label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                className={`parts-form-modal__number-input ${errors.stock ? 'parts-form-modal__number-input--error' : ''}`}
              />
              {errors.stock && (
                <p className="parts-form-modal__error-text">
                  {errors.stock}
                </p>
              )}
            </div>

            <div>
              <label className="parts-form-modal__label parts-form-modal__label--simple">
                Giá (VNĐ) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseInt(e.target.value) || 0)}
                className={`parts-form-modal__number-input ${errors.price ? 'parts-form-modal__number-input--error' : ''}`}
                placeholder="0"
              />
              {errors.price && (
                <p className="parts-form-modal__error-text">
                  {errors.price}
                </p>
              )}
            </div>
          </div>

          <div className="parts-form-modal__form-group">
            <label className="parts-form-modal__label parts-form-modal__label--simple">
              Nhà cung cấp *
            </label>
            <select
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              className={`parts-form-modal__select ${errors.supplier ? 'parts-form-modal__select--error' : ''}`}
            >
              <option value="">Chọn nhà cung cấp</option>
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p className="parts-form-modal__error-text">
                {errors.supplier}
              </p>
            )}
          </div>

          <div className="parts-form-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="parts-form-modal__button parts-form-modal__button--cancel"
            >
              <span>❌</span>
              <span>Hủy bỏ</span>
            </button>
            <button
              type="submit"
              className={`parts-form-modal__button parts-form-modal__button--submit ${editingPart ? 'parts-form-modal__button--submit--edit' : 'parts-form-modal__button--submit--add'}`}
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

