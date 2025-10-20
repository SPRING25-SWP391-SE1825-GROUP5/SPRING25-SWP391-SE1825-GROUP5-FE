import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import {
  Users,
  Package,
  FileText,
  Settings,
  TrendingUp,
  Calendar,
  DollarSign,
  Activity,
  ChevronRight,
  BarChart3,
  UserCheck,
  Wrench,
  Bell,
  Search,
  Menu,
  LogOut,
  Globe,
  Edit,
  X,
  Plus,
  CheckCircle,
  Shield,
  Mail,
  Smartphone,
  Eye,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  Key,
  Server,
  Palette,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  Car,
  Download
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import './admin.scss'
import UsersComponent from './Users'
import ServicesManagement from '../../components/manager/ServicesManagement'
import ServicesManagementAdmin from '../../components/admin/ServicesManagementAdmin'
import CenterManagement from '../../components/admin/CenterManagement'
import StaffManagement from '../../components/admin/StaffManagement'
import { useAppSelector } from '@/store/hooks'

// Parts Management Component
function PartsManagementContent() {
  const [partsData, setPartsData] = useState<any[]>([])
  const [allParts, setAllParts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [newPart, setNewPart] = useState({
    partNumber: '',
    partName: '',
    brand: '',
    unitPrice: 0,
    isActive: true
  })

  const mapApiPartToUi = (p: any) => ({
    id: String(p.partId),
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
    status: '',
    supplier: ''
  })

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

  const filteredParts = partsData.filter(part => {
    const matchesSearch = !filters.search ||
      part.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      part.id.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = !filters.status || part.status === filters.status
    const matchesSupplier = !filters.supplier || part.supplier === filters.supplier

    return matchesSearch && matchesStatus && matchesSupplier
  })

  const totalParts = partsData.length
  const totalValue = partsData.reduce((sum, part) => sum + (part.price * part.stock), 0)
  const lowStockParts = partsData.filter(part => part.stock < 15).length
  const outOfStockParts = partsData.filter(part => part.stock === 0).length


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
    const start = (pageNumber - 1) * pageSize
    const end = start + pageSize
    setPartsData(allParts.slice(start, end))
  }, [allParts, pageNumber, pageSize])

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
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-500)',
              color: 'var(--text-inverse)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              <Package size={18} />
            </div>
            Quản lý phụ tùng
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý kho phụ tùng và linh kiện xe điện
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-50)'
              e.currentTarget.style.borderColor = 'var(--primary-300)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          >
            <FileText size={16} />
            Xuất Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'var(--primary-500)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-600)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary-500)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ fontSize: '16px' }}>+</div>
            Thêm phụ tùng
          </button>
        </div>
      </div>



      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {[
          {
            title: 'Tổng sản phẩm',
            value: totalParts,
            icon: Package,
            color: 'var(--primary-500)',
            bgColor: 'var(--primary-50)'
          },
          {
            title: 'Tổng giá trị kho',
            value: formatPrice(totalValue),
            icon: DollarSign,
            color: 'var(--success-500)',
            bgColor: 'var(--success-50)'
          },
          {
            title: 'Sắp hết hàng',
            value: lowStockParts,
            icon: TrendingUp,
            color: 'var(--warning-500)',
            bgColor: 'var(--warning-50)'
          },
          {
            title: 'Hết hàng',
            value: outOfStockParts,
            icon: Activity,
            color: 'var(--error-500)',
            bgColor: 'var(--error-50)'
          },

        ].map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-primary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color
              }}>
                <stat.icon size={20} />
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: stat.color
              }}>
                {stat.value}
              </div>
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '6px'
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
                placeholder="Tìm theo tên, mã sản phẩm..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-primary)'
                }}
              />
            </div>
          </div>

          {['status', 'supplier'].map((filterType) => (
            <div key={filterType}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                {filterType === 'status' ? 'Trạng thái' : 'Nhà cung cấp'}
              </label>
              <select
                value={filters[filterType]}
                onChange={(e) => setFilters({ ...filters, [filterType]: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tất cả</option>
                {filterType === 'status' && ['Còn hàng', 'Sắp hết', 'Hết hàng'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
                {filterType === 'supplier' && ['Samsung SDI', 'Delta Electronics', 'Bosch', 'Shimano'].map(supplier => (
                  <option key={supplier} value={supplier}>{supplier}</option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <button
              onClick={() => setFilters({ search: '', status: '', supplier: '' })}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-50)'
                e.currentTarget.style.borderColor = 'var(--primary-300)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
              }}
            >
              <div style={{ fontSize: '16px' }}>🔄</div>
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden'
      }}>
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                background: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Mã SP</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Tên sản phẩm</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Nhà cung cấp</th>

                <th style={{
                  padding: '16px 24px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Giá</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Đánh giá</th>

                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Trạng thái</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map(part => (
                <tr key={part.id} style={{
                  borderBottom: '1px solid var(--border-primary)',
                  transition: 'background-color 0.2s ease'
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-50)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {part.id}
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '14px',
                    color: 'var(--text-primary)'
                  }}>
                    {part.name}
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}>
                    {part.supplier}
                  </td>

                  <td style={{
                    padding: '16px 24px',
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {formatPrice(part.price)}
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--text-secondary)'
                  }}>
                    {'—'}
                  </td>

                  <td style={{
                    padding: '16px 24px',
                    textAlign: 'center'
                  }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: getStatusColor(part.isActive ?? part.status),
                      background: getStatusBg(part.isActive ?? part.status)
                    }}>
                      {typeof part.isActive === 'boolean' ? (part.isActive ? 'Hoạt động' : 'Không hoạt động') : part.status}
                    </span>
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          setEditingPart(part)
                          setIsModalOpen(true)
                        }}
                        style={{
                          background: 'var(--primary-500)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--primary-600)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--primary-500)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <Settings size={12} />
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, partId: part.id })}
                        style={{
                          background: 'var(--error-500)',
                          color: 'var(--text-inverse)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--error-600)'
                          e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--error-500)'
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        <div style={{ fontSize: '12px' }}>🗑️</div>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - move to bottom of page */}
      <div style={{
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Hiển thị <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {((pageNumber - 1) * pageSize) + 1}-{Math.min(pageNumber * pageSize, totalCount)}
          </span> trong tổng số <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{totalCount}</span> phụ tùng
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber === 1}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              background: pageNumber === 1 ? 'var(--bg-tertiary)' : 'var(--primary-500)',
              color: pageNumber === 1 ? 'var(--text-secondary)' : 'var(--text-inverse)',
              cursor: pageNumber === 1 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >Trước</button>
          <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
            Trang {pageNumber} / {Math.max(1, Math.ceil(totalCount / pageSize))}
          </div>
          <button
            onClick={() => setPageNumber(Math.min(Math.ceil(totalCount / pageSize), pageNumber + 1))}
            disabled={pageNumber >= Math.ceil(totalCount / pageSize)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-primary)',
              background: pageNumber >= Math.ceil(totalCount / pageSize) ? 'var(--bg-tertiary)' : 'var(--primary-500)',
              color: pageNumber >= Math.ceil(totalCount / pageSize) ? 'var(--text-secondary)' : 'var(--text-inverse)',
              cursor: pageNumber >= Math.ceil(totalCount / pageSize) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >Sau</button>
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
              {/* Avatar Section */}

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

// System Settings Component
function SystemSettingsContent() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      siteName: 'SAVART Electric Bike',
      siteDescription: 'Hệ thống quản lý xe điện và bảo trì',
      contactEmail: 'admin@savart.com',
      contactPhone: '0123456789',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      timezone: 'Asia/Ho_Chi_Minh',
      language: 'vi'
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionTimeout: 30,
      twoFactorEnabled: false,
      loginAttempts: 5,
      lockoutDuration: 15
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      maintenanceAlerts: true,
      lowStockAlerts: true,
      appointmentReminders: true
    },
    system: {
      maintenanceMode: false,
      debugMode: false,
      cacheEnabled: true,
      backupFrequency: 'daily',
      logLevel: 'info',
      maxFileSize: 10
    },
    appearance: {
      theme: 'light',
      primaryColor: '#004030',
      secondaryColor: '#4A9782',
      showAnimations: true,
      compactMode: false
    }
  })

  const [saveStatus, setSaveStatus] = useState(null)

  const tabs = [
    { id: 'general', label: 'Tổng quan', icon: Globe },
    { id: 'security', label: 'Bảo mật', icon: Shield },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
    { id: 'system', label: 'Hệ thống', icon: Server },
    { id: 'appearance', label: 'Giao diện', icon: Palette }
  ]

  const handleSave = async (tabId) => {
    setSaveStatus('saving')

    setTimeout(() => {
      setSaveStatus('success')
      setTimeout(() => setSaveStatus(null), 3000)
    }, 1000)
  }

  const handleReset = (tabId) => {
    // Reset to default values logic here
    setSaveStatus('reset')
    setTimeout(() => setSaveStatus(null), 2000)
  }

  const renderGeneralSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Tên website
          </label>
          <input
            type="text"
            value={settings.general.siteName}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, siteName: e.target.value }
            }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Email liên hệ
          </label>
          <input
            type="email"
            value={settings.general.contactEmail}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, contactEmail: e.target.value }
            }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
          />
        </div>
      </div>

      <div>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          Mô tả website
        </label>
        <textarea
          value={settings.general.siteDescription}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            general: { ...prev.general, siteDescription: e.target.value }
          }))}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
          onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Múi giờ
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, timezone: e.target.value }
            }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="Asia/Ho_Chi_Minh">Việt Nam (GMT+7)</option>
            <option value="Asia/Bangkok">Bangkok (GMT+7)</option>
            <option value="Asia/Singapore">Singapore (GMT+8)</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Ngôn ngữ
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              general: { ...prev.general, language: e.target.value }
            }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              background: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
    </div>
  )

  const renderSecuritySettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <AlertTriangle size={20} style={{ color: '#d97706' }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#92400e', fontSize: '14px', fontWeight: '600' }}>
            Cảnh báo bảo mật
          </h4>
          <p style={{ margin: 0, color: '#92400e', fontSize: '13px' }}>
            Thay đổi cài đặt bảo mật có thể ảnh hưởng đến tất cả người dùng trong hệ thống.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Độ dài mật khẩu tối thiểu
          </label>
          <input
            type="number"
            min="6"
            max="20"
            value={settings.security.passwordMinLength}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, passwordMinLength: parseInt(e.target.value) }
            }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Thời gian timeout (phút)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={settings.security.sessionTimeout}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              security: { ...prev.security, sessionTimeout: parseInt(e.target.value) }
            }))}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { key: 'requireSpecialChars', label: 'Yêu cầu ký tự đặc biệt trong mật khẩu', icon: Key },
          { key: 'twoFactorEnabled', label: 'Bật xác thực hai yếu tố (2FA)', icon: Shield }
        ].map(({ key, label, icon: Icon }) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={18} style={{ color: '#6b7280' }} />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                {label}
              </span>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '24px'
            }}>
              <input
                type="checkbox"
                checked={settings.security[key]}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, [key]: e.target.checked }
                }))}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: settings.security[key] ? 'var(--primary-500)' : '#ccc',
                transition: '0.4s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.security[key] ? '26px' : '3px',
                  bottom: '3px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

  const renderNotificationSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        background: '#dbeafe',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Info size={20} style={{ color: '#2563eb' }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>
            Cài đặt thông báo
          </h4>
          <p style={{ margin: 0, color: '#1e40af', fontSize: '13px' }}>
            Cấu hình các loại thông báo sẽ được gửi đến người dùng và quản trị viên.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { key: 'emailNotifications', label: 'Thông báo qua Email', desc: 'Gửi thông báo quan trọng qua email', icon: Mail },
          { key: 'smsNotifications', label: 'Thông báo qua SMS', desc: 'Gửi thông báo khẩn cấp qua tin nhắn', icon: Smartphone },
          { key: 'pushNotifications', label: 'Thông báo đẩy', desc: 'Hiển thị thông báo trên trình duyệt', icon: Bell },
          { key: 'maintenanceAlerts', label: 'Cảnh báo bảo trì', desc: 'Thông báo khi đến hạn bảo trì xe', icon: Wrench },
          { key: 'lowStockAlerts', label: 'Cảnh báo tồn kho thấp', desc: 'Thông báo khi phụ tùng sắp hết', icon: Package },
          { key: 'appointmentReminders', label: 'Nhắc hẹn lịch', desc: 'Nhắc nhở khách hàng về lịch hẹn', icon: Calendar }
        ].map(({ key, label, desc, icon: Icon }) => (
          <div key={key} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: settings.notifications[key] ? 'var(--primary-50)' : '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: settings.notifications[key] ? 'var(--primary-500)' : '#6b7280'
              }}>
                <Icon size={20} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  {label}
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                  {desc}
                </p>
              </div>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '50px',
              height: '24px'
            }}>
              <input
                type="checkbox"
                checked={settings.notifications[key]}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked }
                }))}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: settings.notifications[key] ? 'var(--primary-500)' : '#ccc',
                transition: '0.4s',
                borderRadius: '24px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '18px',
                  width: '18px',
                  left: settings.notifications[key] ? '26px' : '3px',
                  bottom: '3px',
                  background: 'white',
                  transition: '0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )

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
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-500)',
              color: 'var(--text-inverse)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              <Settings size={18} />
            </div>
            Cài đặt hệ thống
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý cấu hình và tùy chỉnh hệ thống
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          {saveStatus && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              background: saveStatus === 'success' ? '#dcfce7' :
                saveStatus === 'saving' ? '#fef3c7' : '#fee2e2',
              color: saveStatus === 'success' ? '#166534' :
                saveStatus === 'saving' ? '#92400e' : '#991b1b'
            }}>
              {saveStatus === 'saving' && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {saveStatus === 'success' && <CheckCircle size={14} />}
              {saveStatus === 'success' ? 'Đã lưu thành công' :
                saveStatus === 'saving' ? 'Đang lưu...' : 'Đã đặt lại'}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-primary)',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 20px',
                border: 'none',
                background: activeTab === tab.id ? 'var(--primary-50)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary-500)' : 'var(--text-secondary)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-500)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'var(--bg-tertiary)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '32px' }}>
          {activeTab === 'general' && renderGeneralSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
          {activeTab === 'system' && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Server size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3>Cài đặt hệ thống</h3>
              <p>Nội dung sẽ được phát triển...</p>
            </div>
          )}
          {activeTab === 'appearance' && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              <Palette size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3>Cài đặt giao diện</h3>
              <p>Nội dung sẽ được phát triển...</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 32px',
          background: 'var(--bg-tertiary)',
          borderTop: '1px solid var(--border-primary)'
        }}>
          <button
            onClick={() => handleReset(activeTab)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)'
              e.currentTarget.style.borderColor = 'var(--text-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          >
            <RefreshCw size={14} />
            Đặt lại
          </button>

          <button
            onClick={() => handleSave(activeTab)}
            disabled={saveStatus === 'saving'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--primary-500)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
              opacity: saveStatus === 'saving' ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (saveStatus !== 'saving') {
                e.currentTarget.style.background = 'var(--primary-600)'
              }
            }}
            onMouseLeave={(e) => {
              if (saveStatus !== 'saving') {
                e.currentTarget.style.background = 'var(--primary-500)'
              }
            }}
          >
            <Save size={14} />
            {saveStatus === 'saving' ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Booking Management Component
function BookingManagementContent() {
  const [bookingsData, setBookingsData] = useState([
    {
      id: 'BK001',
      customerName: 'Nguyễn Văn An',
      customerPhone: '0123456789',
      customerEmail: 'nguyenvanan@email.com',
      bikeBrand: 'VinFast Klara S',
      bikeModel: '2023',
      licensePlate: '59-H1 12345',
      serviceType: 'Bảo trì định kỳ',
      bookingDate: '2024-01-20',
      bookingTime: '09:00',
      status: 'Đã xác nhận',
      technician: 'Trần Văn B',
      estimatedDuration: '2 giờ',
      notes: 'Kiểm tra hệ thống phanh và thay dầu',
      createdAt: '2024-01-15',
      priority: 'Bình thường'
    },
    {
      id: 'BK002',
      customerName: 'Lê Thị Hoa',
      customerPhone: '0987654321',
      customerEmail: 'lethihoa@email.com',
      bikeBrand: 'Yamaha Janus',
      bikeModel: '2022',
      licensePlate: '59-B2 67890',
      serviceType: 'Sửa chữa khẩn cấp',
      bookingDate: '2024-01-18',
      bookingTime: '14:30',
      status: 'Đang xử lý',
      technician: 'Phạm Văn C',
      estimatedDuration: '3 giờ',
      notes: 'Xe không khởi động được, cần kiểm tra hệ thống điện',
      createdAt: '2024-01-16',
      priority: 'Cao'
    },
    {
      id: 'BK003',
      customerName: 'Trần Minh Đức',
      customerPhone: '0369258147',
      customerEmail: 'tranminhduc@email.com',
      bikeBrand: 'Honda Vision',
      bikeModel: '2024',
      licensePlate: '59-C3 11111',
      serviceType: 'Thay thế phụ tùng',
      bookingDate: '2024-01-22',
      bookingTime: '10:15',
      status: 'Chờ xác nhận',
      technician: null,
      estimatedDuration: '1.5 giờ',
      notes: 'Thay lốp trước và kiểm tra áp suất',
      createdAt: '2024-01-17',
      priority: 'Bình thường'
    },
    {
      id: 'BK004',
      customerName: 'Phạm Thị Mai',
      customerPhone: '0147258369',
      customerEmail: 'phamthimai@email.com',
      bikeBrand: 'Piaggio Vespa',
      bikeModel: '2023',
      licensePlate: '59-D4 22222',
      serviceType: 'Bảo trì định kỳ',
      bookingDate: '2024-01-19',
      bookingTime: '16:00',
      status: 'Hoàn thành',
      technician: 'Lê Văn D',
      estimatedDuration: '2 giờ',
      notes: 'Bảo trì 5000km, thay dầu và lọc gió',
      createdAt: '2024-01-14',
      priority: 'Bình thường'
    },
    {
      id: 'BK005',
      customerName: 'Võ Minh Tuấn',
      customerPhone: '0258147369',
      customerEmail: 'vominhtuan@email.com',
      bikeBrand: 'SYM Attila',
      bikeModel: '2022',
      licensePlate: '59-E5 33333',
      serviceType: 'Kiểm tra tổng quát',
      bookingDate: '2024-01-25',
      bookingTime: '08:30',
      status: 'Đã hủy',
      technician: null,
      estimatedDuration: '1 giờ',
      notes: 'Khách hàng hủy do bận việc đột xuất',
      createdAt: '2024-01-18',
      priority: 'Thấp'
    }
  ])

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    serviceType: '',
    priority: '',
    dateFrom: '',
    dateTo: ''
  })

  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã xác nhận': return '#10b981'
      case 'Đang xử lý': return '#f59e0b'
      case 'Hoàn thành': return '#6366f1'
      case 'Chờ xác nhận': return '#8b5cf6'
      case 'Đã hủy': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'Đã xác nhận': return '#dcfce7'
      case 'Đang xử lý': return '#fef3c7'
      case 'Hoàn thành': return '#e0e7ff'
      case 'Chờ xác nhận': return '#f3e8ff'
      case 'Đã hủy': return '#fee2e2'
      default: return '#f3f4f6'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Cao': return '#ef4444'
      case 'Bình thường': return '#10b981'
      case 'Thấp': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'Cao': return AlertCircle
      case 'Bình thường': return CheckCircle2
      case 'Thấp': return Clock
      default: return Clock
    }
  }

  const filteredBookings = bookingsData.filter(booking => {
    const matchesSearch = !filters.search ||
      booking.customerName.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.id.toLowerCase().includes(filters.search.toLowerCase()) ||
      booking.licensePlate.toLowerCase().includes(filters.search.toLowerCase())

    const matchesStatus = !filters.status || booking.status === filters.status
    const matchesServiceType = !filters.serviceType || booking.serviceType === filters.serviceType
    const matchesPriority = !filters.priority || booking.priority === filters.priority

    return matchesSearch && matchesStatus && matchesServiceType && matchesPriority
  })

  // Statistics
  const totalBookings = bookingsData.length
  const confirmedBookings = bookingsData.filter(b => b.status === 'Đã xác nhận').length
  const processingBookings = bookingsData.filter(b => b.status === 'Đang xử lý').length
  const completedBookings = bookingsData.filter(b => b.status === 'Hoàn thành').length
  const pendingBookings = bookingsData.filter(b => b.status === 'Chờ xác nhận').length

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking)
    setIsDetailModalOpen(true)
  }

  const handleStatusChange = (bookingId, newStatus) => {
    setBookingsData(prev =>
      prev.map(booking =>
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      )
    )
  }

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
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)'
      }}>
        <div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-500)',
              color: 'var(--text-inverse)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              <Calendar size={18} />
            </div>
            Quản lý booking
          </h2>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý lịch đặt bảo trì và sửa chữa xe điện
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-50)'
              e.currentTarget.style.borderColor = 'var(--primary-300)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)'
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          >
            <Download size={16} />
            Xuất báo cáo
          </button>
          <button
            style={{
              background: 'var(--primary-500)',
              color: 'var(--text-inverse)',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-600)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary-500)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Plus size={16} />
            Tạo booking mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {[
          {
            title: 'Tổng booking',
            value: totalBookings,
            icon: Calendar,
            color: 'var(--primary-500)',
            bgColor: 'var(--primary-50)'
          },
          {
            title: 'Chờ xác nhận',
            value: pendingBookings,
            icon: Clock,
            color: '#8b5cf6',
            bgColor: '#f3e8ff'
          },
          {
            title: 'Đã xác nhận',
            value: confirmedBookings,
            icon: CheckCircle2,
            color: 'var(--success-500)',
            bgColor: 'var(--success-50)'
          },
          {
            title: 'Đang xử lý',
            value: processingBookings,
            icon: Wrench,
            color: 'var(--warning-500)',
            bgColor: 'var(--warning-50)'
          },
          {
            title: 'Hoàn thành',
            value: completedBookings,
            icon: CheckCircle,
            color: '#6366f1',
            bgColor: '#e0e7ff'
          }
        ].map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-primary)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: stat.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: stat.color
              }}>
                <stat.icon size={20} />
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: stat.color
              }}>
                {stat.value}
              </div>
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: '500'
            }}>
              {stat.title}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-secondary)',
              marginBottom: '6px'
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
                placeholder="Tên khách hàng, mã booking..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-primary)'
                }}
              />
            </div>
          </div>

          {['status', 'serviceType', 'priority'].map((filterType) => (
            <div key={filterType}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}>
                {filterType === 'status' ? 'Trạng thái' :
                  filterType === 'serviceType' ? 'Loại dịch vụ' : 'Độ ưu tiên'}
              </label>
              <select
                value={filters[filterType]}
                onChange={(e) => setFilters({ ...filters, [filterType]: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--bg-input)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                <option value="">Tất cả</option>
                {filterType === 'status' && ['Chờ xác nhận', 'Đã xác nhận', 'Đang xử lý', 'Hoàn thành', 'Đã hủy'].map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
                {filterType === 'serviceType' && ['Bảo trì định kỳ', 'Sửa chữa khẩn cấp', 'Thay thế phụ tùng', 'Kiểm tra tổng quát'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
                {filterType === 'priority' && ['Cao', 'Bình thường', 'Thấp'].map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          ))}

          <div>
            <button
              onClick={() => setFilters({ search: '', status: '', serviceType: '', priority: '', dateFrom: '', dateTo: '' })}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-50)'
                e.currentTarget.style.borderColor = 'var(--primary-300)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
              }}
            >
              <RefreshCw size={16} />
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden'
      }}>
        <div style={{
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                background: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Mã booking</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Khách hàng</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Xe</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Dịch vụ</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Ngày & Giờ</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Ưu tiên</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Trạng thái</th>
                <th style={{
                  padding: '16px 24px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-primary)'
                }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => {
                const PriorityIcon = getPriorityIcon(booking.priority)
                return (
                  <tr key={booking.id} style={{
                    borderBottom: '1px solid var(--border-primary)',
                    transition: 'background-color 0.2s ease'
                  }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--primary-50)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)'
                    }}>
                      {booking.id}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '14px',
                      color: 'var(--text-primary)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{booking.customerName}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {booking.customerPhone}
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                          {booking.bikeBrand}
                        </div>
                        <div>{booking.licensePlate}</div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)'
                    }}>
                      {booking.serviceType}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'center',
                      fontSize: '13px',
                      color: 'var(--text-primary)'
                    }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>{booking.bookingDate}</div>
                        <div style={{ color: 'var(--text-secondary)' }}>{booking.bookingTime}</div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        color: getPriorityColor(booking.priority)
                      }}>
                        <PriorityIcon size={14} />
                        {booking.priority}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: getStatusColor(booking.status),
                        background: getStatusBg(booking.status)
                      }}>
                        {booking.status}
                      </span>
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewDetails(booking)}
                          style={{
                            background: 'var(--primary-500)',
                            color: 'var(--text-inverse)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--primary-600)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--primary-500)'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          <Eye size={12} />
                          Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {isDetailModalOpen && selectedBooking && (
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
            maxWidth: '600px',
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
                Chi tiết booking #{selectedBooking.id}
              </h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedBooking(null)
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
              {/* Customer Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <User size={18} />
                  Thông tin khách hàng
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Tên khách hàng</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {selectedBooking.customerName}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Số điện thoại</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {selectedBooking.customerPhone}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Email</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {selectedBooking.customerEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Car size={18} />
                  Thông tin xe
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Hãng xe</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {selectedBooking.bikeBrand}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Mẫu xe</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {selectedBooking.bikeModel}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Biển số</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                      {selectedBooking.licensePlate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div style={{ marginBottom: '24px' }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  margin: '0 0 16px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Wrench size={18} />
                  Thông tin dịch vụ
                </h4>
                <div style={{
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Loại dịch vụ</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                        {selectedBooking.serviceType}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Ngày đặt</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                        {selectedBooking.bookingDate} - {selectedBooking.bookingTime}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Thời gian dự kiến</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                        {selectedBooking.estimatedDuration}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Kỹ thuật viên</span>
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>
                        {selectedBooking.technician || 'Chưa phân công'}
                      </span>
                    </div>
                  </div>
                  {selectedBooking.notes && (
                    <div>
                      <span style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>
                        Ghi chú
                      </span>
                      <p style={{
                        fontSize: '14px',
                        color: '#1a1a1a',
                        margin: 0,
                        padding: '12px',
                        background: 'white',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb'
                      }}>
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Actions */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#666', display: 'block' }}>Trạng thái hiện tại</span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: getStatusColor(selectedBooking.status),
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {selectedBooking.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedBooking.status === 'Chờ xác nhận' && (
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'Đã xác nhận')}
                      style={{
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Xác nhận
                    </button>
                  )}
                  {selectedBooking.status === 'Đã xác nhận' && (
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'Đang xử lý')}
                      style={{
                        background: '#f59e0b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Bắt đầu xử lý
                    </button>
                  )}
                  {selectedBooking.status === 'Đang xử lý' && (
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'Hoàn thành')}
                      style={{
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Hoàn thành
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default function AdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activePage, setActivePage] = useState('dashboard')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const role = useAppSelector(s => s.auth.user?.role)
  const isAdmin = (() => {
    const r = (role || '').toString().toLowerCase()
    // Robust: treat any role containing 'admin' as admin, but exclude manager
    if (!r) return false
    if (r.includes('manager')) return false
    return r.includes('admin')
  })()

  // Page components
  const renderPageContent = () => {
    switch (activePage) {
      case 'users':
        return <UsersComponent />
      case 'staff':
        return <StaffManagement />
      case 'parts':
        return <PartsManagementContent />
      case 'services':
        return isAdmin
          ? <ServicesManagementAdmin />
          : <ServicesManagement allowCreate={false} />
      case 'service-centers':
        return <CenterManagement />
      case 'settings':
        return <SystemSettingsContent />
      case 'bookings':
        return <BookingManagementContent />
      case 'reports':
        return (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>
              Báo cáo
            </h2>
            <div style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)'
            }}>
              <p style={{ color: 'var(--text-secondary)' }}>Nội dung báo cáo sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        )
      default:
        return renderDashboardContent()
    }
  }

  const renderDashboardContent = () => (
    <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          margin: '0 0 8px 0'
        }}>
          Dashboard
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Tổng quan hệ thống quản lý dịch vụ xe điện
        </p>
      </div>

      {/* Stats Grid */}
      <div
        className="admin-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
          width: '100%'
        }}
      >
        {stats.map((stat, index) => (
          <div
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: stat.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={24} />
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '20px',
                background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.change}
              </div>
            </div>
            <h3 style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              margin: '0 0 8px 0',
              fontWeight: '500'
            }}>
              {stat.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {stat.value}
              </span>
              <span style={{
                fontSize: '14px',
                color: 'var(--text-secondary)'
              }}>
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          margin: '0 0 24px 0'
        }}>
          Biểu đồ thống kê
        </h2>

        {/* Revenue Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Doanh thu theo tháng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis
                dataKey="month"
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  name === 'revenue' ? `${(value as number).toLocaleString('vi-VN')} VND` : value,
                  name === 'revenue' ? 'Doanh thu' : 'Đơn hàng'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary-500)"
                fill="var(--primary-50)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Service Distribution Pie Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Phân bố dịch vụ
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value) => [`${value}%`, 'Tỷ lệ']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Growth Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Tăng trưởng khách hàng
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={customerGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis
                  dataKey="month"
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend />
                <Bar dataKey="newCustomers" fill="var(--success-500)" name="Khách hàng mới" />
                <Bar dataKey="returningCustomers" fill="var(--primary-500)" name="Khách hàng cũ" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Parts Inventory Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Tình trạng tồn kho phụ tùng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partsInventoryData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis
                type="number"
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis
                dataKey="name"
                type="category"
                stroke="var(--text-secondary)"
                fontSize={12}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  `${value} sản phẩm`,
                  name === 'stock' ? 'Tồn kho' : 'Tồn kho tối thiểu'
                ]}
              />
              <Bar dataKey="stock" fill="var(--primary-500)" name="Tồn kho hiện tại" />
              <Bar dataKey="minStock" fill="var(--border-secondary)" name="Tồn kho tối thiểu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', width: '100%' }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Thao tác nhanh
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => setActivePage(action.page)}
                style={{
                  background: 'var(--bg-card)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: action.color,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <action.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {action.description}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Hoạt động gần đây
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {recentActivities.map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < recentActivities.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.type === 'order' ? 'var(--success-500)' :
                    activity.type === 'inventory' ? 'var(--info-500)' :
                      activity.type === 'maintenance' ? 'var(--warning-500)' : 'var(--primary-500)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0'
                  }}>
                    {activity.action}
                  </p>
                  <p style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {activity.description}
                  </p>
                </div>
                <span style={{
                  fontSize: '11px',
                  color: 'var(--text-tertiary)',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )

  // Chart data
  const revenueData = [
    { month: 'T1', revenue: 2400000, orders: 45 },
    { month: 'T2', revenue: 2800000, orders: 52 },
    { month: 'T3', revenue: 3200000, orders: 48 },
    { month: 'T4', revenue: 2900000, orders: 41 },
    { month: 'T5', revenue: 3500000, orders: 58 },
    { month: 'T6', revenue: 4200000, orders: 62 },
    { month: 'T7', revenue: 3800000, orders: 55 },
    { month: 'T8', revenue: 4500000, orders: 68 },
    { month: 'T9', revenue: 4100000, orders: 59 },
    { month: 'T10', revenue: 4800000, orders: 72 },
    { month: 'T11', revenue: 5200000, orders: 78 },
    { month: 'T12', revenue: 5800000, orders: 85 }
  ]

  const serviceData = [
    { name: 'Bảo trì', value: 45, color: 'var(--primary-500)' },
    { name: 'Sửa chữa', value: 30, color: 'var(--success-500)' },
    { name: 'Thay thế phụ tùng', value: 15, color: 'var(--warning-500)' },
    { name: 'Kiểm tra định kỳ', value: 10, color: 'var(--info-500)' }
  ]

  const customerGrowthData = [
    { month: 'T1', newCustomers: 12, returningCustomers: 8 },
    { month: 'T2', newCustomers: 15, returningCustomers: 12 },
    { month: 'T3', newCustomers: 18, returningCustomers: 15 },
    { month: 'T4', newCustomers: 14, returningCustomers: 18 },
    { month: 'T5', newCustomers: 22, returningCustomers: 20 },
    { month: 'T6', newCustomers: 25, returningCustomers: 24 },
    { month: 'T7', newCustomers: 20, returningCustomers: 22 },
    { month: 'T8', newCustomers: 28, returningCustomers: 26 },
    { month: 'T9', newCustomers: 24, returningCustomers: 28 },
    { month: 'T10', newCustomers: 30, returningCustomers: 32 },
    { month: 'T11', newCustomers: 32, returningCustomers: 35 },
    { month: 'T12', newCustomers: 35, returningCustomers: 38 }
  ]

  const partsInventoryData = [
    { name: 'Pin Lithium', stock: 45, minStock: 20, color: 'var(--success-500)' },
    { name: 'Bộ sạc', stock: 12, minStock: 15, color: 'var(--warning-500)' },
    { name: 'Động cơ', stock: 8, minStock: 10, color: 'var(--error-500)' },
    { name: 'Phanh đĩa', stock: 25, minStock: 15, color: 'var(--success-500)' },
    { name: 'Lốp xe', stock: 18, minStock: 20, color: 'var(--warning-500)' },
    { name: 'Đèn LED', stock: 35, minStock: 25, color: 'var(--success-500)' }
  ]


  const stats = [
    {
      title: 'Tổng doanh thu',
      value: '2,450,000,000',
      unit: 'VND',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đơn hàng mới',
      value: '156',
      unit: 'đơn',
      change: '+8.2%',
      changeType: 'positive',
      icon: Package,
      color: 'var(--success-500)'
    },
    {
      title: 'Khách hàng',
      value: '1,234',
      unit: 'người',
      change: '+5.1%',
      changeType: 'positive',
      icon: Users,
      color: 'var(--info-500)'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: '94.2',
      unit: '%',
      change: '+2.3%',
      changeType: 'positive',
      icon: Activity,
      color: 'var(--warning-500)'
    }
  ]

  const quickActions = [
    {
      title: 'Quản lý nhân sự',
      description: 'Thêm, sửa, xóa nhân viên',
      icon: UserCheck,
      page: 'staff',
      color: 'var(--primary-500)'
    },
    {
      title: 'Quản lý dịch vụ',
      description: 'Thêm, sửa, xóa dịch vụ',
      icon: Wrench,
      page: 'services',
      color: 'var(--success-500)'
    },
    {
      title: 'Quản lý phụ tùng',
      description: 'Kiểm tra tồn kho, nhập hàng',
      icon: Package,
      page: 'parts',
      color: 'var(--success-500)'
    },
    {
      title: 'Quản lý booking',
      description: 'Quản lý lịch đặt bảo trì xe điện',
      icon: Calendar,
      page: 'bookings',
      color: '#8b5cf6'
    },
    {
      title: 'Cài đặt hệ thống',
      description: 'Cấu hình và tùy chỉnh hệ thống',
      icon: Settings,
      page: 'settings',
      color: '#6366f1'
    },
    {
      title: 'Báo cáo',
      description: 'Xem báo cáo doanh thu, thống kê',
      icon: BarChart3,
      page: 'reports',
      color: 'var(--info-500)'
    },
    {
      title: 'Quản lý người dùng',
      description: 'Quản lý tài khoản khách hàng',
      icon: Users,
      page: 'users',
      color: 'var(--warning-500)'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      action: 'Đơn hàng mới',
      description: 'Đơn hàng #ORD-001 từ Nguyễn Văn A',
      time: '5 phút trước',
      type: 'order'
    },
    {
      id: 2,
      action: 'Nhập kho',
      description: 'Nhập 50 pin lithium 48V',
      time: '1 giờ trước',
      type: 'inventory'
    },
    {
      id: 3,
      action: 'Bảo trì hoàn thành',
      description: 'Xe Honda Lead đã hoàn thành bảo trì',
      time: '2 giờ trước',
      type: 'maintenance'
    },
    {
      id: 4,
      action: 'Khách hàng mới',
      description: 'Đăng ký tài khoản mới',
      time: '3 giờ trước',
      type: 'user'
    }
  ]

  return (
    <div className="admin-dashboard" style={{ display: 'flex', minHeight: '100vh', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Admin Header */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: sidebarCollapsed ? '80px' : '280px',
        right: 0,
        height: '64px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 1003,
        transition: 'left 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              color: 'var(--text-primary)'
            }}
            className="mobile-menu-btn"
          >
            <Menu size={20} />
          </button>
          <h1 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Admin Panel
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Bell size={20} style={{ color: 'var(--text-tertiary)' }} />
            <div style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '8px',
              height: '8px',
              background: 'var(--error-500)',
              borderRadius: '50%'
            }} />
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--primary-50)',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'var(--primary-500)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              A
            </div>
            <span style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--text-primary)'
            }}>
              Admin User
            </span>
            <LogOut size={16} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
        style={{
          width: sidebarCollapsed ? '80px' : '280px',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-primary)',
          transition: 'width 0.3s ease',
          position: 'fixed',
          height: '100vh',
          zIndex: 1004,
          top: 0
        }}
      >
        <div style={{ padding: '24px' }}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '32px',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'var(--primary-500)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              fontWeight: 'bold',
              marginRight: sidebarCollapsed ? '0' : '12px'
            }}>
              A
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: '0'
                }}>
                  Admin Panel
                </h1>
                <p style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  margin: '0'
                }}>
                  Quản trị hệ thống
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Tổng quan
              </h3>
              <div
                onClick={() => setActivePage('dashboard')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: activePage === 'dashboard' ? 'var(--primary-500)' : 'var(--text-secondary)',
                  background: activePage === 'dashboard' ? 'var(--primary-50)' : 'transparent',
                  fontWeight: '500',
                  marginBottom: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = 'var(--primary-50)'
                    e.currentTarget.style.color = 'var(--primary-500)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activePage !== 'dashboard') {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                <BarChart3 size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                {!sidebarCollapsed && 'Dashboard'}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                margin: '0 0 12px 0',
                display: sidebarCollapsed ? 'none' : 'block'
              }}>
                Quản lý
              </h3>
              {[
                { icon: Users, label: 'Người dùng', page: 'users', route: '/admin/users' },
                { icon: Wrench, label: 'Dịch vụ', page: 'services', route: '/admin/services' },
                { icon: UserCheck, label: 'Nhân sự', page: 'staff', route: '/admin/staff-management' },
                { icon: Package, label: 'Phụ tùng', page: 'parts', route: '/admin/parts-management' },
                { icon: Globe, label: 'Trung tâm', page: 'service-centers', route: '/admin/service-centers' },
                { icon: Calendar, label: 'Booking', page: 'bookings', route: '/admin/bookings' },
                { icon: Settings, label: 'Cài đặt', page: 'settings', route: '/admin/settings' },
                { icon: FileText, label: 'Báo cáo', page: 'reports', route: '/admin/reports' }
              ].map((item, index) => (
                <div
                  key={index}
                  onClick={() => setActivePage(item.page)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: activePage === item.page ? 'var(--primary-500)' : 'var(--text-secondary)',
                    background: activePage === item.page ? 'var(--primary-50)' : 'transparent',
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onMouseEnter={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = 'var(--primary-50)'
                      e.currentTarget.style.color = 'var(--primary-500)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activePage !== item.page) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }
                  }}
                >
                  <item.icon size={20} style={{ marginRight: sidebarCollapsed ? '0' : '12px' }} />
                  {!sidebarCollapsed && item.label}
                </div>
              ))}
            </div>
          </nav>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'absolute',
            top: '24px',
            right: '-12px',
            width: '24px',
            height: '24px',
            background: 'var(--primary-500)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px'
          }}
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Main Content */}
      <div
        className="admin-main-content"
        style={{
          marginLeft: sidebarCollapsed ? '80px' : '280px',
          padding: '32px',
          paddingTop: '96px', // Add space for header
          background: 'var(--bg-secondary)',
          minHeight: '100vh',
          transition: 'margin-left 0.3s ease',
          width: sidebarCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 280px)',
          maxWidth: 'none'
        }}
      >
        {renderPageContent()}
      </div>
    </div>
  )
}