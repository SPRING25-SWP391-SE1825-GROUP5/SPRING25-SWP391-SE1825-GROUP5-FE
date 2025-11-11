import React from 'react'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'

interface Props {
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
}

export default function WorkQueuePagination({ currentPage, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null
  const goto = (p: number) => onChange(Math.min(Math.max(1, p), totalPages))

  // Tính toán các trang cần hiển thị
  const getPageNumbers = () => {
    const delta = 2 // Số trang hiển thị mỗi bên của trang hiện tại
    const pages: (number | string)[] = []

    // Luôn hiển thị trang đầu
    pages.push(1)

    // Tính toán range xung quanh trang hiện tại
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)

    // Thêm dấu "..." nếu cần
    if (start > 2) {
      pages.push('...')
    }

    // Thêm các trang trong range
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }

    // Thêm dấu "..." nếu cần
    if (end < totalPages - 1) {
      pages.push('...')
    }

    // Luôn hiển thị trang cuối (nếu > 1)
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', padding: '8px 0' }}>
      <div className="pagination-info">
        <span className="pagination-label">Trang</span>
        <span className="pagination-range" style={{ marginLeft: 8 }}>{currentPage} / {totalPages}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" disabled={currentPage === 1} onClick={() => goto(1)} className={`pager-btn ${currentPage === 1 ? 'is-disabled' : ''}`}><ChevronsLeft size={16} /></button>
        <button type="button" disabled={currentPage === 1} onClick={() => goto(currentPage - 1)} className={`pager-btn ${currentPage === 1 ? 'is-disabled' : ''}`}><ChevronLeft size={16} /></button>
        <div className="pager-pages">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} style={{ padding: '8px 4px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                  ...
                </span>
              )
            }
            return (
              <button
                key={page}
                onClick={() => goto(page as number)}
                className={`pager-btn ${currentPage === page ? 'is-active' : ''}`}
              >
                {page}
              </button>
            )
          })}
        </div>
        <button type="button" disabled={currentPage === totalPages} onClick={() => goto(currentPage + 1)} className={`pager-btn ${currentPage === totalPages ? 'is-disabled' : ''}`}><ChevronRight size={16} /></button>
        <button type="button" disabled={currentPage === totalPages} onClick={() => goto(totalPages)} className={`pager-btn ${currentPage === totalPages ? 'is-disabled' : ''}`}><ChevronsRight size={16} /></button>
      </div>
    </div>
  )
}
