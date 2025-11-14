import { ChevronRight, Package } from 'lucide-react'
import type { InventoryListItem, InventoryPart } from '@/services/inventoryService'

interface InventoryCenterSectionProps {
  inventory: InventoryListItem
  parts: InventoryPart[]
  isExpanded: boolean
  onToggle: () => void
  formatCurrency: (value: number) => string
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Không xác định'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Không xác định'
    return date.toLocaleString('vi-VN')
  } catch {
    return 'Không xác định'
  }
}

const computeStatusLabel = (part: InventoryPart) => {
  if (part.isOutOfStock || (part.currentStock ?? 0) === 0) return 'Hết hàng'
  if (part.isLowStock || (part.minimumStock ?? 0) > (part.currentStock ?? 0)) return 'Sắp hết'
  return 'Còn hàng'
}

const statusColors: Record<'out' | 'low' | 'in', { bg: string; color: string; border: string }> = {
  out: { bg: 'var(--error-50)', color: 'var(--error-700)', border: '1px solid var(--error-200)' },
  low: { bg: 'var(--warning-50)', color: 'var(--warning-700)', border: '1px solid var(--warning-200)' },
  in: { bg: 'var(--success-50)', color: 'var(--success-700)', border: '1px solid var(--success-200)' }
}

export default function InventoryCenterSection({
  inventory,
  parts,
  isExpanded,
  onToggle,
  formatCurrency
}: InventoryCenterSectionProps) {
  const statusKey = (part: InventoryPart) => {
    if (part.isOutOfStock || (part.currentStock ?? 0) === 0) return 'out'
    if (part.isLowStock || (part.minimumStock ?? 0) > (part.currentStock ?? 0)) return 'low'
    return 'in'
  }

  return (
    <div style={{
      border: '1px solid var(--border-primary)',
      borderRadius: '12px',
      background: 'var(--bg-card)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {inventory.centerName || 'Kho chưa xác định'}
          </span>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {`Tổng phụ tùng: ${inventory.partsCount ?? parts.length}`} · Cập nhật: {formatDateTime(inventory.lastUpdated)}
          </span>
        </div>
        <ChevronRight
          size={20}
          style={{
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            color: 'var(--text-secondary)'
          }}
        />
      </button>

      {isExpanded && (
        <div style={{ padding: '0 24px 24px 24px' }}>
          {parts.length === 0 ? (
            <div style={{
              padding: '24px',
              border: '1px dashed var(--border-primary)',
              borderRadius: '12px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              Không có phụ tùng nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Phụ tùng</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Mã</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Thương hiệu</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Tồn kho</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Giá</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part, index) => {
                    const minStock = part.minimumStock ?? 0
                    const stock = part.currentStock ?? 0
                    const maxStock = Math.max(minStock * 2, stock + minStock, 1)
                    const status = statusKey(part)
                    const colors = statusColors[status]

                    return (
                      <tr
                        key={part.inventoryPartId || `${inventory.inventoryId}-${index}`}
                        style={{
                          borderBottom: index < parts.length - 1 ? '1px solid var(--border-primary)' : 'none',
                          background: 'var(--bg-card)'
                        }}
                      >
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '8px',
                              background: 'var(--primary-50)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--primary-500)'
                            }}>
                              <Package size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                                {part.partName || 'Không xác định'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                ID: {part.partId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{part.partNumber || '—'}</td>
                        <td style={{ padding: '16px', color: 'var(--text-primary)' }}>{(part.brand || 'Khác').trim() || 'Khác'}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            {stock} cái
                          </div>
                          <div style={{
                            width: '120px',
                            height: '6px',
                            background: 'var(--border-primary)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, (stock / maxStock) * 100))}%`,
                                height: '100%',
                                background: status === 'out' ? 'var(--error-500)' : status === 'low' ? 'var(--warning-500)' : 'var(--success-500)'
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                            Tối thiểu: {minStock}
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {formatCurrency(part.unitPrice ?? 0)}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '6px 12px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: 600,
                              background: colors.bg,
                              color: colors.color,
                              border: colors.border
                            }}
                          >
                            {computeStatusLabel(part)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

