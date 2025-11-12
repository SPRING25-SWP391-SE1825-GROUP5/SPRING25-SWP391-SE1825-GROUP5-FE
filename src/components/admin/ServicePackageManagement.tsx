import { useState, useEffect, useRef } from 'react'
import {
  Package,
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
  DollarSign,
  CreditCard,
  Calendar,
  Tag,
  Trash2,
  Power,
  ToggleLeft,
  ToggleRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
  Settings,
  RefreshCw
} from 'lucide-react'
import './ServicePackageManagement.scss'
import {
  ServiceManagementService,
  type ServicePackage,
  type ServicePackageListParams,
  type CreateServicePackageRequest,
  type UpdateServicePackageRequest,
  type Service
} from '../../services/serviceManagementService'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import ServicePackageCreateModal from './ServicePackageCreateModal'

export default function ServicePackageManagement() {
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [packageStatus, setPackageStatus] = useState('all')
  const [sortBy, setSortBy] = useState('packageName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [openPageSizeMenu, setOpenPageSizeMenu] = useState(false)
  const pageSizeRef = useRef<HTMLDivElement | null>(null)
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [openServiceMenu, setOpenServiceMenu] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const serviceRef = useRef<HTMLDivElement | null>(null)

  // Modal states
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'update' | 'view'>('create')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [formValues, setFormValues] = useState({
    packageName: '',
    packageCode: '',
    description: '',
    serviceId: 0,
    totalCredits: 0,
    price: 0,
    discountPercent: 0,
    isActive: true,
    validFrom: '',
    validTo: ''
  })

  const [fieldErrors, setFieldErrors] = useState({
    packageName: '',
    packageCode: '',
    serviceId: '',
    totalCredits: '',
    price: ''
  })

  const [deletingPackageId, setDeletingPackageId] = useState<number | null>(null)

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedPackageDetail, setSelectedPackageDetail] = useState<ServicePackage | null>(null)

  // Stats states
  const [stats, setStats] = useState({
    totalPackages: 0,
    activePackages: 0,
    inactivePackages: 0,
    totalRevenue: 0
  })
  const [loadingStats, setLoadingStats] = useState(false)

  // Real-time validation
  const validateField = (field: string, value: string | number) => {
    const errors = { ...fieldErrors }

    switch (field) {
      case 'packageName':
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.packageName = 'Tên gói dịch vụ là bắt buộc'
        } else if (typeof value === 'string' && value.trim().length < 3) {
          errors.packageName = 'Tên gói dịch vụ phải có ít nhất 3 ký tự'
        } else {
          errors.packageName = ''
        }
        break
      case 'packageCode':
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.packageCode = 'Mã gói dịch vụ là bắt buộc'
        } else if (typeof value === 'string' && value.trim().length < 2) {
          errors.packageCode = 'Mã gói dịch vụ phải có ít nhất 2 ký tự'
        } else {
          errors.packageCode = ''
        }
        break
      case 'serviceId':
        if (!value || value === 0) {
          errors.serviceId = 'Dịch vụ là bắt buộc'
        } else {
          errors.serviceId = ''
        }
        break
      case 'totalCredits':
        if (!value || (typeof value === 'number' && value <= 0)) {
          errors.totalCredits = 'Tổng số credit phải lớn hơn 0'
        } else {
          errors.totalCredits = ''
        }
        break
      case 'price':
        if (!value || (typeof value === 'number' && value < 0)) {
          errors.price = 'Giá gói phải lớn hơn hoặc bằng 0'
        } else {
          errors.price = ''
        }
        break
    }

    setFieldErrors(errors)
  }

  const fetchServices = async () => {
    try {
      const response = await ServiceManagementService.getServices({ pageSize: 1000 })
      setServices(response.services)
    } catch (err: any) {
    }
  }

  const fetchStats = async () => {
    try {
      setLoadingStats(true)

      const packageStats = await ServiceManagementService.getPackageStats()

      setStats({
        totalPackages: packageStats.totalPackages,
        activePackages: packageStats.activePackages,
        inactivePackages: packageStats.inactivePackages,
        totalRevenue: packageStats.totalRevenue
      })
    } catch (err: any) {
      try {
        const allPackagesResponse = await ServiceManagementService.getServicePackages({ pageNumber: 1, pageSize: 1000 })
        const allPackages = allPackagesResponse?.packages || []

        const totalPackages = allPackages.length
        const activePackages = allPackages.filter(pkg => pkg.isActive).length
        const inactivePackages = totalPackages - activePackages
        const totalRevenue = allPackages.reduce((sum, pkg) => sum + pkg.price, 0)

        setStats({
          totalPackages,
          activePackages,
          inactivePackages,
          totalRevenue
        })
      } catch (fallbackErr: any) {
      }
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: ServicePackageListParams = { pageNumber: 1, pageSize: 1000 }
      if (searchTerm) params.searchTerm = searchTerm
      if (serviceId) params.serviceId = serviceId

      const response = await ServiceManagementService.getServicePackages(params)

      let allPackages = response?.packages || []

      if (packageStatus !== 'all') {
        const isActive = packageStatus === 'active'
        allPackages = allPackages.filter(pkg => pkg.isActive === isActive)
      }

      if (allPackages.length > 0) {
        allPackages = allPackages.sort((a, b) => {
          let aValue: any, bValue: any;
          switch (sortBy) {
            case 'packageName':
              aValue = a.packageName?.toLowerCase() || '';
              bValue = b.packageName?.toLowerCase() || '';
              break;
            case 'price':
              aValue = a.price || 0;
              bValue = b.price || 0;
              break;
            case 'totalCredits':
              aValue = a.totalCredits || 0;
              bValue = b.totalCredits || 0;
              break;
            case 'createdAt':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            default:
              aValue = a.packageName?.toLowerCase() || '';
              bValue = b.packageName?.toLowerCase() || '';
          }
          if (sortOrder === 'asc') {
            return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          } else {
            return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
          }
        });
      }

      const calculatedTotalPages = Math.ceil(allPackages.length / pageSize);
      setTotalPages(calculatedTotalPages);
      setTotalCount(allPackages.length);

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPackages = allPackages.slice(startIndex, endIndex);

      setPackages(paginatedPackages)
    } catch (err: any) {
      setError('Không thể tải danh sách gói dịch vụ: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setFormMode('create')
    setSelectedPackage(null)
    setFormValues({
      packageName: '',
      packageCode: '',
      description: '',
      serviceId: 0,
      totalCredits: 0,
      price: 0,
      discountPercent: 0,
      isActive: true,
      validFrom: '',
      validTo: ''
    })
    setFormError(null)
    setFieldErrors({ packageName: '', packageCode: '', serviceId: '', totalCredits: '', price: '' })
    setFormOpen(true)
  }

  const openEditForm = (pkg: ServicePackage) => {
    setFormMode('update')
    setSelectedPackage(pkg)
    setFormValues({
      packageName: pkg.packageName || '',
      packageCode: pkg.packageCode || '',
      description: pkg.description || '',
      serviceId: pkg.serviceId || 0,
      totalCredits: pkg.totalCredits || 0,
      price: pkg.price || 0,
      discountPercent: pkg.discountPercent || 0,
      isActive: pkg.isActive,
      validFrom: pkg.validFrom ? new Date(pkg.validFrom).toISOString().split('T')[0] : '',
      validTo: pkg.validTo ? new Date(pkg.validTo).toISOString().split('T')[0] : ''
    })
    setFormError(null)
    setFieldErrors({ packageName: '', packageCode: '', serviceId: '', totalCredits: '', price: '' })
    setFormOpen(true)
  }

  const submitForm = async () => {
    try {
      setFormSubmitting(true)
      setFormError(null)
      setFormOpen(false)
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      setFormError('Không thể lưu gói dịch vụ')
    } finally {
      setFormSubmitting(false)
    }
  }

  const deletePackage = async (packageId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gói dịch vụ này?')) {
      return
    }

    try {
      setDeletingPackageId(packageId)
      await ServiceManagementService.deleteServicePackage(packageId)
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      setError(`Lỗi: ${err.message || 'Không thể xóa gói dịch vụ'}`)
    } finally {
      setDeletingPackageId(null)
    }
  }

  const togglePackageStatus = async (packageId: number) => {
    try {
      const updatedPackage = await ServiceManagementService.togglePackageStatus(packageId)
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      setError(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái'}`)
    }
  }

  const activatePackage = async (packageId: number) => {
    try {
      const updatedPackage = await ServiceManagementService.activatePackage(packageId)
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      setError(`Lỗi: ${err.message || 'Không thể kích hoạt gói dịch vụ'}`)
    }
  }

  const deactivatePackage = async (packageId: number) => {
    try {
      const updatedPackage = await ServiceManagementService.deactivatePackage(packageId)
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      setError(`Lỗi: ${err.message || 'Không thể tắt gói dịch vụ'}`)
    }
  }

  const openDetailModal = async (pkg: ServicePackage) => {
    setSelectedPackage(pkg)
    setFormMode('view')
    setFormOpen(true)
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


  useEffect(() => {
    fetchPackages()
    fetchStats()
    fetchServices()
  }, [page, pageSize, searchTerm, serviceId, packageStatus, sortBy, sortOrder])

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) {
        setOpenPageSizeMenu(false)
      }
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setOpenStatusMenu(false)
      }
      if (serviceRef.current && !serviceRef.current.contains(event.target as Node)) {
        setOpenServiceMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="service-packages" style={{
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
      <div className="spm-header">
        <div>
          <h2 className="spm-title">Quản lý Gói Dịch vụ</h2>
          <p className="spm-subtitle">Quản lý và theo dõi các gói dịch vụ xe điện</p>
        </div>
        <div className="spm-actions">
          {/* Không dùng nút Làm mới theo guideline */}
        </div>
      </div>

      {/* Section: Top (toolbar like Users) */}
      <section className="spm-section spm-section--top">
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            {/* removed view mode buttons */}
            <div className="toolbar-sep"/>
            </div>
          <div className="toolbar-right" style={{flex:1}}>
            <div className="toolbar-search">
              <div className="search-wrap">
                <Search size={14} className="icon"/>
                <input placeholder="Tìm gói dịch vụ theo tên" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
              </div>
              </div>
            <div className="toolbar-actions">
              {/* removed hide/customize buttons */}
              <button type="button" className="toolbar-adduser accent-button" onClick={openCreateForm}>
                <Plus size={16}/> Thêm gói dịch vụ
              </button>
            </div>
          </div>
        </div>
        <div className="toolbar-filters">
          <div className="filter-pill" ref={statusRef} onClick={(e)=>{ e.stopPropagation(); setOpenStatusMenu(v=>!v); setOpenServiceMenu(false); }}>
            <CheckCircle size={14} className="icon" />
            <span className="label">{packageStatus==='all'?'Tất cả trạng thái':packageStatus==='active'?'Hoạt động':'Không hoạt động'}</span>
            <ChevronDownIcon className="caret" width={16} height={16} />
            {openStatusMenu && (
              <ul className="pill-menu show">
                {[
                  { value: 'all', label: 'Tất cả trạng thái' },
                  { value: 'active', label: 'Hoạt động' },
                  { value: 'inactive', label: 'Không hoạt động' }
                ].map(s => (
                  <li key={s.value} className={`pill-item ${packageStatus===s.value ? 'active' : ''}`}
                      onClick={()=>{ setPackageStatus(s.value); setPage(1); setOpenStatusMenu(false); }}>
                    {s.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="filter-pill" ref={serviceRef} onClick={(e)=>{ e.stopPropagation(); setOpenServiceMenu(v=>!v); setOpenStatusMenu(false); }}>
            <Wrench size={14} className="icon" />
            <span className="label">{serviceId ? (services.find(s=>s.id===serviceId)?.name || 'Dịch vụ') : 'Tất cả dịch vụ'}</span>
            <ChevronDownIcon className="caret" width={16} height={16} />
            {openServiceMenu && (
              <ul className="pill-menu show">
                <li className={`pill-item ${serviceId? '' : 'active'}`} onClick={()=>{ setServiceId(null); setPage(1); setOpenServiceMenu(false); }}>Tất cả dịch vụ</li>
                {services.map(s => (
                  <li key={s.id} className={`pill-item ${serviceId===s.id ? 'active' : ''}`}
                      onClick={()=>{ setServiceId(s.id); setPage(1); setOpenServiceMenu(false); }}>
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" className="toolbar-chip"><Plus size={14}/> Thêm bộ lọc</button>
        </div>
        </div>
      </section>

      {/* Stats removed */}

      {/* Section: Middle (table content) */}
      <section className="spm-section spm-section--middle">
      <div className="packages-table-wrapper">

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
            <p style={{ margin: 0, fontSize: '16px' }}>Đang tải gói dịch vụ...</p>
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
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{error}</p>
          </div>
        ) : packages.length === 0 ? (
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
              Không tìm thấy gói dịch vụ nào
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Thử thay đổi bộ lọc hoặc tạo gói dịch vụ mới
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
                  background: '#FFF7D6',
                  color: 'var(--text-primary)',
                  boxShadow: 'inset 0 -1px 0 var(--border-primary)'
                }}>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'default'
                    }}
                  >
                    <div className="th-label">
                      <input
                        type="checkbox"
                        className="table-checkbox"
                        checked={packages.length>0 && selectedIds.length===packages.length}
                        onChange={(e)=>{
                          if(e.target.checked){ setSelectedIds(packages.map(p=>p.packageId)); } else { setSelectedIds([]); }
                        }}
                      />
                      <span className="th-icon"><Package size={14}/></span><span className="th-text">Tên gói</span>
                    </div>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    <div className="th-label"><span className="th-icon"><Wrench size={14}/></span><span className="th-text">Dịch vụ</span></div>
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '14px',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'default'
                    }}
                  >
                    <div className="th-label"><span className="th-icon"><Zap size={14}/></span><span className="th-text">Credits</span></div>
                  </th>
                  <th
                    onClick={() => handleSort('price')}
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
                    <div className="th-label">
                      <span className="th-icon"><DollarSign size={14}/></span><span className="th-text">Giá</span>
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
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    <div className="th-label"><span className="th-icon"><CheckCircle size={14}/></span><span className="th-text">Trạng thái</span></div>
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    <div className="th-label"><span className="th-icon"><Settings size={14}/></span><span className="th-text">Thao tác</span></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg, index) => (
                  <tr
                    key={pkg.packageId}
                    style={{
                      borderBottom: index < packages.length - 1 ? '1px solid var(--border-primary)' : 'none',
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
                      fontWeight: 400
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          className="table-checkbox"
                          checked={selectedIds.includes(pkg.packageId)}
                          onChange={(e)=>{
                            setSelectedIds(prev=> e.target.checked ? [...new Set([...prev, pkg.packageId])] : prev.filter(id=>id!==pkg.packageId));
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 400 }}>{pkg.packageName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{pkg.packageCode}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      {pkg.serviceName}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontWeight: 400
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={14} />
                        {pkg.totalCredits}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      fontWeight: 400
                    }}>
                      <div>{new Intl.NumberFormat('vi-VN').format(pkg.price)}đ</div>
                      {pkg.discountPercent && pkg.discountPercent > 0 && (
                        <div style={{ fontSize: '12px', color: 'var(--success-600)', marginTop: '2px' }}>
                          -{pkg.discountPercent}%
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                      <div className={`status-badge ${pkg.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                        <span className="dot" /> {pkg.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'left' }}>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        justifyContent: 'flex-start',
                        alignItems: 'center'
                      }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openDetailModal(pkg); }}
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
                          title="Xem chi tiết gói dịch vụ"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); openEditForm(pkg); }}
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
                          title="Sửa gói dịch vụ"
                        >
                          <Edit size={16} />
                        </button>

                        {pkg.isActive ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); deactivatePackage(pkg.packageId); }}
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
                              e.currentTarget.style.borderColor = 'var(--error-500)'
                              e.currentTarget.style.background = 'var(--error-50)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-primary)'
                              e.currentTarget.style.background = 'var(--bg-card)'
                            }}
                            title="Vô hiệu hóa gói dịch vụ"
                          >
                            <ToggleRight size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); activatePackage(pkg.packageId); }}
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
                              e.currentTarget.style.borderColor = 'var(--success-500)'
                              e.currentTarget.style.background = 'var(--success-50)'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--border-primary)'
                              e.currentTarget.style.background = 'var(--bg-card)'
                            }}
                            title="Kích hoạt gói dịch vụ"
                          >
                            <ToggleLeft size={16} />
                          </button>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); deletePackage(pkg.packageId); }}
                          disabled={deletingPackageId === pkg.packageId}
                          style={{
                            padding: '8px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            background: deletingPackageId === pkg.packageId ? 'var(--text-tertiary)' : 'var(--bg-card)',
                            color: deletingPackageId === pkg.packageId ? 'var(--text-secondary)' : 'var(--error-600)',
                            cursor: deletingPackageId === pkg.packageId ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            opacity: deletingPackageId === pkg.packageId ? 0.7 : 1,
                            width: '36px',
                            height: '36px'
                          }}
                          onMouseEnter={(e) => {
                            if (deletingPackageId !== pkg.packageId) {
                              e.currentTarget.style.borderColor = 'var(--error-500)'
                              e.currentTarget.style.background = 'var(--error-50)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deletingPackageId !== pkg.packageId) {
                              e.currentTarget.style.borderColor = 'var(--border-primary)'
                              e.currentTarget.style.background = 'var(--bg-card)'
                            }
                          }}
                          title="Xóa gói dịch vụ"
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
      </section>

      {/* Section: Bottom (pagination controls like Users) */}
      <section className="spm-section spm-section--bottom">
      <div className="pagination-controls-bottom">
        {/* Left: Rows per page + range */}
        <div className="pagination-info">
          <span className="pagination-label">Hàng mỗi trang</span>
          <div className="page-size-pill" ref={pageSizeRef} onClick={(e) => { e.stopPropagation(); setOpenPageSizeMenu(v => !v); }}>
            <span className="value">{pageSize}</span>
            <ChevronDownIcon width={16} height={16} className="caret" />
            {openPageSizeMenu && (
              <ul className="pill-menu show">
                {[10, 15, 20, 30, 50].map(sz => (
                  <li key={sz} className={`pill-item ${pageSize === sz ? 'active' : ''}`}
                      onClick={() => { setPageSize(sz); setPage(1); setOpenPageSizeMenu(false); }}>
                    {sz}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <span className="pagination-range">
            {(() => {
              const start = (page - 1) * pageSize + 1;
              const end = start + packages.length - 1;
              return totalCount > 0 ? `${start}–${end} của ${totalCount} hàng` : `${start}–${end}`;
            })()}
                    </span>
        </div>

        {/* Right: Pagination Controls */}
        <div className="pagination-right-controls">
          <button type="button" disabled={page === 1} onClick={() => setPage(1)} className={`pager-btn ${page === 1 ? 'is-disabled' : ''}`}>
            <ChevronsLeft size={16} />
                  </button>
          <button type="button" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className={`pager-btn ${page === 1 ? 'is-disabled' : ''}`}>
            <ChevronLeft size={16} />
                  </button>
          <div className="pager-pages">
            <button type="button" onClick={() => setPage(1)} className={`pager-btn ${page === 1 ? 'is-active' : ''}`}>1</button>
            {totalPages > 2 && <button type="button" onClick={() => setPage(2)} className={`pager-btn ${page === 2 ? 'is-active' : ''}`}>2</button>}
            {totalPages > 3 && <span className="pager-ellipsis">…</span>}
            {totalPages >= 3 && <button type="button" onClick={() => setPage(totalPages)} className={`pager-btn ${page === totalPages ? 'is-active' : ''}`}>{totalPages}</button>}
          </div>
          <button type="button" disabled={page === totalPages || totalPages === 0} onClick={() => setPage((p) => p + 1)} className={`pager-btn ${page === totalPages || totalPages === 0 ? 'is-disabled' : ''}`}>
            <ChevronRight size={16} />
          </button>
          <button type="button" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(totalPages)} className={`pager-btn ${page === totalPages || totalPages === 0 ? 'is-disabled' : ''}`}>
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
      </section>

      {/* Placeholder create modal component */}
      <ServicePackageCreateModal
        open={formOpen}
        mode={formMode}
        initialData={selectedPackage ? {
          id: selectedPackage.packageId,
          packageName: selectedPackage.packageName,
          packageCode: selectedPackage.packageCode,
          description: selectedPackage.description,
          serviceId: selectedPackage.serviceId,
          totalCredits: selectedPackage.totalCredits,
          price: selectedPackage.price,
          discountPercent: selectedPackage.discountPercent,
          isActive: selectedPackage.isActive,
          validFrom: selectedPackage.validFrom ? new Date(selectedPackage.validFrom).toISOString().split('T')[0] : '',
          validTo: selectedPackage.validTo ? new Date(selectedPackage.validTo).toISOString().split('T')[0] : ''
        } : null}
        onClose={() => setFormOpen(false)}
        onSaved={async () => { setFormOpen(false); await fetchPackages(); await fetchStats(); }}
      />
    </div>
  )
}
