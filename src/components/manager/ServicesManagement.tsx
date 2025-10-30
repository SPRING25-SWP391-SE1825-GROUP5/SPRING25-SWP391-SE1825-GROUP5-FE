import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Wrench,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  List as ListIcon,
  EyeOff,
  SlidersHorizontal,
  Download
} from 'lucide-react'
import { ServiceManagementService, type Service, type ServiceListParams } from '../../services/serviceManagementService'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import './ServicesManagement.scss'
import ServicesListTable from './ServicesListTable'

export default function ServicesManagement() {
  // User info không cần dùng trong màn hình này
  
  // State Management
  const [apiServices, setApiServices] = useState<Service[]>([])
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
  const [totalCount, setTotalCount] = useState(0)
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [openPriceMenu, setOpenPriceMenu] = useState(false)
  const [priceRange, setPriceRange] = useState<'all' | 'lt10' | '10to50' | 'gt50'>('all')
  
  // Refs for dropdown management
  const servicePageSizeRef = useRef<HTMLDivElement | null>(null)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const priceRef = useRef<HTMLDivElement | null>(null)
  
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
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all services first (without pagination)
      const params: ServiceListParams = { 
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

      // Apply search by name/description (client-side to đảm bảo realtime)
      if (serviceSearch.trim()) {
        const term = serviceSearch.trim().toLowerCase()
        allServices = allServices.filter(s =>
          (s.name || '').toLowerCase().includes(term) ||
          (s.description || '').toLowerCase().includes(term)
        )
      }

      // Apply price filter
      if (priceRange !== 'all') {
        allServices = allServices.filter(s => {
          const p = s.price || 0
          if (priceRange === 'lt10') return p < 10000
          if (priceRange === '10to50') return p >= 10000 && p <= 50000
          return p > 50000
        })
      }

      // Apply sorting to all services
      if (allServices.length > 0) {
        allServices = allServices.sort((a, b) => {
          let aValue: string | number, bValue: string | number;
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
      setTotalCount(allServices.length);
      
      // Apply pagination to sorted results
      const startIndex = (servicePage - 1) * servicePageSize;
      const endIndex = startIndex + servicePageSize;
      const paginatedServices = allServices.slice(startIndex, endIndex);
      
      setApiServices(paginatedServices)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError('Không thể tải danh sách dịch vụ: ' + msg)
      console.error('Lỗi khi tải dịch vụ:', err)
    } finally {
      setLoading(false)
    }
  }, [serviceSearch, serviceStatus, sortBy, sortOrder, servicePage, servicePageSize, priceRange])


  const openServiceDetail = async (id: number) => {
    try {
      setServiceDetailLoading(true)
      setServiceDetailError(null)
      setServiceDetailOpen(true)
      const detail = await ServiceManagementService.getServiceById(id)
      setSelectedService(detail)
    } catch (err: unknown) {
      console.error('Lỗi khi tải chi tiết dịch vụ:', err)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setServiceDetailError('Không thể tải chi tiết dịch vụ: ' + msg)
    } finally {
      setServiceDetailLoading(false)
    }
  }

  const openCreateService = () => {
    setServiceFormMode('create')
    setServiceFormValues({ name: '', description: '', notes: '', price: 0, isActive: true })
    setServiceFormError(null)
    setServiceFormOpen(true)
  }

  // create service flow is controlled elsewhere; removed unused helper

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
    } catch (err: unknown) {
      console.error('Lỗi khi gửi form dịch vụ:', err)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setServiceFormError(`Không thể lưu dịch vụ: ${msg}`)
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
    } catch (err: unknown) {
      console.error('Lỗi khi chuyển trạng thái dịch vụ:', err)
      const msg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Không thể cập nhật trạng thái dịch vụ: ${msg}`)
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

  // icon sort chỉ dùng trong bảng mới nếu cần, hiện tại bỏ tại cột Tên dịch vụ để tránh reload

  // statusOptions không còn cần vì đã render trực tiếp trong dropdown

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (servicePageSizeRef.current && !servicePageSizeRef.current.contains(e.target as Node)) {
        setOpenPageSizeMenu(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setOpenStatusMenu(false);
      }
      if (priceRef.current && !priceRef.current.contains(e.target as Node)) {
        setOpenPriceMenu(false);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Load data on component mount and when filters change
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchServices()
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu dịch vụ:', err)
        setError('Không thể tải dữ liệu dịch vụ')
      }
    }
    
    loadData()
  }, [fetchServices])

  // Service stats (hiện chưa dùng trong toolbar)

  return (
      <div className="services-management" style={{ 
      padding: '24px', 
      background: '#fff', 
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
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} />
      </div>

      {/* Users Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            <button type="button" className="toolbar-chip"><LayoutGrid size={14} /> Bảng</button>
            <button type="button" className="toolbar-chip is-active"><LayoutGrid size={14} /> Bảng điều khiển</button>
            <button type="button" className="toolbar-chip"><ListIcon size={14} /> Danh sách</button>
            <div className="toolbar-sep" />
          </div>
          <div className="toolbar-right" style={{ flex: 1 }}>
            <div className="toolbar-search">
              <div className="search-wrap">
                <Search size={14} className="icon" />
            <input
                  placeholder="Tìm dịch vụ theo tên" 
              value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
              />
            </div>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="toolbar-chip"><EyeOff size={14} /> Ẩn</button>
              <button type="button" className="toolbar-chip"><SlidersHorizontal size={14} /> Tùy chỉnh</button>
              <button type="button" className="toolbar-btn"><Download size={14} /> Xuất</button>
              <button type="button" className="toolbar-adduser accent-button" onClick={() => openCreateService()}>
                <Plus size={14} /> Thêm dịch vụ
              </button>
            </div>
          </div>
        </div>
        <div className="toolbar-filters">
          {/* Trạng thái */}
          <div className="pill-select" ref={statusRef} onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(v => !v); setOpenPriceMenu(false); }}>
            <button type="button" className="pill-trigger">{serviceStatus === 'all' ? 'Tất cả trạng thái' : serviceStatus === 'active' ? 'Hoạt động' : 'Không hoạt động'}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openStatusMenu && (
              <ul className="pill-menu show">
                {[{v:'all',t:'Tất cả trạng thái'},{v:'active',t:'Hoạt động'},{v:'inactive',t:'Không hoạt động'}].map(opt => (
                  <li key={opt.v} className={`pill-item ${serviceStatus === opt.v ? 'active' : ''}`}
                      onClick={() => { setServiceStatus(opt.v as 'all'|'active'|'inactive'); setServicePage(1); setOpenStatusMenu(false); }}>
                    {opt.t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Khoảng giá */}
          <div className="pill-select" ref={priceRef} onClick={(e) => { e.stopPropagation(); setOpenPriceMenu(v => !v); setOpenStatusMenu(false); }}>
            <button type="button" className="pill-trigger">{priceRange === 'all' ? 'Tất cả giá' : priceRange === 'lt10' ? '< 10k' : priceRange === '10to50' ? '10k – 50k' : '> 50k'}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openPriceMenu && (
              <ul className="pill-menu show">
                {([
                  {v:'all',t:'Tất cả giá'},
                  {v:'lt10',t:'< 10k'},
                  {v:'10to50',t:'10k – 50k'},
                  {v:'gt50',t:'> 50k'}
                ] as {v:'all'|'lt10'|'10to50'|'gt50'; t:string}[]).map(opt => (
                  <li key={opt.v} className={`pill-item ${priceRange === opt.v ? 'active' : ''}`}
                      onClick={() => { setPriceRange(opt.v); setServicePage(1); setOpenPriceMenu(false); }}>
                    {opt.t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Nút thêm bộ lọc (chưa dùng) */}
          <button type="button" className="toolbar-chip"><Plus size={14} /> Thêm bộ lọc</button>
        </div>
      </div>
      
        {/* Services List */}
        
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
              <ServicesListTable
                services={apiServices}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onView={(id) => openServiceDetail(id)}
                onEdit={(s) => openEditService(s)}
                onToggle={(id) => handleToggleServiceStatus(id)}
              />
            )}

      {/* Enhanced Pagination */}
      <div className="pagination-controls-bottom">
        {/* Left: Rows per page + range */}
        <div className="pagination-info">
          <span className="pagination-label">Hàng mỗi trang</span>
          <div className="pill-select" ref={servicePageSizeRef} onClick={(e) => { e.stopPropagation(); setOpenPageSizeMenu(v => !v); }}>
            <button type="button" className="pill-trigger">{servicePageSize}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openPageSizeMenu && (
              <ul className="pill-menu show">
                {[10, 15, 20, 30, 50].map(sz => (
                  <li key={sz} className={`pill-item ${servicePageSize === sz ? 'active' : ''}`}
                      onClick={() => { setServicePageSize(sz); setServicePage(1); setOpenPageSizeMenu(false); }}>
                    {sz}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="pagination-range">
            {(() => {
              const start = (servicePage - 1) * servicePageSize + 1;
              const end = start + apiServices.length - 1;
              return totalCount > 0 ? `${start}–${end} của ${totalCount} hàng` : `${start}–${end}`;
            })()}
          </span>
          </div>

        {/* Right: Pagination Controls */}
        <div className="pagination-right-controls">
          {/* First Page */}
            <button
            type="button"
              disabled={servicePage === 1}
            onClick={() => setServicePage(1)}
            className={`pager-btn ${servicePage === 1 ? 'is-disabled' : ''}`}
          >
            <ChevronsLeft size={16} />
            <span>Đầu</span>
            </button>

          {/* Previous Page */}
            <button
            type="button"
            disabled={servicePage === 1}
            onClick={() => setServicePage((p) => p - 1)}
            className={`pager-btn ${servicePage === 1 ? 'is-disabled' : ''}`}
          >
            <ChevronLeft size={16} />
            <span>Trước</span>
            </button>

          {/* Page Numbers */}
        <div className="pager-pages">
            {(() => {
              const pages = [];

              // First page + static ellipsis like Users
                pages.push(
                  <button
                    key={1}
                    type="button"
                    onClick={() => setServicePage(1)}
                    className={`pager-btn ${servicePage === 1 ? 'is-active' : ''}`}
                  >
                    1
                  </button>
                );
              // Always show page 2 if exists
              if (totalPages >= 2) {
                pages.push(
                  <button
                    key={2}
                    type="button"
                    onClick={() => setServicePage(2)}
                    className={`pager-btn ${servicePage === 2 ? 'is-active' : ''}`}
                  >
                    2
                  </button>
                );
              }
              // Static ellipsis when more than 3 pages
              if (totalPages > 3) {
                pages.push(<span key="ellipsis-static" className="pager-ellipsis">…</span>);
              }

              // Always show last page (5 in hình 1)
              if (totalPages >= 3) {
                pages.push(
                  <button
                    key={totalPages}
                    type="button"
                    onClick={() => setServicePage(totalPages)}
                    className={`pager-btn ${servicePage === totalPages ? 'is-active' : ''}`}
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
            type="button"
            disabled={servicePage === totalPages || totalPages === 0}
            onClick={() => setServicePage((p) => p + 1)}
            className={`pager-btn ${servicePage === totalPages || totalPages === 0 ? 'is-disabled' : ''}`}
          >
            <span>Sau</span>
            <ChevronRight size={16} />
          </button>

          {/* Last Page */}
          <button
            type="button"
            disabled={servicePage === totalPages || totalPages === 0}
            onClick={() => setServicePage(totalPages)}
            className={`pager-btn ${servicePage === totalPages || totalPages === 0 ? 'is-disabled' : ''}`}
          >
            <span>Cuối</span>
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