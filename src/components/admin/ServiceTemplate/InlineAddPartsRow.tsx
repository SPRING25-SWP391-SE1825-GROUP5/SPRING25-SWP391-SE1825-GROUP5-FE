import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Search, Settings, ChevronDown, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { InlineAddPartsRowProps } from './types'

export const InlineAddPartsRow: React.FC<InlineAddPartsRowProps> = ({
  availableParts,
  loading,
  adding,
  searchTerm,
  onSearchChange,
  selectedParts,
  onTogglePart,
  onSelectAll,
  onAdd,
  onDropPart
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropZoneRef = useRef<HTMLTableCellElement>(null)
  const [draggedPartId, setDraggedPartId] = useState<number | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!showDropdown) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      if (dropdownRef.current && dropdownRef.current.contains(target)) return
      if (buttonRef.current && buttonRef.current.contains(target)) return
      if (dropdownContainerRef.current && dropdownContainerRef.current.contains(target)) return

      setShowDropdown(false)
      setDropdownPosition(null)
    }

    function updateDropdownPosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const dropdownWidth = 600
        const padding = 8

        const top = rect.bottom + padding
        let left = rect.right - dropdownWidth

        if (left < padding) left = padding
        if (rect.right < dropdownWidth) {
          left = rect.right - dropdownWidth
          if (left < padding) left = padding
        }

        setDropdownPosition({ top, left })
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 300)

    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    updateDropdownPosition()

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside, true)
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [showDropdown])

  const filteredParts = (availableParts || []).filter(part =>
    searchTerm.trim() === '' ||
    part.partName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDragStart = (e: React.DragEvent, partId: number) => {
    setDraggedPartId(partId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', partId.toString())
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.cursor = 'grabbing'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => setIsDraggingOver(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const partId = parseInt(e.dataTransfer.getData('text/plain'))
    if (partId && draggedPartId === partId) {
      onDropPart(partId)
      setDraggedPartId(null)
    }
  }

  const handleDragEnd = () => setDraggedPartId(null)

  const handleSelectAllClick = () => {
    onSelectAll()
    const allPartIds = new Set((filteredParts || []).map(p => p.partId))
    if (allPartIds.size > 0) {
      setTimeout(() => onAdd(Array.from(allPartIds)), 300)
    }
  }

  const handleTogglePartWithAutoAdd = (partId: number) => {
    const isCurrentlySelected = selectedParts.has(partId)
    onTogglePart(partId)
    if (!isCurrentlySelected) {
      setTimeout(() => onAdd([partId]), 150)
    }
  }

  const handleAddClick = () => {
    if (selectedParts.size > 0) {
      onAdd(Array.from(selectedParts))
    } else {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
    }
  }

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation()

    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const dropdownWidth = 600
      const padding = 8
      const top = rect.bottom + padding
      let left = rect.right - dropdownWidth
      if (left < padding) left = padding
      if (rect.right < dropdownWidth) {
        left = rect.right - dropdownWidth
        if (left < padding) left = padding
      }
      setDropdownPosition({ top, left })
      setTimeout(() => setShowDropdown(true), 10)
    } else {
      setShowDropdown(false)
      setDropdownPosition(null)
    }
  }

  return (
    <tr style={{
      backgroundColor: isDraggingOver ? '#fef3c7' : adding ? '#f3f4f6' : '#fef9e7',
      borderBottom: '2px dashed #fde68a'
    }}>
      <td style={{ padding: '12px', textAlign: 'center' }}>
        {adding ? (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Đang thêm...</div>
        ) : (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>⬇️</div>
        )}
      </td>
      <td
        colSpan={3}
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: '12px',
          textAlign: 'center',
          color: isDraggingOver ? '#92400e' : '#6b7280',
          fontSize: '14px',
          border: isDraggingOver ? '2px dashed #fde68a' : 'none',
          borderRadius: '4px'
        }}
      >
        {isDraggingOver ? 'Thả phụ tùng vào đây' : 'Kéo thả phụ tùng vào đây hoặc chọn từ dropdown'}
      </td>
      <td style={{ padding: '12px', position: 'relative', overflow: 'visible' }}>
        <div ref={dropdownContainerRef} style={{ position: 'relative', zIndex: 1001 }}>
          <button
            ref={buttonRef}
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleButtonClick}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              background: '#fde68a',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Settings size={14} />
            Chọn phụ tùng
            <ChevronDown size={14} />
          </button>

          {showDropdown && dropdownPosition && typeof document !== 'undefined' && createPortal(
            <div
              ref={(el) => { dropdownRef.current = el }}
              className="inline-parts-dropdown"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: `${dropdownPosition.left}px`,
                top: `${dropdownPosition.top}px`,
                width: '600px',
                maxHeight: '500px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 10050,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fde68a 0%, #fef3c7 100%)', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Chọn phụ tùng</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(false)
                      setDropdownPosition(null)
                    }}
                    style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#1a1a1a'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', color: '#9ca3af', zIndex: 1 }} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm phụ tùng..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#fff',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(253, 230, 138, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                background: '#fff'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectAllClick()
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e5e7eb' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f3f4f6' }}
                >
                  Chọn hết ({(filteredParts || []).length})
                </button>
                <span style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500',
                  flex: 1,
                  textAlign: 'right'
                }}>
                  Đã chọn: <strong style={{ color: '#fde68a' }}>{selectedParts.size}</strong>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddClick()
                  }}
                  disabled={adding || selectedParts.size === 0}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#fde68a',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (adding || selectedParts.size === 0) ? 'not-allowed' : 'pointer',
                    opacity: (adding || selectedParts.size === 0) ? 0.5 : 1,
                    transition: 'all 0.2s',
                    boxShadow: (adding || selectedParts.size === 0) ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!adding && selectedParts.size > 0) {
                      e.currentTarget.style.background = '#fef3c7'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!adding && selectedParts.size > 0) {
                      e.currentTarget.style.background = '#fde68a'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {adding ? 'Đang thêm...' : 'Thêm'}
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', maxHeight: '320px', background: '#fff' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Đang tải...</p>
                  </div>
                ) : (filteredParts || []).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Không tìm thấy phụ tùng nào</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead style={{
                      background: '#f9fafb',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <tr>
                        <th style={{ padding: '12px', textAlign: 'left', width: '40px', fontWeight: '600', color: '#374151' }}></th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Tên</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Mã số</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Thương hiệu</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredParts || []).map((part) => (
                        <tr
                          key={part.partId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, part.partId)}
                          onDragEnd={handleDragEnd}
                          style={{
                            cursor: draggedPartId === part.partId ? 'grabbing' : 'grab',
                            borderBottom: '1px solid #f3f4f6',
                            backgroundColor: selectedParts.has(part.partId) ? '#fef3c7' : 'transparent',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedParts.has(part.partId)) {
                              e.currentTarget.style.backgroundColor = '#f9fafb'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedParts.has(part.partId)) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={selectedParts.has(part.partId)}
                              onChange={() => handleTogglePartWithAutoAdd(part.partId)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                cursor: 'pointer',
                                width: '18px',
                                height: '18px',
                                accentColor: '#fde68a'
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937' }}>{part.partName}</td>
                          <td style={{ padding: '12px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>{part.partNumber}</td>
                          <td style={{ padding: '12px', color: '#6b7280' }}>{part.brand}</td>
                          <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                            {part.unitPrice ? `${part.unitPrice.toLocaleString('vi-VN')} VND` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </td>
    </tr>
  )
}

