import React, { useEffect, useRef, useState } from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import './PartsPagination.scss'

interface PartsPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export default function PartsPagination({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage, 
  onPageChange, 
  onItemsPerPageChange 
}: PartsPaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false)
  const pageSizeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setOpenPageSizeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const last = Math.max(1, totalPages)

  return (
    <div className="pagination-controls-bottom">
      <div className="pagination-info">
        <span className="pagination-label">Hàng mỗi trang</span>
        <div className="pill-select" ref={pageSizeRef} onClick={(e) => { e.stopPropagation(); setOpenPageSizeMenu(v => !v); }}>
          <button type="button" className="pill-trigger">{itemsPerPage}</button>
          <ChevronDownIcon width={16} height={16} className="caret" />
          {openPageSizeMenu && (
            <ul className="pill-menu show">
              {[10, 15, 20, 30, 50].map(sz => (
                <li key={sz} className={`pill-item ${itemsPerPage === sz ? 'active' : ''}`} onClick={() => { onItemsPerPageChange(sz); setOpenPageSizeMenu(false); }}>
                  {sz}
                </li>
              ))}
            </ul>
          )}
        </div>
        <span className="pagination-range">{startItem}–{endItem} của {totalItems} hàng</span>
      </div>

      <div className="pagination-right-controls">
        <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(1)} className={`pager-btn ${currentPage === 1 ? 'is-disabled' : ''}`}>
          <ChevronsLeft size={16} />
        </button>
        <button type="button" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className={`pager-btn ${currentPage === 1 ? 'is-disabled' : ''}`}>
          <ChevronLeft size={16} />
        </button>
        <div className="pager-pages">
          <button type="button" onClick={() => onPageChange(1)} className={`pager-btn ${currentPage === 1 ? 'is-active' : ''}`}>1</button>
          {last > 2 && <button type="button" onClick={() => onPageChange(2)} className={`pager-btn ${currentPage === 2 ? 'is-active' : ''}`}>2</button>}
          {last > 3 && <span className="pager-ellipsis">…</span>}
          {last >= 3 && <button type="button" onClick={() => onPageChange(last)} className={`pager-btn ${currentPage === last ? 'is-active' : ''}`}>{last}</button>}
        </div>
        <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => onPageChange(currentPage + 1)} className={`pager-btn ${currentPage === totalPages || totalPages === 0 ? 'is-disabled' : ''}`}>
          <ChevronRight size={16} />
        </button>
        <button type="button" disabled={currentPage === totalPages || totalPages === 0} onClick={() => onPageChange(totalPages)} className={`pager-btn ${currentPage === totalPages || totalPages === 0 ? 'is-disabled' : ''}`}>
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  )
}

