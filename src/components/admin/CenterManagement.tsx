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
  ToggleLeft,
  ToggleRight,
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
  const [formMode, setFormMode] = useState<'create' | 'update'>('create')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedCenter, setSelectedCenter] = useState<Center | null>(null)
  const [formValues, setFormValues] = useState({
    centerName: '',
    address: '',
    phoneNumber: '',
    isActive: true
  })
  
  const [fieldErrors, setFieldErrors] = useState({
    centerName: '',
    address: '',
    phoneNumber: ''
  })
  
  const [togglingCenterId, setTogglingCenterId] = useState<number | null>(null)
  
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

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors = { ...fieldErrors }
    
    switch (field) {
      case 'centerName':
        if (!value.trim()) {
          errors.centerName = 'Tên trung tâm là bắt buộc'
        } else if (value.trim().length < 3) {
          errors.centerName = 'Tên trung tâm phải có ít nhất 3 ký tự'
        } else {
          errors.centerName = ''
        }
        break
      case 'address':
        if (!value.trim()) {
          errors.address = 'Địa chỉ là bắt buộc'
        } else if (value.trim().length < 10) {
          errors.address = 'Địa chỉ phải có ít nhất 10 ký tự'
        } else {
          errors.address = ''
        }
        break
      case 'phoneNumber':
        if (!value.trim()) {
          errors.phoneNumber = 'Số điện thoại là bắt buộc'
        } else if (!/^0\d{9,10}$/.test(value.trim())) {
          errors.phoneNumber = 'Số điện thoại phải có 10-11 chữ số và bắt đầu bằng 0'
        } else {
          errors.phoneNumber = ''
        }
        break
    }
    
    setFieldErrors(errors)
  }

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
    setFormMode('create')
    setFormValues({ centerName: '', address: '', phoneNumber: '', isActive: true })
    setFormError(null)
    setFieldErrors({ centerName: '', address: '', phoneNumber: '' })
    setFormOpen(true)
  }

  const openEditForm = (center: Center) => {
    setFormMode('update')
    setSelectedCenter(center)
    setFormValues({
      centerName: center.centerName || '',
      address: center.address || '',
      phoneNumber: center.phoneNumber || '',
      isActive: center.isActive
    })
    setFormError(null)
    setFieldErrors({ centerName: '', address: '', phoneNumber: '' })
    setFormOpen(true)
  }

  const submitForm = async () => {
    try {
      setFormSubmitting(true)
      setFormError(null)
      
      // Validation
      if (!formValues.centerName.trim()) {
        setFormError('Tên trung tâm là bắt buộc')
        return
      }
      if (formValues.centerName.trim().length < 3) {
        setFormError('Tên trung tâm phải có ít nhất 3 ký tự')
        return
      }
      
      if (!formValues.address.trim()) {
        setFormError('Địa chỉ là bắt buộc')
        return
      }
      if (formValues.address.trim().length < 10) {
        setFormError('Địa chỉ phải có ít nhất 10 ký tự')
        return
      }
      
      if (!formValues.phoneNumber.trim()) {
        setFormError('Số điện thoại là bắt buộc')
        return
      }
      // More flexible phone validation
      const phoneRegex = /^0\d{9,10}$/
      if (!phoneRegex.test(formValues.phoneNumber.trim())) {
        setFormError('Số điện thoại phải có 10-11 chữ số và bắt đầu bằng 0')
        return
      }
      
      // Prepare clean data
      const cleanData = {
        centerName: formValues.centerName.trim(),
        address: formValues.address.trim(),
        phoneNumber: formValues.phoneNumber.trim(),
        isActive: formValues.isActive
      }

      if (formMode === 'create') {
        await CenterService.createCenter(cleanData)
      } else {
        if (!selectedCenter) {
          setFormError('Không tìm thấy trung tâm để cập nhật')
          return
        }
        await CenterService.updateCenter(selectedCenter.centerId, cleanData)
      }
      
      setFormOpen(false)
      await fetchCenters()
    } catch (err: any) {
      
      // Extract detailed error message
      let errorMessage = 'Unknown error'
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.data.errors) {
          // Handle validation errors from server
          const errors = err.response.data.errors
          if (typeof errors === 'object') {
            errorMessage = Object.values(errors).flat().join(', ')
          }
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setFormError(`Không thể lưu trung tâm: ${errorMessage}`)
    } finally {
      setFormSubmitting(false)
    }
  }

  const toggleCenterStatus = async (centerId: number) => {
    try {
      setTogglingCenterId(centerId)
      const updatedCenter = await CenterService.toggleCenterStatus(centerId)
      
      // Success handled by UI state
      
      // Refresh the list
      await fetchCenters()
    } catch (err: any) {
      setError(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái'}`)
    } finally {
      setTogglingCenterId(null)
    }
  }

  const openDetailModal = async (center: Center) => {
    try {
      setSelectedCenterDetail(center)
      setDetailModalOpen(true)
      setLoadingDetails(true)
      
      // Fetch staff and technicians for this center
      const [staffResponse, technicianResponse] = await Promise.all([
        StaffService.getStaffList({ centerId: center.centerId, pageSize: 1000 }),
        TechnicianService.list({ centerId: center.centerId, pageSize: 1000 })
      ])
      
      setCenterStaff(staffResponse.data.staff || [])
      setCenterTechnicians(technicianResponse.technicians || [])
    } catch (err: any) {
      setError(`Lỗi khi tải chi tiết trung tâm: ${err.message || 'Unknown error'}`)
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
            <button type="button" className="toolbar-chip"><List size={14}/> Bảng</button>
            <button type="button" className="toolbar-chip is-active"><BarChart2 size={14}/> Bảng điều khiển</button>
            <button type="button" className="toolbar-chip"><Users size={14}/> Danh sách</button>
            <div className="toolbar-sep"></div>
        </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <span className="icon"><Search size={16}/></span>
              <input
                placeholder="Tìm trung tâm theo tên"
                value={searchTerm}
                onChange={(e)=>{ setPage(1); setSearchTerm(e.target.value) }}
                onFocus={e => e.target.classList.add('search-input-focus')}
                onBlur={e => e.target.classList.remove('search-input-focus')}
              />
              <span className="search-underline"></span>
            </div>
            <div className="toolbar-actions" style={{marginLeft:'auto'}}>
              <button type="button" className="toolbar-btn"><Eye size={14}/> Ẩn</button>
              <button type="button" className="toolbar-btn"><Settings size={14}/> Tuỳ chỉnh</button>
              <button type="button" className="toolbar-btn"><Download size={14}/> Xuất</button>
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
            <table className="parts-table center-management__table">
              <thead className="cm-table-head">
                <tr>
                  <th className="cm-th">
                    <span className="th"><Building2 size={16} /> <span>Tên trung tâm</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><Globe size={15} /> <span>Địa chỉ</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><Phone size={15} /> <span>Số điện thoại</span></span>
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
                {centers.map((center, index) => (
                  <tr key={center.centerId}>
                    <td className="center-management__table td">
                      <div className="center-management__center-info">
                        <span className="center-management__center-info-name" style={{ fontWeight: 400 }}>{center.centerName}</span>
                      </div>
                    </td>
                    <td className="center-management__table td center-management__table td--secondary">
                      <div className="center-management__center-address">
                        {center.address}
                      {center.city && (
                          <div className="center-management__center-address-city">
                          {center.city}
                        </div>
                      )}
                      </div>
                    </td>
                    <td className="center-management__table td center-management__table td--secondary">
                      <div className="center-management__center-phone">
                         {center.phoneNumber}
                      </div>
                    </td>
                    <td className="center-management__table td center-management__table td--center">
                      <div className={`status-badge ${center.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        <span className="dot" /> {center.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </div>
                    </td>
                    <td className="center-management__table td center-management__table td--secondary">
                      {new Date(center.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="center-management__table td">
                      <div className="center-management__actions">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailModal(center); }}
                          className="center-management__action-button"
                          title="Xem chi tiết trung tâm"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditForm(center); }}
                          className="center-management__action-button"
                          title="Sửa trung tâm"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCenterStatus(center.centerId); }}
                          disabled={togglingCenterId === center.centerId}
                          className={`center-management__action-button center-management__action-button--toggle ${!center.isActive ? 'center-management__action-button--toggle--inactive' : ''}`}
                          title={center.isActive ? 'Vô hiệu hóa trung tâm' : 'Kích hoạt trung tâm'}
                        >
                          {center.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
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
      {formOpen && (
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
                  {formMode === 'create' ? 'Tạo Trung tâm Mới' : 'Cập nhật Trung tâm'}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)' 
                }}>
                  {formMode === 'create' 
                    ? 'Thêm trung tâm dịch vụ mới vào hệ thống' 
                    : 'Cập nhật thông tin trung tâm dịch vụ'
                  }
                </p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
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
            
            {formError && (
              <div style={{ 
                marginBottom: '20px', 
                color: 'var(--error-600)', 
                fontSize: '14px',
                padding: '16px',
                background: 'var(--error-50)',
                borderRadius: '12px',
                border: '2px solid var(--error-200)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠️ {formError}
              </div>
            )}
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'var(--text-primary)', 
                  marginBottom: '8px' 
                }}>
                  Tên trung tâm <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <input
                  value={formValues.centerName}
                  onChange={(e) => {
                    setFormValues(v => ({ ...v, centerName: e.target.value }))
                    validateField('centerName', e.target.value)
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    border: `2px solid ${fieldErrors.centerName ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                    borderRadius: '12px', 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nhập tên trung tâm"
                  onFocus={(e) => {
                    e.target.style.borderColor = fieldErrors.centerName ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = fieldErrors.centerName ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.centerName ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {fieldErrors.centerName && (
                  <div style={{ 
                    color: 'var(--error-600)', 
                    fontSize: '12px', 
                    marginTop: '4px' 
                  }}>
                    {fieldErrors.centerName}
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'var(--text-primary)', 
                  marginBottom: '8px' 
                }}>
                  Địa chỉ <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <textarea
                  value={formValues.address}
                  onChange={(e) => {
                    setFormValues(v => ({ ...v, address: e.target.value }))
                    validateField('address', e.target.value)
                  }}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    border: `2px solid ${fieldErrors.address ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                    borderRadius: '12px', 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px', 
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nhập địa chỉ trung tâm"
                  onFocus={(e) => {
                    e.target.style.borderColor = fieldErrors.address ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = fieldErrors.address ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.address ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {fieldErrors.address && (
                  <div style={{ 
                    color: 'var(--error-600)', 
                    fontSize: '12px', 
                    marginTop: '4px' 
                  }}>
                    {fieldErrors.address}
                  </div>
                )}
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  color: 'var(--text-primary)', 
                  marginBottom: '8px',
                  
                }}>
                  Số điện thoại <span style={{ color: 'var(--error-500)' }}>*</span>
                </label>
                <input
                  value={formValues.phoneNumber}
                  onChange={(e) => {
                    setFormValues(v => ({ ...v, phoneNumber: e.target.value }))
                    validateField('phoneNumber', e.target.value)
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    border: `2px solid ${fieldErrors.phoneNumber ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                    borderRadius: '12px', 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Nhập số điện thoại (VD: 0123456789)"
                  onFocus={(e) => {
                    e.target.style.borderColor = fieldErrors.phoneNumber ? 'var(--error-500)' : 'var(--primary-500)'
                    e.target.style.boxShadow = fieldErrors.phoneNumber ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.phoneNumber ? 'var(--error-500)' : 'var(--border-primary)'
                    e.target.style.boxShadow = 'none'
                  }}
                />
                {fieldErrors.phoneNumber && (
                  <div style={{ 
                    color: 'var(--error-600)', 
                    fontSize: '12px', 
                    marginTop: '4px' 
                  }}>
                    {fieldErrors.phoneNumber}
                  </div>
                )}
              </div>
              
              <div style={{
                padding: '16px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '2px solid var(--border-primary)'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  color: 'var(--text-primary)', 
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  <input 
                    type="checkbox" 
                    checked={formValues.isActive} 
                    onChange={(e) => setFormValues(v => ({ ...v, isActive: e.target.checked }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--primary-500)'
                    }}
                  />
                  <div>
                    <div>Trung tâm đang hoạt động</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {formValues.isActive ? 'Trung tâm sẽ hoạt động ngay' : 'Trung tâm sẽ bị tạm ngừng hoạt động'}
                    </div>
                  </div>
                </label>
              </div>
              
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                gap: '12px', 
                marginTop: '8px',
                paddingTop: '20px',
                borderTop: '2px solid var(--border-primary)'
              }}>
                <button
                  onClick={() => setFormOpen(false)}
                  style={{ 
                    border: '2px solid var(--border-primary)', 
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)', 
                    borderRadius: '12px', 
                    padding: '12px 24px', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--text-secondary)'
                    e.currentTarget.style.background = 'var(--bg-tertiary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                >
                  Hủy
                </button>
                <button
                  disabled={formSubmitting}
                  onClick={submitForm}
                  style={{ 
                    border: 'none', 
                    background: formSubmitting 
                      ? 'var(--text-tertiary)' 
                      : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', 
                    color: 'white', 
                    borderRadius: '12px', 
                    padding: '12px 24px', 
                    cursor: formSubmitting ? 'not-allowed' : 'pointer', 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    opacity: formSubmitting ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: formSubmitting ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!formSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!formSubmitting) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }
                  }}
                >
                  {formSubmitting ? 'Đang lưu...' : (formMode === 'create' ? 'Tạo Trung tâm' : 'Cập nhật Trung tâm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
