import { useState, useEffect, useRef } from 'react'
import {
  Globe,
  Edit,
  X,
  Plus,
  CheckCircle,
  Search,
  Eye,
  Users,
  Wrench,
  Circle,
  AlertCircle,
  Building2,
  UserX,
  WrenchIcon,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Phone,
  Calendar,
  Settings,
  List,
  BarChart2,
  Download
} from 'lucide-react'
import { CenterService, type Center, type CenterListParams } from '../../services/centerService'
import { StaffService } from '../../services/staffService'
import { TechnicianService } from '../../services/technicianService'
import CenterFormModal from './CenterFormModal'
import './CenterManagement.scss'

export default function CenterManagement() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [city, setCity] = useState('')
  const [centerStatus, setCenterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('centerName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalPages, setTotalPages] = useState(1)

  // Modal states
  const [formOpen, setFormOpen] = useState(false)
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null)


  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedCenterDetail, setSelectedCenterDetail] = useState<Center | null>(null)
  const [centerStaff, setCenterStaff] = useState<any[]>([])
  const [centerTechnicians, setCenterTechnicians] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  // Stats states
  const [stats, setStats] = useState({
    totalCenters: 0,
    activeCenters: 0,
    inactiveCenters: 0
  })
  const [loadingStats, setLoadingStats] = useState(false)

  // Thêm khai báo pageSize và totalItems phía trên dùng useState
  const [pageSize, setPageSize] = useState(10)
  // totalItems lấy từ data trả về lúc fetch
  const [totalItems, setTotalItems] = useState(0)


  const fetchStats = async () => {
    try {
      setLoadingStats(true)

      // Fetch all centers for stats
      const allCentersResponse = await CenterService.getCenters({ pageNumber: 1, pageSize: 1000 })
      const allCenters = allCentersResponse?.centers || []

      // Calculate center stats
      const totalCenters = allCenters.length
      const activeCenters = allCenters.filter(center => center.isActive).length
      const inactiveCenters = totalCenters - activeCenters

      setStats({
        totalCenters,
        activeCenters,
        inactiveCenters
      })
    } catch (err: any) {
      // Error handled by setError state
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchCenters = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all centers first (without pagination)
      const params: CenterListParams = { pageNumber: 1, pageSize: 1000 }
      if (searchTerm) params.searchTerm = searchTerm
      if (city) params.city = city

      // Get all centers (both active and inactive)
      const response = await CenterService.getCenters(params)

      let allCenters = response?.centers || []

      // Apply status filter
      if (centerStatus !== 'all') {
        const isActive = centerStatus === 'active'
        allCenters = allCenters.filter(center => center.isActive === isActive)
      }

      // Apply sorting to all centers
      if (allCenters.length > 0) {
        allCenters = allCenters.sort((a, b) => {
          let aValue: any, bValue: any;
          switch (sortBy) {
            case 'centerName':
              aValue = a.centerName?.toLowerCase() || '';
              bValue = b.centerName?.toLowerCase() || '';
              break;
            case 'address':
              aValue = a.address?.toLowerCase() || '';
              bValue = b.address?.toLowerCase() || '';
              break;
            case 'phoneNumber':
              aValue = a.phoneNumber?.toLowerCase() || '';
              bValue = b.phoneNumber?.toLowerCase() || '';
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            default:
              aValue = a.centerName?.toLowerCase() || '';
              bValue = b.centerName?.toLowerCase() || '';
          }
          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      }

      // Calculate total pages
      const pageSize = 10;
      const calculatedTotalPages = Math.ceil(allCenters.length / pageSize);
      setTotalPages(calculatedTotalPages);

      // Apply pagination to sorted results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCenters = allCenters.slice(startIndex, endIndex);

      setCenters(paginatedCenters)
      setTotalItems(allCenters.length)
    } catch (err: any) {
      setError('Không thể tải danh sách trung tâm: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setSelectedCenter(null)
    setFormOpen(true)
  }

  const openEditForm = (center: Center) => {
    setSelectedCenter(center)
    setFormOpen(true)
  }

  const handleFormSuccess = async () => {
      await fetchCenters()
  }


  const openDetailModal = async (center: Center) => {
    try {
      setSelectedCenterDetail(center)
      setDetailModalOpen(true)
      setLoadingDetails(true)

      // Dùng API hợp nhất để lấy toàn bộ nhân sự theo center và tách theo role
      const employeesResp = await StaffService.getCenterEmployees({ centerId: center.centerId, pageSize: 1000 })
      const employees = (employeesResp as any)?.employees || []

      const staff = employees
        .filter((e: any) => (e.role || '').toUpperCase() === 'STAFF')
        .map((e: any) => ({
          staffId: e.id,
          userId: e.userId,
          userFullName: e.fullName,
          isActive: e.isActive,
          centerId: e.centerId,
          centerName: e.centerName,
        }))

      const technicians = employees
        .filter((e: any) => (e.role || '').toUpperCase() === 'TECHNICIAN')
        .map((e: any) => ({
          technicianId: e.id,
          userId: e.userId,
          userFullName: e.fullName,
          isActive: e.isActive,
          centerId: e.centerId,
          centerName: e.centerName,
          position: e.position,
        }))

      setCenterStaff(staff)
      setCenterTechnicians(technicians)
    } catch (err: any) {
      // Improved error handling with better messages
      const errorMessage = err?.userMessage ||
                          err?.message ||
                          err?.response?.data?.message ||
                          'Unknown error'

      // Check if it's a backend restart error
      if (err?.isBackendRestart) {
        setError(`Server đang khởi động lại. Vui lòng đợi và thử lại sau...`)
      } else if (err?.isAuthError) {
        // Auth error will be handled by interceptor
        setError(errorMessage)
      } else {
        setError(`Lỗi khi tải chi tiết trung tâm: ${errorMessage}`)
      }
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
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

  // Dropdown headless states
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [openCityMenu, setOpenCityMenu] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const cityRef = useRef<HTMLDivElement | null>(null)

  // Thêm state ở đầu component
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false)
  const pageSizeOptions = [5, 10, 20, 50]
  const pageSizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) {
        setIsPageSizeDropdownOpen(false)
      }
    }
    if (isPageSizeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isPageSizeDropdownOpen])

  useEffect(() => {
    fetchCenters()
    fetchStats()
  }, [page, searchTerm, city, centerStatus, sortBy, sortOrder])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setOpenStatusMenu(false)
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setOpenCityMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div className="center-management">
      {/* Toolbar chuẩn Users */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            {/* removed dashboard chip */}
            <div className="toolbar-sep"></div>
        </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <div className="search-wrap">
              <span className="icon"><Search size={16}/></span>
              <input
                placeholder="Tìm trung tâm theo tên"
                value={searchTerm}
                onChange={(e)=>{ setPage(1); setSearchTerm(e.target.value) }}
              />
              </div>
            </div>
            <div className="toolbar-actions" style={{marginLeft:'auto'}}>
              {/* removed hide/customize buttons */}
              <button type="button" className="accent-button" onClick={openCreateForm}><Plus size={16}/> Thêm trung tâm</button>
            </div>
          </div>
        </div>

        <div className="toolbar-filters">
          {/* Trạng thái */}
          <div className="pill-select" ref={statusRef}>
            <button type="button" className="pill-trigger" onClick={()=>{ setOpenStatusMenu(!openStatusMenu); setOpenCityMenu(false); }}>
              <CheckCircle size={14} style={{marginRight:6}}/>
              {statusOptions.find(o=>o.value===centerStatus)?.label || 'Tất cả trạng thái'}
              <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul className={`pill-menu ${openStatusMenu ? 'show' : ''}`}>
              {statusOptions.map(opt => (
                <li key={opt.value} className={`pill-item ${centerStatus===opt.value ? 'active' : ''}`} onClick={()=>{ setCenterStatus(opt.value); setPage(1); setOpenStatusMenu(false); }}>
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Thành phố */}
          <div className="pill-select" ref={cityRef}>
            <button type="button" className="pill-trigger" onClick={()=>{ setOpenCityMenu(!openCityMenu); setOpenStatusMenu(false); }}>
              <Globe size={14} style={{marginRight:6}}/>
              {city ? city : 'Tất cả thành phố'}
              <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <ul className={`pill-menu ${openCityMenu ? 'show' : ''}`}>
              <li className={`pill-item ${city==='' ? 'active' : ''}`} onClick={()=>{ setCity(''); setPage(1); setOpenCityMenu(false); }}>Tất cả thành phố</li>
              {Array.from(new Set(centers.map(c=>c.city).filter(Boolean))).sort().map((c)=> (
                <li key={String(c)} className={`pill-item ${city===c ? 'active' : ''}`} onClick={()=>{ setCity(String(c)); setPage(1); setOpenCityMenu(false); }}>{String(c)}</li>
              ))}
            </ul>
          </div>

          <button type="button" className="toolbar-chip"><Plus size={14}/> Thêm bộ lọc</button>
        </div>
      </div>

      {/* Centers List */}
      <div className="center-management__content">

        {loading ? (
          <div className="center-management__loading">
            <div className="center-management__loading-spinner" />
            <p className="center-management__loading-text">Đang tải trung tâm...</p>
          </div>
        ) : error ? (
          <div className="center-management__error">
            <div className="center-management__error-icon" />
            <p className="center-management__error-text">{error}</p>
          </div>
        ) : centers.length === 0 ? (
          <div className="center-management__empty">
            <div className="center-management__empty-icon">
              <Building2 size={32} />
            </div>
            <h4 className="center-management__empty-title">
              Không tìm thấy trung tâm nào
            </h4>
            <p className="center-management__empty-text">
              Thử thay đổi bộ lọc hoặc tạo trung tâm mới
            </p>
          </div>
        ) : (
          <div className="parts-table-wrapper" style={{ overflow: 'auto' }}>
            <table className="centers-table">
              <thead>
                <tr>
                  <th>
                    <span className="th-content"><Building2 size={16} /> <span>Tên trung tâm</span></span>
                  </th>
                  <th>
                    <span className="th-content"><Globe size={15} /> <span>Địa chỉ</span></span>
                  </th>
                  <th>
                    <span className="th-content"><Phone size={15} /> <span>Số điện thoại</span></span>
                  </th>
                  <th>
                    <span className="th-content"><CheckCircle size={15} /> <span>Trạng thái</span></span>
                  </th>
                  <th>
                    <span className="th-content"><Calendar size={15} /> <span>Ngày tạo</span></span>
                  </th>
                  <th>
                    <span className="th-content"><Settings size={15} /> <span>Thao tác</span></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {centers.map((center) => (
                  <tr key={center.centerId}>
                    <td>
                      <div className="center-info">
                        <span style={{ fontWeight: 400 }}>{center.centerName}</span>
                      </div>
                    </td>
                    <td>
                      <div className="center-address">
                        {center.address}
                      {center.city && (
                          <div className="center-address-city">
                          {center.city}
                        </div>
                      )}
                      </div>
                    </td>
                    <td>
                      <div className="center-phone">
                         {center.phoneNumber}
                      </div>
                    </td>
                    <td>
                      <div className={`status-badge ${center.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        <span className="dot" /> {center.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </div>
                    </td>
                    <td>
                      {new Date(center.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td>
                      <div className="center-actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailModal(center); }}
                          className="action-button"
                          title="Xem chi tiết trung tâm"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); openEditForm(center); }}
                          className="action-button"
                          title="Sửa trung tâm"
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

      {/* Pagination chuẩn Users */}
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
              <svg className="caret" style={{marginLeft:6}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            {isPageSizeDropdownOpen && (
              <ul className="pill-menu show" style={{ position: 'absolute', zIndex: 100, left: 0, top: '100%', minWidth: '64px' }}>
                {pageSizeOptions.map(option => (
                  <li
                    key={option}
                    className={`pill-item ${option === pageSize ? 'active' : ''}`}
                    onClick={() => { setPageSize(option); setPage(1); setIsPageSizeDropdownOpen(false) }}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="pagination-range">
            {`${(page-1)*pageSize+1}–${Math.min(page*pageSize, totalItems)} của ${totalItems} hàng`}
          </span>
          </div>
        <div className="pagination-right-controls">
          <button className={`pager-btn ${page===1?'is-disabled':''}`} disabled={page===1} onClick={()=>setPage(1)}><ChevronsLeft size={16}/></button>
          <button className={`pager-btn ${page===1?'is-disabled':''}`} disabled={page===1} onClick={()=>setPage(page-1)}><ChevronLeft size={16}/></button>
          <div className="pager-pages">
            {page>2 && <button className="pager-btn" onClick={()=>setPage(1)}>1</button>}
            {page>3 && <span className="pager-ellipsis">…</span>}
            {page>1 && <button className="pager-btn" onClick={()=>setPage(page-1)}>{page-1}</button>}
            <button className="pager-btn is-active">{page}</button>
            {page<totalPages && <button className="pager-btn" onClick={()=>setPage(Math.min(totalPages,page+1))}>{Math.min(totalPages,page+1)}</button>}
            {page<totalPages-2 && <span className="pager-ellipsis">…</span>}
            {page<totalPages-1 && <button className="pager-btn" onClick={()=>setPage(totalPages)}>{totalPages}</button>}
          </div>
          <button className={`pager-btn ${page===totalPages?'is-disabled':''}`} disabled={page===totalPages} onClick={()=>setPage(Math.min(totalPages,page+1))}><ChevronRight size={16}/></button>
          <button className={`pager-btn ${page===totalPages?'is-disabled':''}`} disabled={page===totalPages} onClick={()=>setPage(totalPages)}><ChevronsRight size={16}/></button>
        </div>
      </div>

      {/* Form Modal */}
      <CenterFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        mode={selectedCenter ? 'update' : 'create'}
        center={selectedCenter}
      />

      {/* Detail Modal */}
      {detailModalOpen && selectedCenterDetail && (
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
            width: '900px',
            maxWidth: '95vw',
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
                  Chi tiết Trung tâm
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--text-secondary)'
                }}>
                  {selectedCenterDetail.centerName}
                </p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
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

            {/* Center Info */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '24px',
              border: '1px solid var(--border-primary)'
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Thông tin Trung tâm
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tên trung tâm</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedCenterDetail.centerName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Số điện thoại</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedCenterDetail.phoneNumber}
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Địa chỉ</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedCenterDetail.address}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Trạng thái</div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    background: selectedCenterDetail.isActive ? 'var(--success-50)' : 'var(--error-50)',
                    color: selectedCenterDetail.isActive ? 'var(--success-700)' : 'var(--error-700)',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: `1px solid ${selectedCenterDetail.isActive ? 'var(--success-200)' : 'var(--error-200)'}`
                  }}>
                    {selectedCenterDetail.isActive ? (
                      <>
                        <Circle size={12} fill="currentColor" />
                        Hoạt động
                      </>
                    ) : (
                      <>
                        <AlertCircle size={12} fill="currentColor" />
                        Ngừng hoạt động
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Ngày tạo</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {new Date(selectedCenterDetail.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            </div>

            {/* Staff and Technicians */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Staff Section */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <Users size={20} style={{ color: 'var(--primary-500)' }} />
                  <h4 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Nhân viên ({centerStaff.length})
                  </h4>
                </div>

                {loadingDetails ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid var(--border-primary)',
                      borderTop: '3px solid var(--primary-500)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Đang tải nhân viên...</p>
                  </div>
                ) : centerStaff.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <UserX size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--text-tertiary)' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Chưa có nhân viên nào</p>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '300px',
                    overflow: 'auto',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    {centerStaff.map((staff, index) => (
                      <div key={staff.staffId || index} style={{
                        padding: '16px',
                        borderBottom: index < centerStaff.length - 1 ? '1px solid var(--border-primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {staff.userFullName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '2px'
                          }}>
                            {staff.userFullName || 'Không có tên'}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                          }}>
                            ID: {staff.staffId}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: staff.isActive ? 'var(--success-50)' : 'var(--error-50)',
                          color: staff.isActive ? 'var(--success-700)' : 'var(--error-700)',
                          fontSize: '10px',
                          fontWeight: '600',
                          border: `1px solid ${staff.isActive ? 'var(--success-200)' : 'var(--error-200)'}`
                        }}>
                          {staff.isActive ? (
                            <>
                              <Circle size={8} fill="currentColor" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <AlertCircle size={8} fill="currentColor" />
                              Không hoạt động
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Technicians Section */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  <Wrench size={20} style={{ color: 'var(--primary-500)' }} />
                  <h4 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    Kỹ thuật viên ({centerTechnicians.length})
                  </h4>
                </div>

                {loadingDetails ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid var(--border-primary)',
                      borderTop: '3px solid var(--primary-500)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Đang tải kỹ thuật viên...</p>
                  </div>
                ) : centerTechnicians.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <WrenchIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--text-tertiary)' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Chưa có kỹ thuật viên nào</p>
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '300px',
                    overflow: 'auto',
                    background: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-primary)'
                  }}>
                    {centerTechnicians.map((technician, index) => (
                      <div key={technician.technicianId || index} style={{
                        padding: '16px',
                        borderBottom: index < centerTechnicians.length - 1 ? '1px solid var(--border-primary)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}>
                          {technician.userFullName?.charAt(0)?.toUpperCase() || 'T'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'var(--text-primary)',
                            marginBottom: '2px'
                          }}>
                            {technician.userFullName || 'Không có tên'}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)'
                          }}>
                            ID: {technician.technicianId}
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: technician.isActive ? 'var(--success-50)' : 'var(--error-50)',
                          color: technician.isActive ? 'var(--success-700)' : 'var(--error-700)',
                          fontSize: '10px',
                          fontWeight: '600',
                          border: `1px solid ${technician.isActive ? 'var(--success-200)' : 'var(--error-200)'}`
                        }}>
                          {technician.isActive ? (
                            <>
                              <Circle size={8} fill="currentColor" />
                              Hoạt động
                            </>
                          ) : (
                            <>
                              <AlertCircle size={8} fill="currentColor" />
                              Không hoạt động
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
