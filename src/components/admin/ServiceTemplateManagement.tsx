import { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Edit,
  X,
  Plus,
  CheckCircle,
  Search,
  Eye,
  Settings,
  List,
  BarChart2,
  Download,
  EyeOff,
  SlidersHorizontal,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ToggleLeft,
  ToggleRight,
  Circle,
  AlertCircle,
} from 'lucide-react'
import { ServiceChecklistTemplateService, ServiceChecklistTemplate } from '@/services/serviceChecklistTemplateService'
import './ServiceTemplateManagement.scss'

export default function ServiceTemplateManagement() {
  const [templates, setTemplates] = useState<ServiceChecklistTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Dropdown states
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const pageSizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadTemplates()
  }, [currentPage, statusFilter, searchTerm])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setOpenStatusMenu(false)
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) {
        setIsPageSizeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ServiceChecklistTemplateService.getAllTemplates()
      let allTemplates = response.items || []

      // Apply search filter
      if (searchTerm) {
        allTemplates = allTemplates.filter(t =>
          t.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active'
        allTemplates = allTemplates.filter(t => t.isActive === isActive)
      }

      setTotalItems(allTemplates.length)

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedTemplates = allTemplates.slice(startIndex, endIndex)

      setTemplates(paginatedTemplates)
    } catch (err: any) {
      setError('Không thể tải danh sách mẫu checklist: ' + (err.message || 'Unknown error'))
      setTemplates([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / pageSize)
  const pageSizeOptions = [5, 10, 20, 50]

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="service-template-management">
      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            <button type="button" className="toolbar-chip"><List size={14}/> Bảng</button>
            {/* removed dashboard chip */}
            <button type="button" className="toolbar-chip"><FileText size={14}/> Danh sách</button>
            <div className="toolbar-sep"></div>
          </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <span className="icon"><Search size={16}/></span>
              <input
                placeholder="Tìm kiếm mẫu checklist"
                value={searchTerm}
                onChange={(e) => { setCurrentPage(1); setSearchTerm(e.target.value) }}
                onFocus={e => e.target.classList.add('search-input-focus')}
                onBlur={e => e.target.classList.remove('search-input-focus')}
              />
              <span className="search-underline"></span>
            </div>
            <div className="toolbar-actions" style={{marginLeft:'auto'}}>
              {/* removed hide/customize/export buttons */}
              <button type="button" className="accent-button"><Plus size={16}/> Thêm mẫu checklist</button>
            </div>
          </div>
        </div>

        <div className="toolbar-filters">
          {/* Trạng thái */}
          <div className="pill-select" ref={statusRef}>
            <button
              type="button"
              className="pill-trigger"
              onClick={() => { setOpenStatusMenu(!openStatusMenu) }}
            >
              <CheckCircle size={14} style={{marginRight:6}}/>
              {statusOptions.find(o => o.value === statusFilter)?.label || 'Tất cả trạng thái'}
              <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <ul className={`pill-menu ${openStatusMenu ? 'show' : ''}`}>
              {statusOptions.map(opt => (
                <li
                  key={opt.value}
                  className={`pill-item ${statusFilter === opt.value ? 'active' : ''}`}
                  onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); setOpenStatusMenu(false); }}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          <button type="button" className="toolbar-chip"><Plus size={14}/> Thêm bộ lọc</button>
        </div>
      </div>

      {/* Content */}
      <div className="service-template-management__content">
        {loading ? (
          <div className="service-template-management__loading">
            <div className="service-template-management__loading-spinner" />
            <p className="service-template-management__loading-text">Đang tải mẫu checklist...</p>
          </div>
        ) : error ? (
          <div className="service-template-management__error">
            <div className="service-template-management__error-icon" />
            <p className="service-template-management__error-text">{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="service-template-management__empty">
            <div className="service-template-management__empty-icon">
              <FileText size={32} />
            </div>
            <h4 className="service-template-management__empty-title">
              Không tìm thấy mẫu checklist nào
            </h4>
            <p className="service-template-management__empty-text">
              Thử thay đổi bộ lọc hoặc tạo mẫu checklist mới
            </p>
          </div>
        ) : (
          <div className="parts-table-wrapper" style={{ overflow: 'auto' }}>
            <table className="parts-table service-template-management__table">
              <thead className="cm-table-head">
                <tr>
                  <th className="cm-th">
                    <span className="th"><FileText size={16} /> <span>Tên mẫu</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><FileText size={15} /> <span>Mô tả</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><CheckCircle size={15} /> <span>Trạng thái</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><Calendar size={15} /> <span>Ngày tạo</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><Settings size={15} /> <span>Thao tác</span></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <tr key={template.templateID || template.templateId}>
                    <td className="service-template-management__table td">
                      <div className="service-template-management__template-info">
                        <span className="service-template-management__template-name" style={{ fontWeight: 400 }}>
                          {template.templateName}
                        </span>
                      </div>
                    </td>
                    <td className="service-template-management__table td service-template-management__table td--secondary">
                      <div className="service-template-management__template-description">
                        {template.description || 'Không có mô tả'}
                      </div>
                    </td>
                    <td className="service-template-management__table td service-template-management__table td--center">
                      <div className={`status-badge ${template.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        <span className="dot" /> {template.isActive ? 'Hoạt động' : 'Không hoạt động'}
                      </div>
                    </td>
                    <td className="service-template-management__table td service-template-management__table td--secondary">
                      {formatDate(template.createdAt)}
                    </td>
                    <td className="service-template-management__table td">
                      <div className="service-template-management__actions">
                        <button
                          onClick={() => {}}
                          className="service-template-management__action-button"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => {}}
                          className="service-template-management__action-button"
                          title="Sửa mẫu"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {templates.length > 0 && (
        <div className="pagination-controls-bottom">
          <div className="pagination-info">
            <span className="pagination-label">Hàng mỗi trang</span>
            <div
              className="pill-select"
              ref={pageSizeRef}
              tabIndex={0}
              onClick={() => setIsPageSizeDropdownOpen(open => !open)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onBlur={()=>setIsPageSizeDropdownOpen(false)}
            >
              <button type="button" className="pill-trigger" style={{minWidth:32, display:'flex', alignItems:'center', justifyContent:'center', height:26}}>
                {pageSize}
                <svg className="caret" style={{marginLeft:6}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {isPageSizeDropdownOpen && (
                <ul className="pill-menu show" style={{ position: 'absolute', zIndex: 100, left: 0, top: '100%', minWidth: '64px' }}>
                  {pageSizeOptions.map(option => (
                    <li
                      key={option}
                      className={`pill-item ${option === pageSize ? 'active' : ''}`}
                      onClick={() => { setPageSize(option); setCurrentPage(1); setIsPageSizeDropdownOpen(false) }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span className="pagination-range">
              {`${(currentPage-1)*pageSize+1}–${Math.min(currentPage*pageSize, totalItems)} của ${totalItems} hàng`}
            </span>
          </div>
          <div className="pagination-right-controls">
            <button
              className={`pager-btn ${currentPage===1?'is-disabled':''}`}
              disabled={currentPage===1}
              onClick={()=>handlePageChange(1)}
            >
              <ChevronsLeft size={16}/>
            </button>
            <button
              className={`pager-btn ${currentPage===1?'is-disabled':''}`}
              disabled={currentPage===1}
              onClick={()=>handlePageChange(currentPage-1)}
            >
              <ChevronLeft size={16}/>
            </button>
            <div className="pager-pages">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="pager-ellipsis">…</span>
                  )
                }
                const pageNum = page as number
                return (
                  <button
                    key={pageNum}
                    className={`pager-btn ${currentPage === pageNum ? 'is-active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              className={`pager-btn ${currentPage===totalPages?'is-disabled':''}`}
              disabled={currentPage===totalPages}
              onClick={()=>handlePageChange(currentPage+1)}
            >
              <ChevronRight size={16}/>
            </button>
            <button
              className={`pager-btn ${currentPage===totalPages?'is-disabled':''}`}
              disabled={currentPage===totalPages}
              onClick={()=>handlePageChange(totalPages)}
            >
              <ChevronsRight size={16}/>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

