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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => goto(page)} className={`pager-btn ${currentPage === page ? 'is-active' : ''}`}>{page}</button>
          ))}
        </div>
        <button type="button" disabled={currentPage === totalPages} onClick={() => goto(currentPage + 1)} className={`pager-btn ${currentPage === totalPages ? 'is-disabled' : ''}`}><ChevronRight size={16} /></button>
        <button type="button" disabled={currentPage === totalPages} onClick={() => goto(totalPages)} className={`pager-btn ${currentPage === totalPages ? 'is-disabled' : ''}`}><ChevronsRight size={16} /></button>
      </div>
    </div>
  )
}
