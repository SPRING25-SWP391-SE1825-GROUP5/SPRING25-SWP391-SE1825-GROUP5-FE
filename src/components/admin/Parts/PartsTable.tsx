import React from 'react'
import { Part } from '../../../types/parts'
import './PartsTable.scss'
import PartsPagination from './PartsPagination'

interface PartsTableProps {
  parts: Part[]
  onEdit: (part: Part) => void
  onDelete: (partId: string) => void
  showPagination?: boolean
  currentPage?: number
  itemsPerPage?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
}

export default function PartsTable({ 
  parts, 
  onEdit, 
  onDelete, 
  showPagination = false,
  currentPage = 1,
  itemsPerPage = 10,
  totalItems = 0,
  onPageChange,
  onItemsPerPageChange
}: PartsTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Còn hàng': return 'parts-table__status-badge--in-stock'
      case 'Sắp hết': return 'parts-table__status-badge--low-stock'
      case 'Hết hàng': return 'parts-table__status-badge--out-of-stock'
      default: return 'parts-table__status-badge--in-stock'
    }
  }

  const getStockClass = (stock: number) => {
    if (stock < 15) return 'parts-table__stock-value--low'
    if (stock < 25) return 'parts-table__stock-value--medium'
    return 'parts-table__stock-value--high'
  }

  const getStockFillClass = (stock: number) => {
    if (stock < 15) return 'parts-table__stock-fill--low'
    if (stock < 25) return 'parts-table__stock-fill--medium'
    return 'parts-table__stock-fill--high'
  }

  return (
    <div className="parts-table">
      {/* Table Header */}
      <div className="parts-table__header">
        <div className="parts-table__header-left">
          <div className="parts-table__header-icon">📋</div>
          <h3 className="parts-table__header-title">Danh sách phụ tùng</h3>
        </div>
        
        <div className="parts-table__header-badge">
          <span>📦</span>
          <span>{parts.length} sản phẩm</span>
        </div>
      </div>
      
      <div className="parts-table__container">
        <table className="parts-table__table">
          <thead className="parts-table__thead">
            <tr>
              <th className="parts-table__th">
                <div className="parts-table__th-content">
                  <span>🆔</span>
                  <span>ID</span>
                </div>
              </th>
              <th className="parts-table__th">
                <div className="parts-table__th-content">
                  <span>🏷️</span>
                  <span>Mã sản phẩm</span>
                </div>
              </th>
              <th className="parts-table__th">
                <div className="parts-table__th-content">
                  <span>📦</span>
                  <span>Tên sản phẩm</span>
                </div>
              </th>
              <th className="parts-table__th">
                <div className="parts-table__th-content">
                  <span>🏷️</span>
                  <span>Danh mục</span>
                </div>
              </th>
              <th className="parts-table__th parts-table__th--center">
                <div className="parts-table__th-content parts-table__th-content--center">
                  <span>📊</span>
                  <span>Tồn kho</span>
                </div>
              </th>
              <th className="parts-table__th parts-table__th--right">
                <div className="parts-table__th-content parts-table__th-content--right">
                  <span>💰</span>
                  <span>Giá</span>
                </div>
              </th>
              <th className="parts-table__th">
                <div className="parts-table__th-content">
                  <span>🏢</span>
                  <span>NCC</span>
                </div>
              </th>
              <th className="parts-table__th parts-table__th--center">
                <div className="parts-table__th-content parts-table__th-content--center">
                  <span>⚡</span>
                  <span>Trạng thái</span>
                </div>
              </th>
              <th className="parts-table__th parts-table__th--center">
                <div className="parts-table__th-content parts-table__th-content--center">
                  <span>⚙️</span>
                  <span>Thao tác</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="parts-table__tbody">
            {parts.map((part, index) => (
              <tr key={part.id}>
                <td className="parts-table__td parts-table__td--bold">
                  <div className="parts-table__id-container">
                    <div className="parts-table__id-dot" />
                    <span className="parts-table__id-badge">{part.id}</span>
                  </div>
                </td>
                <td className="parts-table__td parts-table__td--bold">
                  <div className="parts-table__part-number-container">
                    <div className="parts-table__part-number-dot" />
                    <span className="parts-table__part-number-badge">{part.partNumber}</span>
                  </div>
                </td>
                <td className="parts-table__td">
                  <div className="parts-table__product-name">{part.name}</div>
                  <div className="parts-table__last-updated">Cập nhật: {part.lastUpdated}</div>
                </td>
                <td className="parts-table__td">
                  <span className="parts-table__category-badge">{part.category}</span>
                </td>
                <td className="parts-table__td parts-table__td--center">
                  <div className="parts-table__stock-container">
                    <span className={`parts-table__stock-value ${getStockClass(part.stock)}`}>
                      {part.stock}
                    </span>
                    <div className="parts-table__stock-bar">
                      <div 
                        className={`parts-table__stock-fill ${getStockFillClass(part.stock)}`}
                        style={{ width: `${Math.min((part.stock / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="parts-table__td parts-table__td--right">
                  <div className="parts-table__price">{formatPrice(part.price)}</div>
                </td>
                <td className="parts-table__td">
                  <div className="parts-table__supplier-container">
                    <div className="parts-table__supplier-avatar">
                      {part.supplier.charAt(0)}
                    </div>
                    <span className="parts-table__supplier-name">{part.supplier}</span>
                  </div>
                </td>
                <td className="parts-table__td parts-table__td--center">
                  <span className={`parts-table__status-badge ${getStatusClass(part.status)}`}>
                    {part.status}
                  </span>
                </td>
                <td className="parts-table__td parts-table__td--center">
                  <div className="parts-table__actions">
                    <button 
                      onClick={() => onEdit(part)}
                      className="parts-table__action-button parts-table__action-button--edit"
                      title="Chỉnh sửa phụ tùng"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => onDelete(part.id)}
                      className="parts-table__action-button parts-table__action-button--delete"
                      title="Xóa phụ tùng"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showPagination && onPageChange && onItemsPerPageChange && (
        <PartsPagination 
          currentPage={currentPage}
          totalPages={Math.ceil(totalItems / itemsPerPage)}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </div>
  )
}
