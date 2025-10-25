import { useState, useEffect } from 'react'
import { 
  Wrench,
  ClipboardList,
  DollarSign,
  CheckCircle,
  Search,
  Plus,
  Eye,
  Edit,
  X,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  Circle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw
} from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import { ServiceManagementService, type Service, type ServiceStats } from '../../services/serviceManagementService'

export default function ServicesManagement({ allowCreate = true }: { allowCreate?: boolean }) {
  // User info for permissions
  const { user } = useAppSelector((s) => s.auth)
  const role = (user?.role || '').toLowerCase()
  const isAdmin = role === 'admin'
  const canCreate = allowCreate && isAdmin
  
  // State Management
  const [apiServices, setApiServices] = useState<Service[]>([])
  const [apiServiceStats, setApiServiceStats] = useState<ServiceStats | null>(null)
  const [serviceCategories, setServiceCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Service filters/pagination
  const [servicePage, setServicePage] = useState(1)
  const [servicePageSize, setServicePageSize] = useState(10)
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceStatus, setServiceStatus] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalPages, setTotalPages] = useState(1)
  
  // Service detail modal
  const [serviceDetailOpen, setServiceDetailOpen] = useState(false)
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false)
  const [serviceDetailError, setServiceDetailError] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  
  // Service form modal
  const [serviceFormOpen, setServiceFormOpen] = useState(false)
  const [serviceFormSubmitting, setServiceFormSubmitting] = useState(false)
  const [serviceFormError, setServiceFormError] = useState<string | null>(null)
  const [serviceFormMode, setServiceFormMode] = useState<'create' | 'update'>('create')
  const [serviceFormValues, setServiceFormValues] = useState<{ 
    id?: number; 
    name: string; 
    description: string; 
    price: number; 
    notes: string;
    isActive: boolean 
  }>({ 
    name: '', 
    description: '', 
    price: 0, 
    notes: '',
    isActive: true 
  })

  // Fetch data functions
  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all services first (without pagination)
      const params: any = { 
        pageNumber: 1, 
        pageSize: 1000, // Get all services
        search: serviceSearch
      }
      
      // Get all services (both active and inactive)
      const response = await ServiceManagementService.getServices(params)
      let allServices = response.services || []

      // Apply status filter
      if (serviceStatus !== 'all') {
        const isActive = serviceStatus === 'active'
        allServices = allServices.filter(service => service.isActive === isActive)
      }

      // Apply sorting to all services
      if (allServices.length > 0) {
        allServices = allServices.sort((a, b) => {
          let aValue: any, bValue: any;
          switch (sortBy) {
            case 'name':
              aValue = a.name?.toLowerCase() || '';
              bValue = b.name?.toLowerCase() || '';
              break;
            case 'price':
              aValue = a.price || 0;
              bValue = b.price || 0;
              break;
            case 'createAt':
              aValue = new Date(a.createAt).getTime();
              bValue = new Date(b.createAt).getTime();
              break;
            default:
              aValue = a.name?.toLowerCase() || '';
              bValue = b.name?.toLowerCase() || '';
          }
          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      }

      // Calculate total pages
      const calculatedTotalPages = Math.ceil(allServices.length / servicePageSize);
      setTotalPages(calculatedTotalPages);
      
      // Apply pagination to sorted results
      const startIndex = (servicePage - 1) * servicePageSize;
      const endIndex = startIndex + servicePageSize;
      const paginatedServices = allServices.slice(startIndex, endIndex);
      
      setApiServices(paginatedServices)
    } catch (err: any) {
      setError('Không thể tải danh sách dịch vụ: ' + (err.message || 'Unknown error'))
      console.error('Lỗi khi tải dịch vụ:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchServiceStats = async () => {
    try {
      const stats = await ServiceManagementService.getServiceStats()
      setApiServiceStats(stats)
    } catch (err) {
      console.error('Lỗi khi tải thống kê dịch vụ:', err)
    }
  }


  const fetchServiceCategories = async () => {
    try {
      const categories = await ServiceManagementService.getServiceCategories()
      setServiceCategories(categories)
    } catch (err) {
      console.error('Lỗi khi tải danh mục dịch vụ:', err)
    }
  }

  const openServiceDetail = async (id: number) => {
    try {
      setServiceDetailLoading(true)
      setServiceDetailError(null)
      setServiceDetailOpen(true)
      const detail = await ServiceManagementService.getServiceById(id)
      setSelectedService(detail)
    } catch (err: any) {
      console.error('Lỗi khi tải chi tiết dịch vụ:', err)
      setServiceDetailError('Không thể tải chi tiết dịch vụ: ' + (err.message || 'Unknown error'))
    } finally {
      setServiceDetailLoading(false)
    }
  }

  const openCreateService = () => {
    if (!canCreate) return
    setServiceFormMode('create')
    setServiceFormValues({ name: '', description: '', notes: '', price: 0, isActive: true })
    setServiceFormError(null)
    setServiceFormOpen(true)
  }

  const openEditService = (s: Service) => {
    setServiceFormMode('update')
    setServiceFormValues({ 
      id: s.id, 
      name: s.name, 
      description: s.description, 
      price: s.price, 
      notes: s.notes || '',
      isActive: s.isActive 
    })
    setServiceFormError(null)
    setServiceFormOpen(true)
  }

  const submitServiceForm = async () => {
    try {
      setServiceFormSubmitting(true)
      setServiceFormError(null)
      
      // Validation
      if (!serviceFormValues.name.trim()) {
        setServiceFormError('Tên dịch vụ là bắt buộc')
        return
      }
      if (serviceFormValues.price < 0) {
        setServiceFormError('Giá phải lớn hơn hoặc bằng 0')
        return
      }

      console.log('Submitting form:', {
        mode: serviceFormMode,
        values: serviceFormValues
      })

      if (serviceFormMode === 'create') {
        await ServiceManagementService.createService({
          name: serviceFormValues.name,
          description: serviceFormValues.description,
          price: serviceFormValues.price,
          notes: serviceFormValues.notes,
          isActive: serviceFormValues.isActive
        })
      } else {
        if (!serviceFormValues.id) {
          setServiceFormError('ID dịch vụ không hợp lệ')
          return
        }
        await ServiceManagementService.updateService(serviceFormValues.id, {
          name: serviceFormValues.name,
          description: serviceFormValues.description,
          price: serviceFormValues.price,
          notes: serviceFormValues.notes,
          isActive: serviceFormValues.isActive
        })
      }
      
      setServiceFormOpen(false)
      await fetchServices() // Refresh the list
    } catch (err: any) {
      console.error('Lỗi khi gửi form dịch vụ:', err)
      setServiceFormError(`Không thể lưu dịch vụ: ${err.message || 'Unknown error'}`)
    } finally {
      setServiceFormSubmitting(false)
    }
  }

  const handleToggleServiceStatus = async (id: number) => {
    try {
      await ServiceManagementService.updateServiceStatus(id)
      await fetchServices()
      if (selectedService && selectedService.id === id) {
        const updated = await ServiceManagementService.getServiceById(id)
        setSelectedService(updated)
      }
    } catch (err: any) {
      console.error('Lỗi khi chuyển trạng thái dịch vụ:', err)
      alert(`Không thể cập nhật trạng thái dịch vụ: ${err.message || 'Unknown error'}`)
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setServicePage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ChevronUp size={14} style={{ opacity: 0.3 }} />;
    }
    return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Không hoạt động" },
  ];

  // Load data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchServices(),
          fetchServiceStats()
        ])
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dịch vụ:', err)
        setError('Không thể tải dữ liệu dịch vụ')
      }
    }
    
    loadData()
  }, [servicePage, servicePageSize, serviceSearch, serviceStatus, sortBy, sortOrder])

  // Service stats for display
  const serviceStatsArray = apiServiceStats ? [
    {
      title: 'Tổng số dịch vụ',
      value: apiServiceStats.totalServices.toString(),
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: Wrench,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đang hoạt động',
      value: apiServiceStats.activeServices.toString(),
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: Circle,
      color: 'var(--success-500)'
    },
    {
      title: 'Ngưng hoạt động',
      value: apiServiceStats.inactiveServices.toString(),
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: AlertCircle,
      color: 'var(--error-500)'
    }
  ] : []

  return (
    <div style={{ 
      padding: '24px', 
      background: 'var(--bg-secondary)', 
      minHeight: '100vh',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.9) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
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
            Quản lý Dịch vụ
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi các dịch vụ xe điện
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => {
            fetchServices();
            fetchServiceStats();
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
        
        {canCreate && (
          <button onClick={openCreateService} style={{
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
            Thêm dịch vụ
          </button>
        )}
        </div>
      </div>

      {/* Filters */}
      
      
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {apiServiceStats ? serviceStatsArray.map((stat, index) => (
          <div key={index} style={{
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
                <stat.icon size={20} />
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Đang tải thống kê dịch vụ...
          </div>
        )}
      </div>

      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
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
              placeholder="Tìm kiếm dịch vụ..."
              value={serviceSearch}
              onChange={(e) => { setServicePage(1); setServiceSearch(e.target.value) }}
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
              value={serviceStatus}
              onChange={(e) => { setServicePage(1); setServiceStatus(e.target.value) }}
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
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <button 
              onClick={() => {
                setServicePage(1)
                setServiceSearch('')
                setServiceStatus('all')
                setSortBy('name')
                setSortOrder('asc')
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                border: '2px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-500)'
                e.currentTarget.style.background = 'var(--primary-50)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.background = 'var(--bg-secondary)'
              }}
            >
              <RotateCcw size={16} />
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>
      
        {/* Services List */}
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
              Danh sách Dịch vụ
            </h3>
            <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <button
              disabled={servicePage === 1}
              onClick={() => setServicePage((p) => p - 1)}
              style={{ 
                padding: "6px 10px", 
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                background: servicePage === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                color: servicePage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: servicePage === 1 ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (servicePage !== 1) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (servicePage !== 1) {
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
              {servicePage} / {totalPages}
            </span>
            <button
              disabled={servicePage === totalPages}
              onClick={() => setServicePage((p) => p + 1)}
              style={{ 
                padding: "6px 10px", 
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                background: servicePage === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                color: servicePage === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                cursor: servicePage === totalPages ? "not-allowed" : "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (servicePage !== totalPages) {
                  e.currentTarget.style.background = "var(--primary-50)"
                  e.currentTarget.style.borderColor = "var(--primary-500)"
                }
              }}
              onMouseLeave={(e) => {
                if (servicePage !== totalPages) {
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
                <p style={{ margin: 0, fontSize: '16px' }}>Đang tải dịch vụ...</p>
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
            ) : apiServices.length === 0 ? (
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
                  <Wrench size={32} />
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                  Không tìm thấy dịch vụ nào
                </h4>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  Thử thay đổi bộ lọc hoặc tạo dịch vụ mới
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
                      Tên dịch vụ
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
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Mô tả
                  </th>
                  <th 
                    onClick={() => handleSort('price')}
                    style={{
                      padding: '16px 20px',
                      textAlign: 'right',
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
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
                    Trạng thái
                  </th>
                  <th 
                    onClick={() => handleSort('createAt')}
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
                      Ngày tạo
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: sortBy === 'createAt' ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {getSortIcon('createAt')}
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
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {apiServices.map((service, index) => (
                  <tr 
                    key={service.id}
                    style={{
                      borderBottom: index < apiServices.length - 1 ? '1px solid var(--border-primary)' : 'none',
                      transition: 'all 0.3s ease',
                      background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)',
                      transform: 'translateY(0)',
                      boxShadow: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-50)'
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                          width: '32px',
                          height: '32px',
                    background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                          <Wrench size={16} />
                  </div>
                      {service.name}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      maxWidth: '300px'
                    }}>
                      <div style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4'
                    }}>
                      {service.description}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                        fontWeight: '600',
                      color: 'var(--success-600)',
                      textAlign: 'right'
                      }}>
                        {(service.price || 0).toLocaleString()} VNĐ
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
                      background: service.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: service.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '12px',
                      fontWeight: '600',
                      border: `1px solid ${service.isActive ? 'var(--success-200)' : 'var(--error-200)'}`,
                      whiteSpace: 'nowrap'
                    }}>
                        {service.isActive ? (
                          <>
                            <CheckCircle size={12} fill="currentColor" />
                            Hoạt động
                          </>
                        ) : (
                          <>
                            <X size={12} fill="currentColor" />
                            Ngừng hoạt động
                          </>
                        )}
                    </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center'
                    }}>
                      {new Date(service.createAt).toLocaleDateString('vi-VN')}
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
                      onClick={async (e) => { e.stopPropagation(); openServiceDetail(service.id) }}
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
                        e.currentTarget.style.borderColor = 'var(--primary-500)'
                        e.currentTarget.style.background = 'var(--primary-50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.background = 'var(--bg-card)'
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                        
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditService(service) }}
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
                        e.currentTarget.style.borderColor = 'var(--primary-500)'
                        e.currentTarget.style.background = 'var(--primary-50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.background = 'var(--bg-card)'
                      }}
                      title="Sửa dịch vụ"
                    >
                      <Edit size={16} />
                    </button>
                        
                    <button
                      onClick={async (e) => { e.stopPropagation(); handleToggleServiceStatus(service.id) }}
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
                        e.currentTarget.style.borderColor = service.isActive ? 'var(--error-500)' : 'var(--success-500)'
                        e.currentTarget.style.background = service.isActive ? 'var(--error-50)' : 'var(--success-50)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                        e.currentTarget.style.background = 'var(--bg-card)'
                      }}
                          title={service.isActive ? 'Vô hiệu hóa dịch vụ' : 'Kích hoạt dịch vụ'}
                    >
                          {service.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
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
              disabled={servicePage === 1}
            onClick={() => setServicePage(1)}
              style={{
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: servicePage === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: servicePage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: servicePage === 1 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (servicePage !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (servicePage !== 1) {
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
            disabled={servicePage === 1}
            onClick={() => setServicePage((p) => p - 1)}
              style={{
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: servicePage === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: servicePage === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: servicePage === 1 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (servicePage !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (servicePage !== 1) {
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
              let startPage = Math.max(1, servicePage - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // First page + ellipsis
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setServicePage(1)}
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
                    onClick={() => setServicePage(i)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: i === servicePage ? "1px solid var(--primary-500)" : "1px solid var(--border-primary)",
                      background: i === servicePage ? "var(--primary-50)" : "var(--bg-card)",
                      color: i === servicePage ? "var(--primary-700)" : "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: i === servicePage ? "600" : "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (i !== servicePage) {
                        e.currentTarget.style.background = "var(--primary-50)"
                        e.currentTarget.style.borderColor = "var(--primary-500)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (i !== servicePage) {
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
                    onClick={() => setServicePage(totalPages)}
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
            disabled={servicePage === totalPages}
            onClick={() => setServicePage((p) => p + 1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: servicePage === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: servicePage === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: servicePage === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (servicePage !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (servicePage !== totalPages) {
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
            disabled={servicePage === totalPages}
            onClick={() => setServicePage(totalPages)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: servicePage === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: servicePage === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: servicePage === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (servicePage !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (servicePage !== totalPages) {
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

      {/* Service Form Modal */}
      {serviceFormOpen && (
        <div style={{ 
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.6)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            color: 'var(--text-primary)', 
            borderRadius: '20px',
            border: '1px solid var(--border-primary)', 
            width: '600px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '32px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            animation: 'modalSlideIn 0.3s ease-out'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '2px solid var(--border-primary)'
            }}>
              <div>
                <h3 style={{ 
                  margin: '0 0 4px 0', 
                  fontSize: '24px', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  {serviceFormMode === 'create' ? 'Tạo Dịch vụ Mới' : 'Cập nhật Dịch vụ'}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)' 
                }}>
                  {serviceFormMode === 'create' 
                    ? 'Thêm dịch vụ mới vào hệ thống' 
                    : 'Cập nhật thông tin dịch vụ'
                  }
                </p>
              </div>
              <button
                onClick={() => setServiceFormOpen(false)}
                style={{ 
                  border: 'none', 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '12px',
                  borderRadius: '12px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.color = 'var(--error-600)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {serviceFormError && (
              <div style={{ 
                marginBottom: '16px', 
                color: 'var(--error-600)', 
                fontSize: '14px',
                padding: '12px',
                background: 'var(--error-50)',
                borderRadius: '8px',
                border: '1px solid var(--error-200)'
              }}>
                {serviceFormError}
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Tên dịch vụ *
                </label>
                <input
                  value={serviceFormValues.name}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, name: e.target.value }))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px' 
                  }}
                  placeholder="Nhập tên dịch vụ"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Mô tả
                </label>
                <textarea
                  value={serviceFormValues.description}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, description: e.target.value }))}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    resize: 'vertical' 
                  }}
                  placeholder="Nhập mô tả dịch vụ"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Ghi chú
                </label>
                <textarea
                  value={serviceFormValues.notes}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, notes: e.target.value }))}
                  rows={2}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    resize: 'vertical' 
                  }}
                  placeholder="Nhập ghi chú (nếu có)"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '500' }}>
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  value={serviceFormValues.price}
                  onChange={(e) => setServiceFormValues(v => ({ ...v, price: Number(e.target.value) }))}
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid var(--border-primary)', 
                    borderRadius: '8px', 
                    background: 'var(--bg-card)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px' 
                  }}
                  min={0}
                  step={1000}
                  placeholder="Nhập giá dịch vụ"
                />
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '14px' }}>
                <input 
                  type="checkbox" 
                  checked={serviceFormValues.isActive} 
                  onChange={(e) => setServiceFormValues(v => ({ ...v, isActive: e.target.checked }))} 
                />
                Dịch vụ đang hoạt động
              </label>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={() => setServiceFormOpen(false)}
                  style={{ 
                    border: '1px solid var(--border-primary)', 
                    background: 'transparent', 
                    color: 'var(--text-primary)', 
                    borderRadius: '8px', 
                    padding: '10px 20px', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: 500 
                  }}
                >
                  Hủy
                </button>
                <button
                  disabled={serviceFormSubmitting}
                  onClick={submitServiceForm}
                  style={{ 
                    border: 'none', 
                    background: 'var(--primary-500)', 
                    color: 'white', 
                    borderRadius: '8px', 
                    padding: '10px 20px', 
                    cursor: serviceFormSubmitting ? 'not-allowed' : 'pointer', 
                    fontSize: '14px', 
                    fontWeight: 600, 
                    opacity: serviceFormSubmitting ? 0.7 : 1 
                  }}
                >
                  {serviceFormSubmitting ? 'Đang lưu...' : (serviceFormMode === 'create' ? 'Tạo Dịch vụ' : 'Cập nhật Dịch vụ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {serviceDetailOpen && (
        <div style={{
          position: 'fixed', 
          inset: 0, 
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 2000
        }}>
          <div style={{
            background: 'var(--bg-card)', 
            color: 'var(--text-primary)', 
            borderRadius: '12px',
            border: '1px solid var(--border-primary)', 
            width: '600px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Chi tiết Dịch vụ</h3>
              <button
                onClick={() => { setServiceDetailOpen(false); setSelectedService(null); }}
                style={{
                  border: 'none', 
                  background: 'transparent', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            {serviceDetailLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải chi tiết dịch vụ...</div>
            ) : serviceDetailError ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error-500)' }}>{serviceDetailError}</div>
            ) : selectedService ? (
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Tên dịch vụ</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600' }}>{selectedService.name}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Giá</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '600', color: 'var(--success-600)' }}>
                      {(selectedService.price || 0).toLocaleString()} VNĐ
                    </p>
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Mô tả</label>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', lineHeight: '1.5' }}>{selectedService.description}</p>
                </div>

                {selectedService.notes && (
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Ghi chú</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', lineHeight: '1.5', fontStyle: 'italic' }}>{selectedService.notes}</p>
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Trạng thái</label>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: selectedService.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: selectedService.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '12px',
                      fontWeight: '600',
                      width: 'fit-content',
                      marginTop: '4px'
                    }}>
                      {selectedService.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>Ngày tạo</label>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
                      {new Date(selectedService.createAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button
                    onClick={async () => handleToggleServiceStatus(selectedService.id)}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid var(--border-primary)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    {selectedService.isActive ? 'Ngừng hoạt động' : 'Kích hoạt'} Dịch vụ
                  </button>
                  <button
                    onClick={() => openEditService(selectedService)}
                    style={{
                      padding: '10px 16px',
                      border: 'none',
                      background: 'var(--primary-500)',
                      color: 'white',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      flex: 1
                    }}
                  >
                    Sửa Dịch vụ
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Không có dữ liệu dịch vụ</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}