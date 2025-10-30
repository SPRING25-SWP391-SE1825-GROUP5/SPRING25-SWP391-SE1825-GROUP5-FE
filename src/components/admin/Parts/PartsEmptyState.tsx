import React from 'react'
import './PartsEmptyState.scss'

interface PartsEmptyStateProps {
  onAddPart: () => void
  hasFilters: boolean
  onResetFilters: () => void
}

export default function PartsEmptyState({ onAddPart, hasFilters, onResetFilters }: PartsEmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="parts-empty-state">
        {/* Decorative background elements */}
        <div className="parts-empty-state__decorative-circle parts-empty-state__decorative-circle--top-right parts-empty-state__decorative-circle--top-right-warning" />
        <div className="parts-empty-state__decorative-circle parts-empty-state__decorative-circle--bottom-left" />
        
        <div className="parts-empty-state__icon parts-empty-state__icon--medium">
          🔍
        </div>
        <h3 className="parts-empty-state__title parts-empty-state__title--medium">
          Không tìm thấy phụ tùng
        </h3>
        <p className="parts-empty-state__description parts-empty-state__description--margin-sm">
          Không có phụ tùng nào phù hợp với bộ lọc hiện tại.<br />
          Hãy thử điều chỉnh tiêu chí tìm kiếm của bạn.
        </p>
        <button
          onClick={onResetFilters}
          className="parts-empty-state__button parts-empty-state__button--warning"
        >
          <span>🔄</span>
          <span>Đặt lại bộ lọc</span>
        </button>
      </div>
    )
  }

  return (
    <div className="parts-empty-state">
      {/* Decorative background elements */}
      <div className="parts-empty-state__decorative-circle parts-empty-state__decorative-circle--top-right parts-empty-state__decorative-circle--top-right-success" />
      <div className="parts-empty-state__decorative-circle parts-empty-state__decorative-circle--bottom-left" />
      <div className="parts-empty-state__decorative-circle parts-empty-state__decorative-circle--center" />
      
      <div className="parts-empty-state__icon parts-empty-state__icon--large">
        📦
      </div>
      <h3 className="parts-empty-state__title">
        Chưa có phụ tùng nào
      </h3>
      <p className="parts-empty-state__description">
        Kho phụ tùng đang trống. Bắt đầu bằng cách thêm<br />
        phụ tùng đầu tiên để quản lý tồn kho hiệu quả.
      </p>
      
      {/* Features preview */}
      <div className="parts-empty-state__features">
        <div className="parts-empty-state__features__item">
          <span className="parts-empty-state__features__item__icon parts-empty-state__features__item__icon--blue">📊</span>
          Theo dõi tồn kho
        </div>
        <div className="parts-empty-state__features__item">
          <span className="parts-empty-state__features__item__icon parts-empty-state__features__item__icon--green">💰</span>
          Quản lý giá cả
        </div>
        <div className="parts-empty-state__features__item">
          <span className="parts-empty-state__features__item__icon parts-empty-state__features__item__icon--orange">🏢</span>
          Theo dõi NCC
        </div>
      </div>
      
      <button
        onClick={onAddPart}
        className="parts-empty-state__button parts-empty-state__button--success"
      >
        <div className="parts-empty-state__button__icon-wrapper">+</div>
        <span>Thêm phụ tùng đầu tiên</span>
      </button>
    </div>
  )
}

