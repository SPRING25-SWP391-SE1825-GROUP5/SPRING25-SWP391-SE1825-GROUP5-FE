import React from 'react'
import { Plus } from 'lucide-react'
import { GetItemsResponse } from '@/services/serviceChecklistTemplateService'
import { Part } from '@/services/partService'
import { InlineAddPartsRow } from './InlineAddPartsRow'

interface TemplateExpandedContentProps {
  templateId: number
  isLoading: boolean
  items: GetItemsResponse | null
  selectedPartIds: Set<number>
  removingParts: boolean
  showAddRowForTemplate: number | null
  availablePartsForTemplate: Part[]
  loadingParts: boolean
  addingRowTemplateId: number | null
  searchPartsTerm: string
  selectedPartsForRow: Set<number>
  onRemoveParts: (partIds: number[]) => void
  onClearSelection: () => void
  onToggleAddRow: () => void
  onTogglePartSelection: (partId: number) => void
  onSelectAllParts: () => void
  onSearchChange: (term: string) => void
  onTogglePart: (partId: number) => void
  onSelectAll: () => void
  onAdd: (partIds: number[]) => void
  onDropPart: (partId: number) => void
}

export const TemplateExpandedContent: React.FC<TemplateExpandedContentProps> = ({
  templateId,
  isLoading,
  items,
  selectedPartIds,
  removingParts,
  showAddRowForTemplate,
  availablePartsForTemplate,
  loadingParts,
  addingRowTemplateId,
  searchPartsTerm,
  selectedPartsForRow,
  onRemoveParts,
  onClearSelection,
  onToggleAddRow,
  onTogglePartSelection,
  onSelectAllParts,
  onSearchChange,
  onTogglePart,
  onSelectAll,
  onAdd,
  onDropPart
}) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>Đang tải danh sách phụ tùng...</p>
      </div>
    )
  }

  if (items && items.items && items.items.length > 0) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
            Danh sách phụ tùng ({(items.items || []).length})
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedPartIds.size > 0 && (
              <>
                <button
                  onClick={() => onRemoveParts(Array.from(selectedPartIds))}
                  disabled={removingParts}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: removingParts ? 'wait' : 'pointer',
                    opacity: removingParts ? 0.6 : 1
                  }}
                >
                  {removingParts ? 'Đang xóa...' : `Xóa đã chọn (${selectedPartIds.size})`}
                </button>
                <button
                  onClick={onClearSelection}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    background: '#e5e7eb',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Bỏ chọn
                </button>
              </>
            )}
            <button
              onClick={onToggleAddRow}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                background: showAddRowForTemplate === templateId ? '#ef4444' : '#fde68a',
                color: '#1a1a1a',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> {showAddRowForTemplate === templateId ? 'Đóng' : 'Thêm phụ tùng'}
            </button>
          </div>
        </div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedPartIds.size === (items.items || []).length && (items.items || []).length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onSelectAllParts()
                      } else {
                        onClearSelection()
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Mã số</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Thương hiệu</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Giá</th>
              </tr>
            </thead>
            <tbody>
              {(items.items || []).map((item, index, arr) => (
                <tr key={item.itemId} style={{ borderBottom: index < arr.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedPartIds.has(item.partId) || false}
                      onChange={() => onTogglePartSelection(item.partId)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{item.partName || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{item.partNumber || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{item.brand || 'N/A'}</td>
                  <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right' }}>
                    {item.price ? `${item.price.toLocaleString('vi-VN')} VND` : 'N/A'}
                  </td>
                </tr>
              ))}
              {showAddRowForTemplate === templateId && (
                <InlineAddPartsRow
                  templateId={templateId}
                  availableParts={availablePartsForTemplate}
                  loading={loadingParts}
                  adding={addingRowTemplateId === templateId}
                  searchTerm={searchPartsTerm}
                  onSearchChange={onSearchChange}
                  selectedParts={selectedPartsForRow}
                  onTogglePart={onTogglePart}
                  onSelectAll={onSelectAll}
                  onAdd={onAdd}
                  onDropPart={onDropPart}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Chưa có phụ tùng nào trong mẫu này
        </p>
        <button
          onClick={onToggleAddRow}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            background: '#fde68a',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Plus size={14} /> Thêm phụ tùng
        </button>
      </div>
      {showAddRowForTemplate === templateId && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40px' }}></th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Mã số</th>
                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Thương hiệu</th>
                <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Giá</th>
              </tr>
            </thead>
            <tbody>
              <InlineAddPartsRow
                templateId={templateId}
                availableParts={availablePartsForTemplate}
                loading={loadingParts}
                adding={addingRowTemplateId === templateId}
                searchTerm={searchPartsTerm}
                onSearchChange={onSearchChange}
                selectedParts={selectedPartsForRow}
                onTogglePart={onTogglePart}
                onSelectAll={onSelectAll}
                onAdd={onAdd}
                onDropPart={onDropPart}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

