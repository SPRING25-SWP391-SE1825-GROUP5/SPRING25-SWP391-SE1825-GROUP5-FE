import React from 'react'
import { Plus } from 'lucide-react'

interface PartsHeaderProps {
  onAddPart: () => void
  onExportExcel: () => void
}

export default function PartsHeader({ onAddPart, onExportExcel }: PartsHeaderProps) {
  return (
    <div className="users-toolbar">
      <div className="toolbar-top">
        <div className="toolbar-left">
          {/* removed dashboard chip */}
          <div className="toolbar-sep"/>
        </div>
        <div className="toolbar-right" style={{flex:1}}>
          <div className="toolbar-search">
            <div className="search-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
              <input placeholder="Tìm phụ tùng theo tên" />
            </div>
          </div>
          <div className="toolbar-actions">
            {/* removed export button */}
          </div>
        </div>
      </div>
      <div className="toolbar-filters">
        <div className="pill-select"><button type="button" className="pill-trigger">Tất cả trạng thái</button></div>
        <div className="pill-select"><button type="button" className="pill-trigger">Tất cả danh mục</button></div>
        <button type="button" className="toolbar-chip">Thêm bộ lọc</button>
        <div className="toolbar-actions" style={{marginLeft:'auto'}}>
          <button type="button" className="toolbar-adduser accent-button" onClick={onAddPart}><Plus size={16}/> Thêm phụ tùng</button>
        </div>
      </div>
    </div>
  )
}

