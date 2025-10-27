import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import './InventoryManagement.scss'

interface InventoryStatsProps {
  totalParts: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}

export default function InventoryStats({
  totalParts,
  totalValue,
  lowStockCount,
  outOfStockCount
}: InventoryStatsProps) {
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-content">
          <div className="stat-icon primary">
            <Package size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{totalParts}</p>
            <p className="stat-label">Tổng sản phẩm</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-content">
          <div className="stat-icon success">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-value">
              {(totalValue / 1000000).toFixed(1)} triệu VNĐ
            </p>
            <p className="stat-label">Giá trị kho</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-content">
          <div className="stat-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{lowStockCount}</p>
            <p className="stat-label">Sắp hết hàng</p>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-content">
          <div className="stat-icon error">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <p className="stat-value">{outOfStockCount}</p>
            <p className="stat-label">Hết hàng</p>
          </div>
        </div>
      </div>
    </div>
  )
}
