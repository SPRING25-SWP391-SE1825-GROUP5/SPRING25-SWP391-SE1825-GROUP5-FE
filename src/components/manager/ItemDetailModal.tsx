import { Package, DollarSign, AlertTriangle, X } from 'lucide-react'
import { InventoryPart } from '@/services/inventoryService'
import './InventoryManagement.scss'

interface ItemDetailModalProps {
  isOpen: boolean
  item: InventoryPart | null
  onClose: () => void
}

export default function ItemDetailModal({
  isOpen,
  item,
  onClose
}: ItemDetailModalProps) {
  if (!isOpen || !item) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Chi tiết sản phẩm</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--primary-500)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              <Package size={20} />
            </div>
            <div>
              <p style={{
                margin: '0 0 4px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#111827'
              }}>
                {item.partName}
              </p>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#6B7280'
              }}>
                {item.partNumber} • {item.brand}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px'
            }}>
              <Package size={16} color="var(--primary-600)" />
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Thương hiệu</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>{item.brand}</p>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              background: '#F9FAFB',
              borderRadius: '8px'
            }}>
              <DollarSign size={16} color="#22C55E" />
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Giá</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>
                  {item.unitPrice.toLocaleString()} VNĐ
                </p>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            background: '#F9FAFB',
            borderRadius: '8px'
          }}>
            <AlertTriangle size={16} color="#F59E0B" />
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>Tồn kho</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#111827' }}>
                {item.currentStock} (Tối thiểu: {item.minimumStock})
              </p>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: '24px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
