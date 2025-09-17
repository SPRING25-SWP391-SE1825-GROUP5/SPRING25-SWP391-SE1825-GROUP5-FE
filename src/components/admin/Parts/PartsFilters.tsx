import React from 'react'
import { PartsFilters as FiltersType } from '../../../types/parts'

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

const suppliers = [
  'Tất cả',
  'Samsung SDI',
  'Delta Electronics',
  'Bosch',
  'Shimano',
  'Panasonic',
  'LG Chem'
]

export default function PartsFilters({ filters, onFiltersChange, onReset }: PartsFiltersProps) {
  const handleFilterChange = (key: keyof FiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      padding: '28px',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #f1f5f9',
      marginBottom: '28px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        borderRadius: '50%',
        opacity: 0.05
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🔍
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0
          }}>
            Bộ lọc tìm kiếm
          </h3>
        </div>
        
        {hasActiveFilters && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: '#fef3c7',
            color: '#92400e',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            <span>⚡</span>
            <span>{Object.values(filters).filter(v => v !== '').length} bộ lọc đang hoạt động</span>
          </div>
        )}
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        alignItems: 'end',
        position: 'relative'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Tìm kiếm
          </label>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: '#9ca3af'
            }}>
              🔍
            </div>
            <input
              type="text"
              placeholder="Tìm theo tên, mã sản phẩm..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: '#ffffff',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                e.target.style.transform = 'translateY(0)'
              }}
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Danh mục
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
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
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Trạng thái
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
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
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Nhà cung cấp
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={filters.supplier}
              onChange={(e) => handleFilterChange('supplier', e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '14px',
                outline: 'none',
                background: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                appearance: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                backgroundPosition: 'right 12px center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '16px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6'
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb'
                e.target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
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
        <div>
          <button
            onClick={onReset}
            disabled={!hasActiveFilters}
            style={{
              background: hasActiveFilters 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : '#f3f4f6',
              color: hasActiveFilters ? '#ffffff' : '#9ca3af',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: hasActiveFilters ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: hasActiveFilters 
                ? '0 4px 6px -1px rgba(239, 68, 68, 0.3)' 
                : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
            onMouseEnter={(e) => {
              if (hasActiveFilters) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 15px -3px rgba(239, 68, 68, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (hasActiveFilters) {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.3)'
              }
            }}
          >
            <span>🔄</span>
            <span>Đặt lại bộ lọc</span>
          </button>
        </div>
      </div>
    </div>
  )
}

