import { useState, useEffect, useRef } from 'react'
import {
  Package,
  FileText,
  Settings,
  DollarSign,
  Activity,
  Search,
  RefreshCw,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  AlertCircle,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'
import api from '../../services/api'
import './PartManagement.scss'

export default function PartManagement() {
  const [partsData, setPartsData] = useState<any[]>([])
  const [allParts, setAllParts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterRating, setFilterRating] = useState('all')
  const [filterPrice, setFilterPrice] = useState('all')
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [newPart, setNewPart] = useState({
    partNumber: '',
    partName: '',
    brand: '',
    unitPrice: 0,
    isActive: true
  })

  const mapApiPartToUi = (p: any) => ({
    id: String(p.partId),
    partNumber: p.partNumber,
    name: p.partName,
    category: p.brand,
    stock: 0,
    price: p.price,
    supplier: p.brand,
    status: p.isActive ? 'Còn hàng' : 'Hết hàng',
    isActive: p.isActive,
    lastUpdated: new Date(p.createdAt).toLocaleDateString('vi-VN')
  })

  const appendNewApiPartAtEnd = (apiPart: any) => {
    const mapped = mapApiPartToUi(apiPart)
    setAllParts((prev) => {
      const merged = [...prev, mapped].sort((a, b) => Number(a.id) - Number(b.id))
      setTotalCount(merged.length)
      const lastPage = Math.max(1, Math.ceil(merged.length / pageSize))
      setPageNumber(lastPage)
      return merged
    })
  }

  const [filters, setFilters] = useState({
    search: '',
    idOrder: 'desc' as 'asc' | 'desc'
  })

  // Sort functions
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, partId: null })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const getStatusColor = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'var(--success-500)' : 'var(--error-500)'
    }
    switch (status) {
      case 'Còn hàng': return 'var(--success-500)'
      case 'Sắp hết': return 'var(--warning-500)'
      case 'Hết hàng': return 'var(--error-500)'
      default: return 'var(--text-secondary)'
    }
  }

  const getStatusBg = (status: string | boolean) => {
    if (typeof status === 'boolean') {
      return status ? 'var(--success-50)' : 'var(--error-50)'
    }
    switch (status) {
      case 'Còn hàng': return 'var(--success-50)'
      case 'Sắp hết': return 'var(--warning-50)'
      case 'Hết hàng': return 'var(--error-50)'
      default: return 'var(--bg-tertiary)'
    }
  }

  // Build ordered source list based on full dataset, then paginate
  const buildOrderedAllParts = () => {
    const text = (s: string) => (s || '').toLowerCase()
    
    // Apply search filter
    let filtered = !searchTerm
      ? allParts
      : allParts.filter((part) =>
          text(part.name).includes(text(searchTerm)) ||
          String(part.id).toLowerCase().includes(text(searchTerm)) ||
          String((part as any).partNumber || '').toLowerCase().includes(text(searchTerm))
        )
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((part) => {
        if (filterStatus === 'active') return part.isActive
        if (filterStatus === 'inactive') return !part.isActive
        return true
      })
    }
    
    // Apply rating filter
    if (filterRating !== 'all') {
      filtered = filtered.filter((part) => {
        const rating = part.rating || 0
        if (filterRating === '0') {
          return rating === 0
        } else {
          return rating === parseInt(filterRating)
        }
      })
    }
    
    // Apply price filter
    if (filterPrice !== 'all') {
      filtered = filtered.filter((part) => {
        const price = part.price || 0
        switch (filterPrice) {
          case 'lt50k':
            return price < 50000
          case '50k-100k':
            return price >= 50000 && price <= 100000
          case '100k-500k':
            return price >= 100000 && price <= 500000
          case 'gt500k':
            return price > 500000
          default:
            return true
        }
      })
    }
    
    
    let sorted = [...filtered]
    
    // Apply sorting
    if (sortBy) {
      sorted = sorted.sort((a, b) => {
        let aVal, bVal
        switch (sortBy) {
          case 'name':
            aVal = a.name || ''
            bVal = b.name || ''
            break
          case 'partNumber':
            aVal = a.partNumber || ''
            bVal = b.partNumber || ''
            break
          case 'supplier':
            aVal = a.supplier || ''
            bVal = b.supplier || ''
            break
          case 'price':
            aVal = a.price || 0
            bVal = b.price || 0
            break
          default:
            return 0
        }
        
        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    } else {
      // Default sort by ID desc
      sorted = sorted.sort((a, b) => Number(b.id) - Number(a.id))
    }
    
    return sorted
  }

  // Calculate stats based on current filtered results
  const filteredParts = buildOrderedAllParts()
  const totalParts = filteredParts.length
  const activeParts = filteredParts.filter(part => part.isActive).length
  const inactiveParts = filteredParts.filter(part => !part.isActive).length
  const totalValue = filteredParts.reduce((sum, part) => sum + part.price, 0)

  useEffect(() => {
    const fetchAllParts = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data } = await api.get('/Part', { params: { pageNumber: 1, pageSize } })
        const firstPage = data as {
          success: boolean
          message: string
          data: {
            parts: Array<{
              partId: number
              partNumber: string
              partName: string
              brand: string
              price: number
              imageUrl: string | null
              isActive: boolean
              createdAt: string
            }>
            pageNumber: number
            pageSize: number
            totalPages: number
            totalCount: number
            hasPreviousPage: boolean
            hasNextPage: boolean
          }
        }

        const totalPages = firstPage.data.totalPages
        const requests = [] as Promise<any>[]
        for (let p = 2; p <= totalPages; p++) {
          requests.push(api.get('/Part', { params: { pageNumber: p, pageSize } }))
        }
        const restPages = await Promise.all(requests)
        const restParts = restPages.flatMap((res) => (res.data?.data?.parts || []))

        const combined = [...firstPage.data.parts, ...restParts]
          .sort((a, b) => a.partId - b.partId)
          .map(mapApiPartToUi)

        setAllParts(combined)
        setTotalCount(combined.length)
      } catch (e: any) {
        setError(e?.message || 'Không thể tải danh sách phụ tùng')
      } finally {
        setLoading(false)
      }
    }
    fetchAllParts()
  }, [pageSize])

  // derive current page slice from globally sorted full list
  useEffect(() => {
    const ordered = buildOrderedAllParts()
    const start = (pageNumber - 1) * pageSize
    const end = start + pageSize
    setPartsData(ordered.slice(start, end))
    // Update totalCount and totalPages for pagination based on filtered results
    setTotalCount(ordered.length)
    setTotalPages(Math.max(1, Math.ceil(ordered.length / pageSize)))
  }, [allParts, pageNumber, pageSize, searchTerm, filterStatus, filterRating, filterPrice, sortBy, sortOrder])

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage)
  }

  // Get unique suppliers for filter dropdown
  const getUniqueSuppliers = () => {
    const suppliers = allParts
      .map(part => part.supplier)
      .filter(supplier => supplier && supplier.trim() !== '')
      .filter((supplier, index, self) => self.indexOf(supplier) === index)
      .sort()
    return suppliers
  }

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' }
  ]

  const ratingOptions = [
    { value: 'all', label: 'Tất cả đánh giá' },
    { value: '5', label: '5 sao' },
    { value: '4', label: '4 sao' },
    { value: '3', label: '3 sao' },
    { value: '2', label: '2 sao' },
    { value: '1', label: '1 sao' },
    { value: '0', label: 'Chưa đánh giá' }
  ]

  const priceOptions = [
    { value: 'all', label: 'Tất cả giá' },
    { value: 'lt50k', label: 'Dưới 50k' },
    { value: '50k-100k', label: '50k - 100k' },
    { value: '100k-500k', label: '100k - 500k' },
    { value: 'gt500k', label: 'Trên 500k' }
  ]

  // Headless dropdown states (toolbar + pagination)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [openRatingMenu, setOpenRatingMenu] = useState(false)
  const [openPriceMenu, setOpenPriceMenu] = useState(false)
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const ratingRef = useRef<HTMLDivElement | null>(null)
  const priceRef = useRef<HTMLDivElement | null>(null)
  const pageSizeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setOpenStatusMenu(false)
      }
      if (ratingRef.current && !ratingRef.current.contains(e.target as Node)) {
        setOpenRatingMenu(false)
      }
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) {
        setOpenPriceMenu(false)
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setOpenPageSizeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div style={{
      padding: '16px',
      background: '#fff',
      minHeight: '100vh'
    }}>
      {/* Toolbar giống Users */}
      <div className="users-toolbar" style={{marginBottom: 16}}>
        <div className="toolbar-top">
          <div className="toolbar-left">
            <button type="button" className="toolbar-chip">Bảng</button>
            <button type="button" className="toolbar-chip is-active">Bảng điều khiển</button>
            <button type="button" className="toolbar-chip">Danh sách</button>
            <div className="toolbar-sep"/>
          </div>
          <div className="toolbar-right" style={{flex:1}}>
            <div className="toolbar-search">
              <div className="search-wrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon"><path d="m21 21-4.34-4.34"></path><circle cx="11" cy="11" r="8"></circle></svg>
                <input placeholder="Tìm kiếm phụ tùng" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="toolbar-chip">Ẩn</button>
              <button type="button" className="toolbar-chip">Tùy chỉnh</button>
              <button type="button" className="toolbar-btn" onClick={()=>{ /* xuất dữ liệu tạm thời chưa triển khai */ }}>Xuất</button>
            </div>
          </div>
        </div>
        <div className="toolbar-filters">
          {/* Trạng thái */}
          <div className="pill-select" ref={statusRef}>
            <button type="button" className="pill-trigger" onClick={()=>{ setOpenStatusMenu(!openStatusMenu); setOpenPriceMenu(false); }}>
              {statusOptions.find(o=>o.value===filterStatus)?.label || 'Tất cả trạng thái'}
            </button>
            <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <ul className={`pill-menu ${openStatusMenu ? 'show' : ''}`}>
              {statusOptions.map(opt => (
                <li key={opt.value} className={`pill-item ${filterStatus===opt.value ? 'active' : ''}`} onClick={()=>{ setFilterStatus(opt.value); setPageNumber(1); setOpenStatusMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Đánh giá */}
          <div className="pill-select" ref={ratingRef}>
            <button type="button" className="pill-trigger" onClick={()=>{ setOpenRatingMenu(!openRatingMenu); setOpenStatusMenu(false); setOpenPriceMenu(false); }}>
              {ratingOptions.find(o=>o.value===filterRating)?.label || 'Tất cả đánh giá'}
            </button>
            <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <ul className={`pill-menu ${openRatingMenu ? 'show' : ''}`}>
              {ratingOptions.map(opt => (
                <li key={opt.value} className={`pill-item ${filterRating===opt.value ? 'active' : ''}`} onClick={()=>{ setFilterRating(opt.value); setPageNumber(1); setOpenRatingMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Giá */}
          <div className="pill-select" ref={priceRef}>
            <button type="button" className="pill-trigger" onClick={()=>{ setOpenPriceMenu(!openPriceMenu); setOpenStatusMenu(false); setOpenRatingMenu(false); }}>
              {priceOptions.find(o=>o.value===filterPrice)?.label || 'Tất cả giá'}
            </button>
            <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <ul className={`pill-menu ${openPriceMenu ? 'show' : ''}`}>
              {priceOptions.map(opt => (
                <li key={opt.value} className={`pill-item ${filterPrice===opt.value ? 'active' : ''}`} onClick={()=>{ setFilterPrice(opt.value); setPageNumber(1); setOpenPriceMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          <button type="button" className="toolbar-chip">Thêm bộ lọc</button>
          <div className="toolbar-actions" style={{marginLeft:'auto'}}>
            <button type="button" className="toolbar-adduser accent-button" onClick={()=>setIsModalOpen(true)}>
              <Plus size={16}/> Thêm phụ tùng
            </button>
          </div>
        </div>
      </div>

      {/* Parts List - Bảng chuẩn Users */}
      <div className="parts-table-wrapper">
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--border-primary)',
              borderTop: '3px solid var(--primary-500)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ margin: 0, fontSize: '16px' }}>Đang tải phụ tùng...</p>
          </div>
        ) : error ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--error-500)' 
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'var(--error-50)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              ⚠️
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{error}</p>
          </div>
        ) : partsData.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px', 
            color: 'var(--text-secondary)' 
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'var(--bg-secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--text-tertiary)'
            }}>
              <Package size={32} />
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              {searchTerm ? 'Không tìm thấy phụ tùng nào' : 'Chưa có phụ tùng nào'}
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Thêm phụ tùng mới để bắt đầu'}
            </p>
          </div>
        ) : (
          <table className="parts-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input type="checkbox" className="table-checkbox" />
                </th>
                <th>Mã SP</th>
                <th>Tên sản phẩm</th>
                <th>Nhà cung cấp</th>
                <th>Giá</th>
                <th>Đánh giá</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {partsData.map((part, i) => (
                <tr key={part.id}>
                  <td className="checkbox-cell">
                    <input type="checkbox" className="table-checkbox" />
                  </td>
                  <td className="cell-part-number">{part.partNumber}</td>
                  <td className="cell-name">{part.name}</td>
                  <td className="cell-supplier">{part.supplier}</td>
                  <td className="cell-price">{formatPrice(part.price)}</td>
                  <td className="cell-rating">—</td>
                  <td className="cell-status">
                    <div className={`status-badge ${part.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                      <div className="dot"></div>
                      {part.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </div>
                  </td>
                  <td className="cell-actions">
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="action-btn action-btn--edit"
                        onClick={() => {
                          setEditingPart(part)
                          setIsModalOpen(true)
                        }}
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        type="button"
                        className="action-btn action-btn--delete"
                        onClick={() => setDeleteConfirm({ isOpen: true, partId: part.id })}
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>


      {/* Pagination - Chuẩn Users */}
      <div className="pagination-controls-bottom">
        <div className="pagination-info">
          <span className="pagination-label">Hàng mỗi trang</span>
          <div className="pill-select" ref={pageSizeRef}>
            <button type="button" className="pill-trigger" onClick={() => setOpenPageSizeMenu(!openPageSizeMenu)}>
              {pageSize}
            </button>
            <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <ul className={`pill-menu ${openPageSizeMenu ? 'show' : ''}`}>
              {[10, 20, 50, 100].map(size => (
                <li key={size} className={`pill-item ${pageSize === size ? 'active' : ''}`} onClick={() => { setPageSize(size); setPageNumber(1); setOpenPageSizeMenu(false); }}>
                  {size}
                </li>
              ))}
            </ul>
          </div>
          <span className="pagination-range">
            {((pageNumber - 1) * pageSize) + 1}–{Math.min(pageNumber * pageSize, totalCount)} của {totalCount} hàng
          </span>
        </div>
        <div className="pagination-right-controls">
          <div className="pager-pages">
            <button
              type="button"
              className={`pager-btn ${pageNumber === 1 ? 'is-disabled' : ''}`}
              disabled={pageNumber === 1}
              onClick={() => handlePageChange(1)}
              title="Đầu trang"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              type="button"
              className={`pager-btn ${pageNumber === 1 ? 'is-disabled' : ''}`}
              disabled={pageNumber === 1}
              onClick={() => handlePageChange(pageNumber - 1)}
              title="Trang trước"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="pager-ellipsis">1, 2, ..., {totalPages}</span>
            <button
              type="button"
              className={`pager-btn ${pageNumber === totalPages ? 'is-disabled' : ''}`}
              disabled={pageNumber === totalPages}
              onClick={() => handlePageChange(pageNumber + 1)}
              title="Trang sau"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              className={`pager-btn ${pageNumber === totalPages ? 'is-disabled' : ''}`}
              disabled={pageNumber === totalPages}
              onClick={() => handlePageChange(totalPages)}
              title="Cuối trang"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal for Add/Edit - Styled like the reference image */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            width: '90%',
            maxWidth: '460px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px 24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: 0
              }}>
                {editingPart ? 'Chỉnh sửa phụ tùng' : 'Thêm phụ tùng'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingPart(null)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              {/* Form create part */}
              {!editingPart && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      maxWidth: '500px',
                      margin: '0 auto',
                    }}
                  >
                    {/* Mã phụ tùng */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#374151',
                          marginBottom: '8px',
                        }}
                      >
                        Mã phụ tùng
                      </label>
                      <input
                        value={newPart.partNumber}
                        onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                        placeholder="Nhập mã phụ tùng"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                      />
                    </div>

                    {/* Tên phụ tùng */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#374151',
                          marginBottom: '8px',
                        }}
                      >
                        Tên phụ tùng
                      </label>
                      <input
                        value={newPart.partName}
                        onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                        placeholder="Nhập tên phụ tùng"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                      />
                    </div>

                    {/* Thương hiệu và Đơn giá - 2 cột */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                      }}
                    >
                      {/* Thương hiệu */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '8px',
                          }}
                        >
                          Thương hiệu
                        </label>
                        <input
                          value={newPart.brand}
                          onChange={(e) => setNewPart({ ...newPart, brand: e.target.value })}
                          placeholder="Nhập thương hiệu"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                          onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                        />
                      </div>

                      {/* Đơn giá */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '8px',
                          }}
                        >
                          Đơn giá
                        </label>
                        <input
                          type="number"
                          value={newPart.unitPrice}
                          onChange={(e) => setNewPart({ ...newPart, unitPrice: Number(e.target.value) })}
                          placeholder="Nhập đơn giá"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                          onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                        />
                      </div>
                    </div>

                    {/* Checkbox hoạt động */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '8px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={newPart.isActive}
                        onChange={(e) => setNewPart({ ...newPart, isActive: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '15px', color: '#111827' }}>Hoạt động</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form edit part */}
              {editingPart && (
                <div
                  style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: '24px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '20px',
                      maxWidth: '500px',
                      margin: '0 auto',
                    }}
                  >
                    {/* Tên phụ tùng */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#374151',
                          marginBottom: '8px',
                        }}
                      >
                        Tên phụ tùng
                      </label>
                      <input
                        value={editingPart.name}
                        onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })}
                        placeholder="Nhập tên phụ tùng"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                        onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                      />
                    </div>

                    {/* Thương hiệu và Đơn giá - 2 cột */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                      }}
                    >
                      {/* Thương hiệu */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '8px',
                          }}
                        >
                          Thương hiệu
                        </label>
                        <input
                          value={editingPart.supplier}
                          onChange={(e) => setEditingPart({ ...editingPart, supplier: e.target.value })}
                          placeholder="Nhập thương hiệu"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                          onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                        />
                      </div>

                      {/* Đơn giá */}
                      <div>
                        <label
                          style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#374151',
                            marginBottom: '8px',
                          }}
                        >
                          Đơn giá
                        </label>
                        <input
                          type="number"
                          value={editingPart.price}
                          onChange={(e) => setEditingPart({ ...editingPart, price: Number(e.target.value) })}
                          placeholder="Nhập đơn giá"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'border-color 0.2s ease',
                            boxSizing: 'border-box',
                          }}
                          onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
                          onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
                        />
                      </div>
                    </div>

                    {/* Checkbox hoạt động */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '8px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editingPart.isActive}
                        onChange={(e) => setEditingPart({ ...editingPart, isActive: e.target.checked })}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '15px', color: '#111827' }}>Hoạt động</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                marginTop: '32px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingPart(null)
                  }}
                  style={{
                    background: '#f8f9fa',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa'
                  }}
                >
                  Đóng
                </button>
                {!editingPart && (
                  <button
                    style={{
                      background: 'var(--primary-500)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-600)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary-500)'
                    }}
                    onClick={async () => {
                      try {
                        const payload = {
                          partNumber: newPart.partNumber,
                          partName: newPart.partName,
                          brand: newPart.brand,
                          unitPrice: newPart.unitPrice,
                          isActive: newPart.isActive
                        }
                        const res = await api.post('/Part', payload)
                        const created = res.data?.data || res.data
                        appendNewApiPartAtEnd(created)
                        setIsModalOpen(false)
                        setNewPart({ partNumber: '', partName: '', brand: '', unitPrice: 0, isActive: true })
                      } catch (e) {
                        setError('Tạo phụ tùng thất bại')
                      }
                    }}
                  >
                    Tạo mới
                  </button>
                )}
                {editingPart && (
                  <button
                    style={{
                      background: 'var(--primary-500)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-600)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--primary-500)'
                    }}
                    onClick={async () => {
                      try {
                        const payload = {
                          partName: editingPart.name,
                          brand: editingPart.supplier,
                          unitPrice: editingPart.price,
                          imageUrl: '', // API yêu cầu nhưng không dùng
                          isActive: editingPart.isActive
                        }
                        const res = await api.put(`/Part/${editingPart.id}`, payload)

                        // Cập nhật lại danh sách
                        setAllParts((prev) => {
                          const updated = prev.map(p =>
                            p.id === editingPart.id
                              ? { ...p, name: editingPart.name, supplier: editingPart.supplier, price: editingPart.price, isActive: editingPart.isActive }
                              : p
                          )
                          return updated
                        })

                        setIsModalOpen(false)
                        setEditingPart(null)
                      } catch (e) {
                        setError('Cập nhật phụ tùng thất bại')
                      }
                    }}
                  >
                    Cập nhật
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation - Consistent with main modal style */}
      {deleteConfirm.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '0',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              padding: '24px 24px 20px 24px',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626'
              }}>
                <Activity size={20} />
              </div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1a1a1a',
                margin: 0
              }}>
                Xác nhận xóa phụ tùng
              </h3>
            </div>

            {/* Content */}
            <div style={{ padding: '24px' }}>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '0 0 24px 0',
                lineHeight: '1.5'
              }}>
                Bạn có chắc chắn muốn xóa phụ tùng này không? Hành động này sẽ xóa vĩnh viễn dữ liệu và không thể hoàn tác.
              </p>

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setDeleteConfirm({ isOpen: false, partId: null })}
                  style={{
                    background: '#f8f9fa',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8f9fa'
                  }}
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={() => {
                    setPartsData(prev => prev.filter(part => part.id !== deleteConfirm.partId))
                    setDeleteConfirm({ isOpen: false, partId: null })
                  }}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#b91c1c'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#dc2626'
                  }}
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
