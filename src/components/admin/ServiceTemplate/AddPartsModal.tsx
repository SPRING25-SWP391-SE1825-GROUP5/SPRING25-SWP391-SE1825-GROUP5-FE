import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { AddPartsModalProps } from './types'

export const AddPartsModal: React.FC<AddPartsModalProps> = ({
  open,
  onClose,
  onAdd,
  availableParts,
  loading,
  adding,
  searchTerm,
  onSearchChange
}) => {
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      setSelectedParts(new Set())
    }
  }, [open])

  const filteredParts = (availableParts || []).filter(part =>
    part.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTogglePart = (partId: number) => {
    setSelectedParts(prev => {
      const updated = new Set(prev)
      if (updated.has(partId)) {
        updated.delete(partId)
      } else {
        updated.add(partId)
      }
      return updated
    })
  }

  const handleSelectAll = () => {
    const parts = filteredParts || []
    if (selectedParts.size === parts.length) {
      setSelectedParts(new Set())
    } else {
      setSelectedParts(new Set(parts.map(p => p.partId)))
    }
  }

  const handleSubmit = () => {
    if (selectedParts.size === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
      return
    }
    onAdd(Array.from(selectedParts))
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Chọn phụ tùng để thêm</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Tìm kiếm phụ tùng..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Đang tải danh sách phụ tùng...</p>
            </div>
          ) : (filteredParts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#6b7280' }}>Không tìm thấy phụ tùng nào</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedParts.size === (filteredParts || []).length && (filteredParts || []).length > 0}
                      onChange={handleSelectAll}
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
                {(filteredParts || []).map((part, index, arr) => (
                  <tr key={part.partId} style={{ borderBottom: index < arr.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedParts.has(part.partId)}
                        onChange={() => handleTogglePart(part.partId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{part.partName}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{part.partNumber}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{part.brand}</td>
                    <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right' }}>
                      {part.unitPrice ? `${part.unitPrice.toLocaleString('vi-VN')} VND` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Đã chọn: {selectedParts.size} phụ tùng
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              disabled={adding}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fff',
                cursor: adding ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: adding ? 0.6 : 1
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={adding || selectedParts.size === 0}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#fde68a',
                color: '#1a1a1a',
                cursor: (adding || selectedParts.size === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: (adding || selectedParts.size === 0) ? 0.6 : 1
              }}
            >
              {adding ? 'Đang thêm...' : `Thêm ${selectedParts.size} phụ tùng`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

