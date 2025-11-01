import React from 'react'
import { PartsFilters as FiltersType } from '../../../types/parts'
import { SUPPLIER_NAMES } from '../../../constants/appConstants'
import './PartsFilters.scss'

interface PartsFiltersProps {
  filters: FiltersType
  onFiltersChange: (filters: FiltersType) => void
  onReset: () => void
}

const categories = [
  'Tất cả',
  'Hệ thống điện',
  'Phụ kiện sạc',
  'Động cơ',
  'Hệ thống phanh',
  'Khung xe',
  'Lốp xe',
  'Phụ kiện khác'
]

const statuses = [
  'Tất cả',
  'Còn hàng',
  'Sắp hết',
  'Hết hàng'
]

const suppliers = ['Tất cả', ...SUPPLIER_NAMES]

export default function PartsFilters({ filters, onFiltersChange, onReset }: PartsFiltersProps) {
  const handleFilterChange = (key: keyof FiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="parts-filters">
      {/* Decorative elements */}
      <div className="parts-filters__decorative-circle" />
      
      {/* Header */}
      <div className="parts-filters__header">
        <div className="parts-filters__header-left">
          <div className="parts-filters__icon-wrapper">🔍</div>
          <h3 className="parts-filters__title">Bộ lọc tìm kiếm</h3>
        </div>
        
        {hasActiveFilters && (
          <div className="parts-filters__active-badge">
            <span>⚡</span>
            <span>{Object.values(filters).filter(v => v !== '').length} bộ lọc đang hoạt động</span>
          </div>
        )}
      </div>
      
      <div className="parts-filters__grid">
        {/* Search Input */}
        <div className="parts-filters__form-group">
          <label className="parts-filters__label">Tìm kiếm</label>
          <div className="parts-filters__input-container">
            <div className="parts-filters__search-icon">🔍</div>
            <input
              type="text"
              placeholder="Tìm theo tên, mã sản phẩm..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="parts-filters__input"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="parts-filters__form-group">
          <label className="parts-filters__label">Danh mục</label>
          <div className="parts-filters__input-container">
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="parts-filters__select"
            >
              {categories.map(category => (
                <option key={category} value={category === 'Tất cả' ? '' : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter */}
        <div className="parts-filters__form-group">
          <label className="parts-filters__label">Trạng thái</label>
          <div className="parts-filters__input-container">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="parts-filters__select"
            >
              {statuses.map(status => (
                <option key={status} value={status === 'Tất cả' ? '' : status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Supplier Filter */}
        <div className="parts-filters__form-group">
          <label className="parts-filters__label">Nhà cung cấp</label>
          <div className="parts-filters__input-container">
            <select
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              className="parts-filters__select"
            >
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier === 'Tất cả' ? '' : supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Button */}
        <div className="parts-filters__form-group">
          <button
            onClick={onReset}
            disabled={!hasActiveFilters}
            className="parts-filters__reset-button"
          >
            <span>🔄</span>
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      </div>
    </div>
  )
}
