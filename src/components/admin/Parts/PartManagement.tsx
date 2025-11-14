import { useState, useEffect, useRef } from 'react'
import {
  Package,
  FileText,
  Settings,
  DollarSign,
  CheckCircle,
  Activity,
  Search,
  RefreshCw,
  Plus,
  X,
  Star,
  List,
  BarChart2,
  Eye,
  EyeOff,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  AlertCircle,
  Edit,
  Trash2,
  Hash,
  Building2
} from 'lucide-react'
import api from '@/services/api'
import './PartManagement.scss'
import PartsFormModal from './PartsFormModal'

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
    partId: p.partId,
    partNumber: p.partNumber,
    name: p.partName,
    category: p.brand,
    stock: 0,
    price: p.price,
    supplier: p.brand,
    status: p.isActive ? 'Còn hàng' : 'Hết hàng',
    isActive: p.isActive,
    lastUpdated: new Date(p.createdAt).toLocaleDateString('vi-VN'),
    rating: typeof p.rating === 'number' ? p.rating : null
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

  const buildOrderedAllParts = () => {
    const text = (s: string) => (s || '').toLowerCase()

    let filtered = !searchTerm
      ? allParts
      : allParts.filter((part) =>
          text(part.name).includes(text(searchTerm)) ||
          String(part.id).toLowerCase().includes(text(searchTerm)) ||
          String((part as any).partNumber || '').toLowerCase().includes(text(searchTerm))
        )

    if (filterStatus !== 'all') {
      filtered = filtered.filter((part) => {
        if (filterStatus === 'active') return part.isActive
        if (filterStatus === 'inactive') return !part.isActive
        return true
      })
    }

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
      sorted = sorted.sort((a, b) => Number(b.id) - Number(a.id))
    }

    return sorted
  }

  const filteredParts = buildOrderedAllParts()
  const totalParts = filteredParts.length
  const activeParts = filteredParts.filter(part => part.isActive).length
  const inactiveParts = filteredParts.filter(part => !part.isActive).length
  const totalValue = filteredParts.reduce((sum, part) => sum + part.price, 0)

  const loadParts = async () => {
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

  useEffect(() => {
    loadParts()
  }, [pageSize])

  useEffect(() => {
    const ordered = buildOrderedAllParts()
    const start = (pageNumber - 1) * pageSize
    const end = start + pageSize
    setPartsData(ordered.slice(start, end))
    setTotalCount(ordered.length)
    setTotalPages(Math.max(1, Math.ceil(ordered.length / pageSize)))
  }, [allParts, pageNumber, pageSize, searchTerm, filterStatus, filterRating, filterPrice, sortBy, sortOrder])

  const handlePageChange = (newPage: number) => {
    setPageNumber(newPage)
  }

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
            {/* removed view mode buttons */}
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
              {/* removed hide button */}
              <button type="button" className="toolbar-adduser accent-button" onClick={()=>setIsModalOpen(true)}>
                <Plus size={16}/> Thêm phụ tùng
              </button>
            </div>
          </div>
        </div>
        <div className="toolbar-filters">
          {/* Trạng thái */}
          <div className="filter-dropdown" ref={statusRef}>
            <button type="button" className="filter-btn" onClick={()=>{ setOpenStatusMenu(!openStatusMenu); setOpenPriceMenu(false); setOpenRatingMenu(false); }}>
              <CheckCircle size={14} />
              <span>{statusOptions.find(o=>o.value===filterStatus)?.label || 'Tất cả trạng thái'}</span>
              <svg className="filter-caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul className={`filter-menu ${openStatusMenu ? 'is-open' : ''}`}>
              {statusOptions.map(opt => (
                <li key={opt.value} className={`filter-item ${filterStatus===opt.value ? 'is-active' : ''}`} onClick={()=>{ setFilterStatus(opt.value); setPageNumber(1); setOpenStatusMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Đánh giá */}
          <div className="filter-dropdown" ref={ratingRef}>
            <button type="button" className="filter-btn" onClick={()=>{ setOpenRatingMenu(!openRatingMenu); setOpenStatusMenu(false); setOpenPriceMenu(false); }}>
              <Star size={14} />
              <span>{ratingOptions.find(o=>o.value===filterRating)?.label || 'Tất cả đánh giá'}</span>
              <svg className="filter-caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul className={`filter-menu ${openRatingMenu ? 'is-open' : ''}`}>
              {ratingOptions.map(opt => (
                <li key={opt.value} className={`filter-item ${filterRating===opt.value ? 'is-active' : ''}`} onClick={()=>{ setFilterRating(opt.value); setPageNumber(1); setOpenRatingMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Giá */}
          <div className="filter-dropdown" ref={priceRef}>
            <button type="button" className="filter-btn" onClick={()=>{ setOpenPriceMenu(!openPriceMenu); setOpenStatusMenu(false); setOpenRatingMenu(false); }}>
              <DollarSign size={14} />
              <span>{priceOptions.find(o=>o.value===filterPrice)?.label || 'Tất cả giá'}</span>
              <svg className="filter-caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul className={`filter-menu ${openPriceMenu ? 'is-open' : ''}`}>
              {priceOptions.map(opt => (
                <li key={opt.value} className={`filter-item ${filterPrice===opt.value ? 'is-active' : ''}`} onClick={()=>{ setFilterPrice(opt.value); setPageNumber(1); setOpenPriceMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          <button type="button" className="toolbar-chip"><Plus size={14}/> Thêm bộ lọc</button>
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
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" className="table-checkbox" style={{ margin: 0, marginRight: '4px' }} />
                    <Hash size={15} />
                    Mã SP
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={15} />
                    Tên sản phẩm
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 size={15} />
                    Nhà cung cấp
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={15} />
                    Giá
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Star size={15} />
                    Đánh giá
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} />
                    Trạng thái
                  </div>
                </th>
                <th>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Settings size={15} />
                    Thao tác
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {partsData.map((part, i) => (
                <tr key={part.id}>
                  <td className="cell-part-number">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <input type="checkbox" className="table-checkbox" style={{ margin: 0, marginRight: '4px' }} />
                      {part.partNumber}
                    </div>
                  </td>
                  <td className="cell-name">{part.name}</td>
                  <td className="cell-supplier">{part.supplier}</td>
                  <td className="cell-price">{formatPrice(part.price)}</td>
                  <td className="cell-rating">{typeof part.rating === 'number' ? part.rating.toFixed(1) : '—'}</td>
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
          <div className="page-size-select" ref={pageSizeRef}>
            <button type="button" className="page-size-btn" onClick={() => setOpenPageSizeMenu(!openPageSizeMenu)}>
              {pageSize}
              <svg className="page-size-caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul className={`page-size-menu ${openPageSizeMenu ? 'is-open' : ''}`}>
              {[10, 20, 50, 100].map(size => (
                <li key={size} className={`page-size-item ${pageSize === size ? 'is-active' : ''}`} onClick={() => { setPageSize(size); setPageNumber(1); setOpenPageSizeMenu(false); }}>
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
          <div className="pager-pages">
            <button
              type="button"
              className={`pager-btn ${pageNumber === 1 ? 'is-active' : ''}`}
              onClick={() => handlePageChange(1)}
            >
              1
            </button>
            <button
              type="button"
              className={`pager-btn ${pageNumber === 2 ? 'is-active' : ''}`}
              onClick={() => handlePageChange(2)}
            >
              2
            </button>
            <span className="pager-ellipsis">…</span>
            <button
              type="button"
              className={`pager-btn ${pageNumber === 5 ? 'is-active' : ''}`}
              onClick={() => handlePageChange(5)}
            >
              5
            </button>
          </div>
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

      {/* Modal for Add/Edit */}
      <PartsFormModal
        isOpen={isModalOpen}
        onClose={() => {
                  setIsModalOpen(false)
                  setEditingPart(null)
          setNewPart({ partNumber: '', partName: '', brand: '', unitPrice: 0, isActive: true })
        }}
        onSubmit={() => {
          loadParts()
        }}
        editingPart={editingPart}
                      />

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
