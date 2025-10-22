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
  X
} from 'lucide-react'
import { useAppSelector } from '@/store/hooks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { ServiceManagementService, type Service, type ServiceStats, type ServiceBooking, type ServicePerformance } from '../../services/serviceManagementService'

export default function ServicesManagement({ allowCreate = true }: { allowCreate?: boolean }) {
  // User info for permissions
  const { user } = useAppSelector((s) => s.auth)
  const role = (user?.role || '').toLowerCase()
  const isAdmin = role === 'admin'
  const canCreate = allowCreate && isAdmin
  
  // State Management
  const [apiServices, setApiServices] = useState<Service[]>([])
  const [apiServiceStats, setApiServiceStats] = useState<ServiceStats | null>(null)
  const [apiServicePerformance, setApiServicePerformance] = useState<ServicePerformance[]>([])
  const [apiRecentBookings, setApiRecentBookings] = useState<ServiceBooking[]>([])
  const [serviceCategories, setServiceCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Service filters/pagination
  const [servicePage, setServicePage] = useState(1)
  const [servicePageSize, setServicePageSize] = useState(10)
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
  const [serviceOnlyActive, setServiceOnlyActive] = useState(false)
  
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
      const params: any = { 
        pageNumber: servicePage, 
        pageSize: servicePageSize,
        search: serviceSearch
      }
      if (serviceCategory) params.category = serviceCategory
      
      const response = serviceOnlyActive
        ? await ServiceManagementService.getActiveServices(params)
        : await ServiceManagementService.getServices(params)
      setApiServices(response.services)
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

  const fetchServicePerformance = async () => {
    try {
      const performance = await ServiceManagementService.getServicePerformance()
      setApiServicePerformance(performance)
    } catch (err) {
      console.error('Lỗi khi tải hiệu suất dịch vụ:', err)
    }
  }

  const fetchRecentBookings = async () => {
    try {
      const bookings = await ServiceManagementService.getRecentBookings(10)
      setApiRecentBookings(bookings)
    } catch (err) {
      console.error('Lỗi khi tải đơn đặt gần đây:', err)
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

  // Load data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchServices(),
          fetchServiceStats(),
          fetchServicePerformance(),
          fetchRecentBookings(),
          fetchServiceCategories()
        ])
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dịch vụ:', err)
        setError('Không thể tải dữ liệu dịch vụ')
      }
    }
    
    loadData()
  }, [servicePage, servicePageSize, serviceSearch, serviceCategory, serviceOnlyActive])

  // Service stats for display
  const serviceStatsArray = apiServiceStats ? [
    {
      title: 'Tổng số dịch vụ',
      value: apiServiceStats.totalServices.toString(),
      unit: 'dịch vụ',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: Wrench,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đơn đặt dịch vụ',
      value: apiServiceStats.serviceBookings.toString(),
      unit: 'đơn đặt',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: ClipboardList,
      color: 'var(--success-500)'
    },
    {
      title: 'Doanh thu dịch vụ',
      value: (apiServiceStats.serviceRevenue / 1000000).toFixed(1),
      unit: 'triệu VNĐ',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: DollarSign,
      color: 'var(--info-500)'
    },
    {
      title: 'Tỷ lệ hoàn thành',
      value: apiServiceStats.completionRate.toFixed(1),
      unit: '%',
      change: apiServiceStats.change,
      changeType: apiServiceStats.changeType,
      icon: CheckCircle,
      color: 'var(--warning-500)'
    }
  ] : []

  return (
    <div>
      {/* Header Section */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: 0
        }}>
          Quản lý Dịch vụ
        </h2>
        
        {canCreate && (
          <button onClick={openCreateService} style={{
            padding: '12px 24px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0, 64, 48, 0.2)',
            transition: 'all 0.2s ease'
          }}>
            <Plus size={16} />
            Thêm dịch vụ
          </button>
        )}
      </div>

      {/* Filter Section */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        gap: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          {/* Search Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <label style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)' 
            }}>
              Tìm kiếm
            </label>
            <input
              placeholder="Tìm kiếm dịch vụ..."
              value={serviceSearch}
              onChange={(e) => { setServicePage(1); setServiceSearch(e.target.value) }}
              style={{
                padding: '12px 16px',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '100%',
                transition: 'border-color 0.2s ease'
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)' 
            }}>
              Danh mục
            </label>
            <select
              value={serviceCategory}
              onChange={(e) => { setServicePage(1); setServiceCategory(e.target.value) }}
              style={{
                padding: '12px 16px',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '100%',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease'
              }}
            >
              <option value="">Tất cả danh mục</option>
              {serviceCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Page Size */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--text-primary)' 
            }}>
              Hiển thị
            </label>
            <select
              value={servicePageSize}
              onChange={(e) => { setServicePage(1); setServicePageSize(Number(e.target.value)) }}
              style={{
                padding: '12px 16px',
                border: '2px solid var(--border-primary)',
                borderRadius: '8px',
                background: 'var(--bg-input)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                width: '100%',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease'
              }}
            >
              <option value={10}>10 mỗi trang</option>
              <option value={20}>20 mỗi trang</option>
              <option value={50}>50 mỗi trang</option>
            </select>
          </div>

          {/* Active Only Checkbox */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              color: 'var(--text-primary)', 
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '12px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '2px solid var(--border-primary)',
              transition: 'all 0.2s ease'
            }}>
              <input 
                type="checkbox" 
                checked={serviceOnlyActive} 
                onChange={(e) => { setServicePage(1); setServiceOnlyActive(e.target.checked) }}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer'
                }}
              />
              Chỉ hiện hoạt động
            </label>
          </div>

          {/* Refresh Button */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '8px',
            justifyContent: 'flex-end'
          }}>
            <button 
              onClick={fetchServices}
              style={{
                padding: '12px 20px',
                border: '2px solid var(--border-primary)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
            >
              <Search size={16} />
              Làm mới
            </button>
          </div>
        </div>
      </div>
      
      {/* Service Statistics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {apiServiceStats ? serviceStatsArray.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
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
        )) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            Đang tải thống kê dịch vụ...
          </div>
        )}
      </div>

      {/* Service Management Content */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Services List */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Danh sách Dịch vụ ({apiServices.length})
          </h3>
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Đang tải dịch vụ...
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error-500)' }}>
                {error}
              </div>
            ) : apiServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Không tìm thấy dịch vụ nào
              </div>
            ) : (
              apiServices.map((service, index) => (
                <div 
                  key={service.id}
                  style={{
                    padding: '16px',
                    borderBottom: index < apiServices.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary-50)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'var(--primary-500)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0
                  }}>
                    <Wrench size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {service.name}
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      margin: '0 0 4px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {service.description}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-secondary)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {new Date(service.createAt).toLocaleDateString()}
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        fontWeight: '600',
                        color: 'var(--success-600)'
                      }}>
                        {(service.price || 0).toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: service.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: service.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {service.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </div>
                    <button
                      onClick={async (e) => { e.stopPropagation(); openServiceDetail(service.id) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditService(service) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title="Sửa dịch vụ"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={async (e) => { e.stopPropagation(); handleToggleServiceStatus(service.id) }}
                      style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                      }}
                      title="Chuyển trạng thái"
                    >
                      <CheckCircle size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-primary)' }}>
            <button
              onClick={() => setServicePage(Math.max(1, servicePage - 1))}
              disabled={servicePage === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-primary)',
                background: 'transparent',
                color: servicePage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                borderRadius: '8px',
                cursor: servicePage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Trước
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Trang {servicePage}</span>
            <button
              onClick={() => setServicePage(servicePage + 1)}
              disabled={apiServices.length < servicePageSize}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-primary)',
                background: 'transparent',
                color: apiServices.length < servicePageSize ? 'var(--text-tertiary)' : 'var(--text-primary)',
                borderRadius: '8px',
                cursor: apiServices.length < servicePageSize ? 'not-allowed' : 'pointer'
              }}
            >
              Tiếp
            </button>
          </div>
        </div>

        {/* Service Performance */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Hiệu suất Dịch vụ
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={apiServicePerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="service" 
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
                formatter={(value, name) => [
                  name === 'revenue' ? `${Number(value || 0).toLocaleString()} VNĐ` : value,
                  name === 'revenue' ? 'Doanh thu' : 'Số đơn đặt'
                ]}
              />
              <Legend />
              <Bar dataKey="bookings" fill="var(--primary-500)" name="Số đơn đặt" />
              <Bar dataKey="revenue" fill="var(--success-500)" name="Doanh thu" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Service Bookings */}
      <div style={{
        background: 'var(--bg-card)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0'
          }}>
            Đơn đặt Dịch vụ Gần đây
          </h3>
          <button style={{
            padding: '8px 16px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: 'pointer'
          }}>
            Xem tất cả
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã đơn</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Dịch vụ</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Khách hàng</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Chi nhánh</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Giá</th>
              </tr>
            </thead>
            <tbody>
              {apiRecentBookings.length > 0 ? apiRecentBookings.map((booking, index) => (
                <tr key={booking.id} style={{ borderBottom: index < apiRecentBookings.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                  <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)' }}>#{booking.id}</td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.service}</td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.customer}</td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', color: 'var(--text-primary)' }}>{booking.branch}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: 
                        booking.status === 'completed' ? 'var(--success-50)' :
                        booking.status === 'in_progress' ? 'var(--warning-50)' :
                        'var(--primary-50)',
                      color: 
                        booking.status === 'completed' ? 'var(--success-700)' :
                        booking.status === 'in_progress' ? 'var(--warning-700)' :
                        'var(--primary-700)'
                    }}>
                      {booking.status === 'completed' ? 'Hoàn thành' :
                       booking.status === 'in_progress' ? 'Đang thực hiện' : 'Đã lên lịch'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textAlign: 'right' }}>
                    {(booking.price || 0).toLocaleString()} VNĐ
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Không tìm thấy đơn đặt gần đây
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Form Modal */}
      {serviceFormOpen && (
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
            width: '500px', 
            maxWidth: '90vw', 
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                {serviceFormMode === 'create' ? 'Tạo Dịch vụ Mới' : 'Cập nhật Dịch vụ'}
              </h3>
              <button
                onClick={() => setServiceFormOpen(false)}
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