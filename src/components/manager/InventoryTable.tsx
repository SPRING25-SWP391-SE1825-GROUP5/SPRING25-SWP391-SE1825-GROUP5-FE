import { Package, Eye, Edit, Trash2 } from 'lucide-react'
import { InventoryPart } from '@/services/inventoryService'
import './InventoryManagement.scss'

interface InventoryTableProps {
  data: InventoryPart[]
  loading: boolean
  error: string | null
  onViewItem: (item: InventoryPart) => void
  onEditItem: (item: InventoryPart) => void
  onDeleteItem: (item: InventoryPart) => void
  onRetry: () => void
}

export default function InventoryTable({
  data,
  loading,
  error,
  onViewItem,
  onEditItem,
  onDeleteItem,
  onRetry
}: InventoryTableProps) {
  if (loading) {
    return (
      <div className="inventory-table-container">
        <div className="loading-state">Đang tải...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-table-container">
        <div className="error-state">
          <div className="error-message">{error}</div>
          <button className="retry-btn" onClick={onRetry}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="inventory-table-container">
        <div className="empty-state">
          <Package size={64} className="empty-icon" />
          <h3 className="empty-title">Không tìm thấy sản phẩm nào</h3>
          <p className="empty-description">
            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="inventory-table-container">
      <table className="table">
        <thead>
          <tr>
            <th className="text-left">Sản phẩm</th>
            <th className="text-center">Mã sản phẩm</th>
            <th className="text-center">Thương hiệu</th>
            <th className="text-center">Tồn kho</th>
            <th className="text-center">Giá</th>
            <th className="text-center">Trạng thái</th>
            <th className="text-center">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={item.inventoryPartId}>
              <td>
                <div className="product-info">
                  <div className="product-icon">
                    <Package size={20} />
                  </div>
                  <div className="product-details">
                    <p className="product-name">{item.partName}</p>
                    <p className="product-brand">{item.brand}</p>
                  </div>
                </div>
              </td>
              <td className="text-center">
                <p>{item.partNumber}</p>
              </td>
              <td className="text-center">
                <p>{item.brand}</p>
              </td>
              <td className="text-center">
                <div className="stock-info">
                  <p className="stock-value">{item.currentStock}</p>
                  <div className="stock-bar">
                    <div
                      className={`stock-fill ${
                        item.isOutOfStock
                          ? 'out-of-stock'
                          : item.isLowStock
                          ? 'low-stock'
                          : 'in-stock'
                      }`}
                      style={{
                        width: `${Math.min(
                          (item.currentStock / (item.minimumStock * 3)) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </td>
              <td className="text-center">
                <p className="price-value">
                  {item.unitPrice.toLocaleString()} VNĐ
                </p>
              </td>
              <td className="text-center">
                <span
                  className={`status-badge ${
                    item.isOutOfStock
                      ? 'out-of-stock'
                      : item.isLowStock
                      ? 'low-stock'
                      : 'in-stock'
                  }`}
                >
                  {item.isOutOfStock
                    ? 'Hết hàng'
                    : item.isLowStock
                    ? 'Sắp hết'
                    : 'Còn hàng'}
                </span>
              </td>
              <td className="text-center">
                <div className="action-buttons">
                  <button
                    onClick={() => onViewItem(item)}
                    className="action-btn view-btn"
                  >
                    <Eye size={16} color="var(--info-600)" />
                  </button>
                  <button
                    onClick={() => onEditItem(item)}
                    className="action-btn edit-btn"
                  >
                    <Edit size={16} color="var(--warning-600)" />
                  </button>
                  <button
                    onClick={() => onDeleteItem(item)}
                    className="action-btn delete-btn"
                  >
                    <Trash2 size={16} color="var(--error-600)" />
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
