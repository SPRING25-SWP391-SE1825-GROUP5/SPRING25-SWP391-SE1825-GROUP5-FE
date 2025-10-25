import { useState, useEffect } from 'react'
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
  const [filterSupplier, setFilterSupplier] = useState('all')
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
    
    // Apply supplier filter
    if (filterSupplier !== 'all') {
      filtered = filtered.filter((part) => 
        text(part.supplier || '').includes(text(filterSupplier))
      )
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
  }, [allParts, pageNumber, pageSize, searchTerm, filterStatus, filterSupplier, sortBy, sortOrder])

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

  const supplierOptions = [
    { value: 'all', label: 'Tất cả nhà cung cấp' },
    ...getUniqueSuppliers().map(supplier => ({
      value: supplier,
      label: supplier
    }))
  ]

  return (
    <div style={{
      padding: '24px',
      background: 'var(--bg-secondary)',
      minHeight: '100vh',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Quản lý Phụ tùng
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi tất cả phụ tùng trong hệ thống
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => {
            // Refresh all parts data
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
          }} style={{
            padding: '12px 20px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-primary)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
            transform: 'translateY(0)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
            e.currentTarget.style.borderColor = 'var(--primary-500)'
            e.currentTarget.style.background = 'var(--primary-50)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.borderColor = 'var(--border-primary)'
            e.currentTarget.style.background = 'var(--bg-card)'
          }}>
            <RefreshCw size={18} />
            Làm mới
          </button>
          
          <button onClick={() => setIsModalOpen(true)} style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease',
          transform: 'translateY(0)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <Plus size={18} />
          Thêm phụ tùng
        </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {[
          {
            label: "Tổng phụ tùng",
            value: totalParts,
            color: "var(--primary-500)",
            icon: Package,
          },
          {
            label: "Hoạt động",
            value: activeParts,
            color: "var(--success-500)",
            icon: Circle,
          },
          {
            label: "Không hoạt động",
            value: inactiveParts,
            color: "var(--error-500)",
            icon: AlertCircle,
          },
          {
            label: "Tổng giá trị",
            value: formatPrice(totalValue),
            color: "var(--warning-500)",
            icon: DollarSign,
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <s.icon size={20} />
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  {s.label}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  {s.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <form onSubmit={(e) => e.preventDefault()} style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px',
            }}>
              Tìm kiếm
            </label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-tertiary)' 
              }} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '2px solid var(--border-primary)',
                  borderRadius: '10px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-primary)'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px' 
            }}>
              Trạng thái
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPageNumber(1);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-primary)',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px' 
            }}>
              Nhà cung cấp
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => {
                setFilterSupplier(e.target.value);
                setPageNumber(1);
              }}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid var(--border-primary)',
                borderRadius: '10px',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {supplierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <button
              onClick={() => { 
                setPageNumber(1)
                setSearchTerm('')
                setFilterStatus('all')
                setFilterSupplier('all')
                setSortBy('')
                setSortOrder('asc')
              }}
              style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <RefreshCw size={16} />
              Đặt lại
            </button>
          </div>
        </form>
      </div>

      {/* Parts List */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '32px',
        borderRadius: '20px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Danh sách Phụ tùng
          </h3>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              disabled={pageNumber === 1}
              onClick={() => handlePageChange(pageNumber - 1)}
              style={{ 
                padding: "6px 10px", 
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: pageNumber === 1 ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (pageNumber !== 1) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (pageNumber !== 1) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{
              padding: "6px 10px",
              background: "var(--primary-50)",
              borderRadius: "6px",
              color: "var(--primary-700)",
              fontSize: "12px",
              fontWeight: "600",
              minWidth: "60px",
              textAlign: "center"
            }}>
              {pageNumber} / {totalPages}
            </span>
            <button
              disabled={pageNumber === totalPages}
              onClick={() => handlePageChange(pageNumber + 1)}
              style={{ 
                padding: "6px 10px", 
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (pageNumber !== totalPages) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (pageNumber !== totalPages) {
                  e.currentTarget.style.background = "var(--bg-card)"
                  e.currentTarget.style.borderColor = "var(--border-primary)"
                }
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
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
          <div style={{ overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-card)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
              border: '1px solid var(--border-primary)'
            }}>
            <thead>
              <tr style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}>
                <th 
                  onClick={() => handleSort('partNumber')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Mã SP
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: sortBy === 'partNumber' ? 1 : 0.4,
                      transition: 'opacity 0.2s ease'
                    }}>
                      {getSortIcon('partNumber')}
                    </div>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Tên sản phẩm
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: sortBy === 'name' ? 1 : 0.4,
                      transition: 'opacity 0.2s ease'
                    }}>
                      {getSortIcon('name')}
                    </div>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('supplier')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Nhà cung cấp
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: sortBy === 'supplier' ? 1 : 0.4,
                      transition: 'opacity 0.2s ease'
                    }}>
                      {getSortIcon('supplier')}
                    </div>
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('price')}
                  style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    Giá
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      opacity: sortBy === 'price' ? 1 : 0.4,
                      transition: 'opacity 0.2s ease'
                    }}>
                      {getSortIcon('price')}
                    </div>
                  </div>
                </th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none'
                }}>
                  Đánh giá
                </th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none'
                }}>
                  Trạng thái
                </th>
                <th style={{
                  padding: '16px 20px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: 'none'
                }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {partsData.map((part, i) => (
                <tr 
                  key={part.id}
                  style={{
                    borderBottom: i < partsData.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    transition: 'all 0.3s ease',
                    background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                    transform: 'translateY(0)',
                    boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-50)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <td style={{
                    padding: '16px 20px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}>
                    {part.partNumber}
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontWeight: '500'
                  }}>
                    {part.name}
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}>
                    {part.supplier}
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {formatPrice(part.price)}
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--text-tertiary)'
                  }}>
                    —
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      background: part.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: part.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: `1px solid ${part.isActive ? 'var(--success-200)' : 'var(--error-200)'}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {part.isActive ? (
                        <>
                          <Circle size={12} fill="currentColor" />
                          Hoạt động
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} fill="currentColor" />
                          Không hoạt động
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{
                    padding: '16px 20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={() => {
                          setEditingPart(part)
                          setIsModalOpen(true)
                        }}
                        style={{
                          padding: '8px',
                          border: '2px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          width: '36px',
                          height: '36px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--primary-50)'
                          e.currentTarget.style.borderColor = 'var(--primary-500)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-card)'
                          e.currentTarget.style.borderColor = 'var(--border-primary)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, partId: part.id })}
                        style={{
                          padding: '8px',
                          border: '2px solid var(--border-primary)',
                          borderRadius: '8px',
                          background: 'var(--bg-card)',
                          color: 'var(--error-500)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          width: '36px',
                          height: '36px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--error-50)'
                          e.currentTarget.style.borderColor = 'var(--error-500)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-card)'
                          e.currentTarget.style.borderColor = 'var(--border-primary)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Trash2 size={16} />
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


      {/* Enhanced Pagination */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--bg-card)',
        padding: '20px 24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Pagination Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {/* First Page */}
          <button
            disabled={pageNumber === 1}
            onClick={() => handlePageChange(1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: pageNumber === 1 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (pageNumber !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (pageNumber !== 1) {
                e.currentTarget.style.background = "var(--bg-card)"
                e.currentTarget.style.borderColor = "var(--border-primary)"
              }
            }}
          >
            <ChevronsLeft size={16} />
            <span style={{ marginLeft: '4px' }}>Đầu</span>
          </button>

          {/* Previous Page */}
          <button
            disabled={pageNumber === 1}
            onClick={() => handlePageChange(pageNumber - 1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: pageNumber === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: pageNumber === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: pageNumber === 1 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (pageNumber !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (pageNumber !== 1) {
                e.currentTarget.style.background = "var(--bg-card)"
                e.currentTarget.style.borderColor = "var(--border-primary)"
              }
            }}
          >
            <ChevronLeft size={16} />
            <span style={{ marginLeft: '4px' }}>Trước</span>
          </button>

          {/* Page Numbers */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            margin: '0 8px'
          }}>
            {(() => {
              const pages = [];
              const maxVisible = 5;
              let startPage = Math.max(1, pageNumber - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // First page + ellipsis
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => handlePageChange(1)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-50)"
                      e.currentTarget.style.borderColor = "var(--primary-500)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-card)"
                      e.currentTarget.style.borderColor = "var(--border-primary)"
                    }}
                  >
                    1
                  </button>
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis1" style={{ padding: "8px 4px", color: "var(--text-tertiary)" }}>
                      ...
                    </span>
                  );
                }
              }

              // Visible pages
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: i === pageNumber ? "1px solid var(--primary-500)" : "1px solid var(--border-primary)",
                      background: i === pageNumber ? "var(--primary-50)" : "var(--bg-card)",
                      color: i === pageNumber ? "var(--primary-700)" : "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: i === pageNumber ? "600" : "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (i !== pageNumber) {
                        e.currentTarget.style.background = "var(--primary-50)"
                        e.currentTarget.style.borderColor = "var(--primary-500)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (i !== pageNumber) {
                        e.currentTarget.style.background = "var(--bg-card)"
                        e.currentTarget.style.borderColor = "var(--border-primary)"
                      }
                    }}
                  >
                    {i}
                  </button>
                );
              }

              // Last page + ellipsis
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis2" style={{ padding: "8px 4px", color: "var(--text-tertiary)" }}>
                      ...
                    </span>
                  );
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-primary)",
                      background: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--primary-50)"
                      e.currentTarget.style.borderColor = "var(--primary-500)"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--bg-card)"
                      e.currentTarget.style.borderColor = "var(--border-primary)"
                    }}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}
          </div>

          {/* Next Page */}
          <button
            disabled={pageNumber === totalPages}
            onClick={() => handlePageChange(pageNumber + 1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (pageNumber !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (pageNumber !== totalPages) {
                e.currentTarget.style.background = "var(--bg-card)"
                e.currentTarget.style.borderColor = "var(--border-primary)"
              }
            }}
          >
            <span style={{ marginRight: '4px' }}>Sau</span>
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            disabled={pageNumber === totalPages}
            onClick={() => handlePageChange(totalPages)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: pageNumber === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: pageNumber === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: pageNumber === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (pageNumber !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (pageNumber !== totalPages) {
                e.currentTarget.style.background = "var(--bg-card)"
                e.currentTarget.style.borderColor = "var(--border-primary)"
              }
            }}
          >
            <span style={{ marginRight: '4px' }}>Cuối</span>
            <ChevronsRight size={16} />
          </button>
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
                        console.error(e)
                        alert('Tạo phụ tùng thất bại')
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
                        console.error(e)
                        alert('Cập nhật phụ tùng thất bại')
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
