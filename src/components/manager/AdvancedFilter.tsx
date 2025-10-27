import { Search, Filter, X, Package, DollarSign } from 'lucide-react'
import { useState } from 'react'
import './InventoryManagement.scss'

interface AdvancedFilterProps {
  searchTerm: string
  filterCategory: string
  stockStatus: string
  priceRange: { min: number; max: number }
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStockStatusChange: (value: string) => void
  onPriceRangeChange: (range: { min: number; max: number }) => void
  onReset: () => void
}

const stockStatuses = [
  { value: 'all', label: 'Tất cả trạng thái', color: '#6B7280' },
  { value: 'in_stock', label: 'Còn hàng', color: '#22C55E' },
  { value: 'low_stock', label: 'Sắp hết', color: '#F59E0B' },
  { value: 'out_of_stock', label: 'Hết hàng', color: '#EF4444' }
]

export default function AdvancedFilter({
  searchTerm,
  filterCategory,
  stockStatus,
  priceRange,
  onSearchChange,
  onCategoryChange,
  onStockStatusChange,
  onPriceRangeChange,
  onReset
}: AdvancedFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [priceErrors, setPriceErrors] = useState<{
    min?: string
    max?: string
  }>({})

  const validatePriceRange = (min: number, max: number) => {
    const errors: { min?: string; max?: string } = {}
    
    if (min < 0) {
      errors.min = 'Giá trị không được âm'
    }
    
    if (max < 0) {
      errors.max = 'Giá trị không được âm'
    }
    
    if (min > 0 && max > 0 && min > max) {
      errors.max = 'Giá tối đa phải lớn hơn giá tối thiểu'
    }
    
    setPriceErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleMinPriceChange = (value: number) => {
    const newRange = { ...priceRange, min: value }
    onPriceRangeChange(newRange)
    
    // Clear error when user types
    if (priceErrors.min) {
      setPriceErrors(prev => ({ ...prev, min: undefined }))
    }
    
    // Validate if both values are set
    if (value > 0 && priceRange.max > 0) {
      validatePriceRange(value, priceRange.max)
    }
  }

  const handleMaxPriceChange = (value: number) => {
    const newRange = { ...priceRange, max: value }
    onPriceRangeChange(newRange)
    
    // Clear error when user types
    if (priceErrors.max) {
      setPriceErrors(prev => ({ ...prev, max: undefined }))
    }
    
    // Validate if both values are set
    if (priceRange.min > 0 && value > 0) {
      validatePriceRange(priceRange.min, value)
    }
  }

  return (
    <div className="advanced-filter">
      {/* Basic Filters */}
      <div className="filter-row">
        <div className="search-input">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SKU, nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`filter-toggle ${showAdvanced ? 'active' : ''}`}
        >
          <Filter size={18} />
          Lọc nâng cao
          {showAdvanced && <X size={16} />}
        </button>
        <button onClick={onReset} className="reset-btn">
          <X size={16} />
          Đặt lại
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="advanced-filters-panel">
          {/* Stock Status Selection */}
          <div className="filter-group">
            <label className="filter-label">Trạng thái tồn kho</label>
            <div className="status-chips">
              {stockStatuses.map((s) => (
                <button
                  key={s.value}
                  onClick={() => onStockStatusChange(s.value)}
                  className={`status-chip ${stockStatus === s.value ? 'active' : ''}`}
                  style={{
                    borderColor: stockStatus === s.value ? s.color : undefined,
                    background: stockStatus === s.value ? `${s.color}15` : undefined
                  }}
                >
                  <div
                    className="status-dot"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="filter-group">
            <label className="filter-label">
              <DollarSign size={16} />
              Khoảng giá (VNĐ)
            </label>
            <div className="price-range">
              <div className="price-input-wrapper">
                <label>Từ</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={priceRange.min || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value)
                    handleMinPriceChange(value)
                  }}
                  className={`price-input ${priceErrors.min ? 'error' : ''}`}
                />
                {priceErrors.min && (
                  <span className="error-message">{priceErrors.min}</span>
                )}
              </div>
              <span className="range-separator">→</span>
              <div className="price-input-wrapper">
                <label>Đến</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={priceRange.max || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value)
                    handleMaxPriceChange(value)
                  }}
                  className={`price-input ${priceErrors.max ? 'error' : ''}`}
                />
                {priceErrors.max && (
                  <span className="error-message">{priceErrors.max}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
