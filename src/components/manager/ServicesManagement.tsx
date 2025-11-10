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
import ServiceCreateModal from './ServiceCreateModal'

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
  const [exporting, setExporting] = useState(false)

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
  const [editData, setEditData] = useState<Service | null>(null)
  // Trạng thái form được quản lý trong component riêng
  // Form state sẽ được quản lý bên trong component ServiceCreateModal

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

      const msg = err instanceof Error ? err.message : 'Unknown error'
      setServiceDetailError('Không thể tải chi tiết dịch vụ: ' + msg)
    } finally {
      setServiceDetailLoading(false)
    }
  }

  const openCreateService = () => {
    setEditData(null)
    setServiceFormOpen(true)
  }

  // create service flow is controlled elsewhere; removed unused helper

  const openEditService = (s: Service) => {
    setEditData(s)
    setServiceFormOpen(true)
  }

  // submitServiceForm: chuyển sang component ServiceCreateModal trong bước tiếp theo

  // Bỏ nút kích hoạt/vô hiệu hóa theo yêu cầu => loại bỏ handler trạng thái

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

        setError('Không thể tải dữ liệu dịch vụ')
      }
    }

    loadData()
  }, [fetchServices])

  // Service stats (hiện chưa dùng trong toolbar)

  const handleExport = async () => {
    try {
      setExporting(true)
      const { blob, filename } = await ServiceManagementService.exportServices({
        search: serviceSearch,
        categoryId: undefined,
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || 'services.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {

      window.alert('Không thể xuất danh sách dịch vụ. Vui lòng thử lại!')
    } finally {
      setExporting(false)
    }
  }

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
            {/* removed dashboard chip */}
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
              {/* removed export button */}
              <button type="button" className="toolbar-adduser accent-button" onClick={() => openCreateService()}>
                <Plus size={14} /> Thêm dịch vụ
              </button>
            </div>
          </div>
        </div>
        <div className="toolbar-filters">
          {/* Trạng thái (nút mới tránh xung đột CSS) */}
          <div className="svc-filter" ref={statusRef} onClick={(e) => { e.stopPropagation(); setOpenStatusMenu(v => !v); setOpenPriceMenu(false); }}>
            <button type="button" className="svc-trigger">{serviceStatus === 'all' ? 'Tất cả trạng thái' : serviceStatus === 'active' ? 'Hoạt động' : 'Không hoạt động'}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openStatusMenu && (
              <ul className="svc-menu show">
                {[{v:'all',t:'Tất cả trạng thái'},{v:'active',t:'Hoạt động'},{v:'inactive',t:'Không hoạt động'}].map(opt => (
                  <li key={opt.v} className={`svc-item ${serviceStatus === opt.v ? 'active' : ''}`}
                      onClick={() => { setServiceStatus(opt.v as 'all'|'active'|'inactive'); setServicePage(1); setOpenStatusMenu(false); }}>
                    {opt.t}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Khoảng giá (nút mới tránh xung đột CSS) */}
          <div className="svc-filter" ref={priceRef} onClick={(e) => { e.stopPropagation(); setOpenPriceMenu(v => !v); setOpenStatusMenu(false); }}>
            <button type="button" className="svc-trigger">{priceRange === 'all' ? 'Tất cả giá' : priceRange === 'lt10' ? '< 10k' : priceRange === '10to50' ? '10k – 50k' : '> 50k'}</button>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openPriceMenu && (
              <ul className="svc-menu show">
                {([
                  {v:'all',t:'Tất cả giá'},
                  {v:'lt10',t:'< 10k'},
                  {v:'10to50',t:'10k – 50k'},
                  {v:'gt50',t:'> 50k'}
                ] as {v:'all'|'lt10'|'10to50'|'gt50'; t:string}[]).map(opt => (
                  <li key={opt.v} className={`svc-item ${priceRange === opt.v ? 'active' : ''}`}
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

      {/* Service Form Modal đã được gỡ theo yêu cầu */}

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

      {/* New Service Create Modal (component riêng) */}
      <ServiceCreateModal open={serviceFormOpen} onClose={() => setServiceFormOpen(false)} initial={editData || undefined} onSaved={() => fetchServices()} />
    </div>
  )
}
