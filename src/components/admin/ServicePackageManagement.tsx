import { useState, useEffect } from 'react'
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
  RefreshCw
} from 'lucide-react'
import { 
  ServiceManagementService, 
  type ServicePackage, 
  type ServicePackageListParams,
  type CreateServicePackageRequest,
  type UpdateServicePackageRequest,
  type Service
} from '../../services/serviceManagementService'

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
  
  // Modal states
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'update'>('create')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null)
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
      console.error('Error fetching services:', err)
    }
  }

  const fetchStats = async () => {
    try {
      setLoadingStats(true)
      
      // Use the new getPackageStats method
      const packageStats = await ServiceManagementService.getPackageStats()
      
      setStats({
        totalPackages: packageStats.totalPackages,
        activePackages: packageStats.activePackages,
        inactivePackages: packageStats.inactivePackages,
        totalRevenue: packageStats.totalRevenue
      })
    } catch (err: any) {
      console.error('Error fetching stats:', err)
      // Fallback to manual calculation
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
        console.error('Error in fallback stats calculation:', fallbackErr)
      }
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchPackages = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch all packages first (without pagination)
      const params: ServicePackageListParams = { pageNumber: 1, pageSize: 1000 }
      if (searchTerm) params.searchTerm = searchTerm
      if (serviceId) params.serviceId = serviceId
      
      console.log('Fetching packages with params:', params)
      console.log('Package status:', packageStatus)
      
      // Get all packages (both active and inactive)
      const response = await ServiceManagementService.getServicePackages(params)
      
      console.log('Packages response:', response)
      
      let allPackages = response?.packages || []

      // Apply status filter
      if (packageStatus !== 'all') {
        const isActive = packageStatus === 'active'
        allPackages = allPackages.filter(pkg => pkg.isActive === isActive)
      }

      // Apply sorting to all packages
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

      // Calculate total pages
      const pageSize = 10;
      const calculatedTotalPages = Math.ceil(allPackages.length / pageSize);
      setTotalPages(calculatedTotalPages);
      
      // Apply pagination to sorted results
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPackages = allPackages.slice(startIndex, endIndex);
      
      setPackages(paginatedPackages)
    } catch (err: any) {
      console.error('Error fetching packages:', err)
      setError('Không thể tải danh sách gói dịch vụ: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const openCreateForm = () => {
    setFormMode('create')
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
      
      // Validation
      if (!formValues.packageName.trim()) {
        setFormError('Tên gói dịch vụ là bắt buộc')
        return
      }
      if (formValues.packageName.trim().length < 3) {
        setFormError('Tên gói dịch vụ phải có ít nhất 3 ký tự')
        return
      }
      
      if (!formValues.packageCode.trim()) {
        setFormError('Mã gói dịch vụ là bắt buộc')
        return
      }
      if (formValues.packageCode.trim().length < 2) {
        setFormError('Mã gói dịch vụ phải có ít nhất 2 ký tự')
        return
      }
      
      if (!formValues.serviceId || formValues.serviceId === 0) {
        setFormError('Dịch vụ là bắt buộc')
        return
      }
      
      if (!formValues.totalCredits || formValues.totalCredits <= 0) {
        setFormError('Tổng số credit phải lớn hơn 0')
        return
      }
      
      if (formValues.price < 0) {
        setFormError('Giá gói phải lớn hơn hoặc bằng 0')
        return
      }
      
      // Prepare clean data
      const cleanData = {
        packageName: formValues.packageName.trim(),
        packageCode: formValues.packageCode.trim(),
        description: formValues.description.trim() || undefined,
        serviceId: formValues.serviceId,
        totalCredits: formValues.totalCredits,
        price: formValues.price,
        discountPercent: formValues.discountPercent || undefined,
        isActive: formValues.isActive,
        validFrom: formValues.validFrom || undefined,
        validTo: formValues.validTo || undefined
      }
      
      console.log('Submitting form with data:', cleanData)

      if (formMode === 'create') {
        console.log('Creating package...')
        await ServiceManagementService.createServicePackage(cleanData as CreateServicePackageRequest)
        console.log('Package created successfully')
      } else {
        if (!selectedPackage) {
          setFormError('Không tìm thấy gói dịch vụ để cập nhật')
          return
        }
        console.log('Updating package...')
        await ServiceManagementService.updateServicePackage(selectedPackage.packageId, cleanData as UpdateServicePackageRequest)
        console.log('Package updated successfully')
      }
      
      setFormOpen(false)
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      console.error('Lỗi khi gửi form gói dịch vụ:', err)
      
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
      
      setFormError(`Không thể lưu gói dịch vụ: ${errorMessage}`)
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
      console.log('Deleting package with ID:', packageId)
      await ServiceManagementService.deleteServicePackage(packageId)
      console.log('Package deleted successfully')
      alert(`Gói dịch vụ đã được xóa thành công!`)
      
      // Refresh the list
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      console.error('Lỗi khi xóa gói dịch vụ:', err)
      alert(`Lỗi: ${err.message || 'Không thể xóa gói dịch vụ'}`)
    } finally {
      setDeletingPackageId(null)
    }
  }

  const togglePackageStatus = async (packageId: number) => {
    try {
      console.log('Toggling package status for ID:', packageId)
      const updatedPackage = await ServiceManagementService.togglePackageStatus(packageId)
      console.log('Package status updated successfully:', updatedPackage)
      
      // Show success message
      const statusText = updatedPackage.isActive ? 'kích hoạt' : 'tắt'
      alert(`Gói dịch vụ đã được ${statusText} thành công!`)
      
      // Refresh the list
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      console.error('Lỗi khi chuyển trạng thái gói dịch vụ:', err)
      alert(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái'}`)
    }
  }

  const activatePackage = async (packageId: number) => {
    try {
      console.log('Activating package for ID:', packageId)
      const updatedPackage = await ServiceManagementService.activatePackage(packageId)
      console.log('Package activated successfully:', updatedPackage)
      
      // Show success message
      alert(`Gói dịch vụ đã được kích hoạt thành công!`)
      
      // Refresh the list
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      console.error('Lỗi khi kích hoạt gói dịch vụ:', err)
      alert(`Lỗi: ${err.message || 'Không thể kích hoạt gói dịch vụ'}`)
    }
  }

  const deactivatePackage = async (packageId: number) => {
    try {
      console.log('Deactivating package for ID:', packageId)
      const updatedPackage = await ServiceManagementService.deactivatePackage(packageId)
      console.log('Package deactivated successfully:', updatedPackage)
      
      // Show success message
      alert(`Gói dịch vụ đã được tắt thành công!`)
      
      // Refresh the list
      await fetchPackages()
      await fetchStats()
    } catch (err: any) {
      console.error('Lỗi khi tắt gói dịch vụ:', err)
      alert(`Lỗi: ${err.message || 'Không thể tắt gói dịch vụ'}`)
    }
  }

  const openDetailModal = async (pkg: ServicePackage) => {
    setSelectedPackageDetail(pkg)
    setDetailModalOpen(true)
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
  }, [page, searchTerm, serviceId, packageStatus, sortBy, sortOrder])

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
            Quản lý Gói Dịch vụ
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi các gói dịch vụ xe điện
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={() => {
            fetchPackages();
            fetchStats();
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
          
          <button onClick={openCreateForm} style={{
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
            Thêm gói dịch vụ
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
        <div style={{
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
              <Package size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Tổng gói dịch vụ
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {loadingStats ? '...' : stats.totalPackages}
              </div>
            </div>
          </div>
        </div>

        <div style={{
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
              background: 'linear-gradient(135deg, var(--success-500), var(--success-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <Circle size={20} fill="currentColor" />
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Đang hoạt động
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {loadingStats ? '...' : stats.activePackages}
              </div>
            </div>
          </div>
        </div>

        <div style={{
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
              background: 'linear-gradient(135deg, var(--error-500), var(--error-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <AlertCircle size={20} fill="currentColor" />
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Ngừng hoạt động
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {loadingStats ? '...' : stats.inactivePackages}
              </div>
            </div>
          </div>
        </div>

        <div style={{
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
              background: 'linear-gradient(135deg, var(--warning-500), var(--warning-600))',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <DollarSign size={20} />
            </div>
            <div>
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>
                Tổng giá trị
              </div>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {loadingStats ? '...' : new Intl.NumberFormat('vi-VN').format(stats.totalRevenue)}đ
              </div>
            </div>
          </div>
        </div>

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
                placeholder="Tìm kiếm gói dịch vụ..."
                value={searchTerm}
                onChange={(e) => { setPage(1); setSearchTerm(e.target.value) }}
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
              Dịch vụ
            </label>
            <select
              value={serviceId || ''}
              onChange={(e) => { setPage(1); setServiceId(e.target.value ? Number(e.target.value) : null) }}
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
              <option value="">Tất cả dịch vụ</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name}
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
              Trạng thái
            </label>
            <select
              value={packageStatus}
              onChange={(e) => { setPage(1); setPackageStatus(e.target.value) }}
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
                setPage(1)
                setSearchTerm('')
                setServiceId(null)
                setPackageStatus('all')
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
              <RefreshCw size={16} />
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Packages List */}
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
              Danh sách Gói Dịch vụ
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Simple Header Pagination */}
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                style={{ 
                  padding: "6px 10px", 
                  borderRadius: "6px",
                  border: "1px solid var(--border-primary)",
                  background: page === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
                  color: page === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (page !== 1) {
                    e.currentTarget.style.background = "var(--primary-50)"
                    e.currentTarget.style.borderColor = "var(--primary-500)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== 1) {
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
                {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                style={{ 
                  padding: "6px 10px", 
                  borderRadius: "6px",
                  border: "1px solid var(--border-primary)",
                  background: page === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
                  color: page === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (page !== totalPages) {
                    e.currentTarget.style.background = "var(--primary-50)"
                    e.currentTarget.style.borderColor = "var(--primary-500)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (page !== totalPages) {
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
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <th 
                    onClick={() => handleSort('packageName')}
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
                      Tên gói
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: sortBy === 'packageName' ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {getSortIcon('packageName')}
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
                    Dịch vụ
                  </th>
                  <th 
                    onClick={() => handleSort('totalCredits')}
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
                      Credits
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        opacity: sortBy === 'totalCredits' ? 1 : 0.4,
                        transition: 'opacity 0.2s ease'
                      }}>
                        {getSortIcon('totalCredits')}
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
                          <Package size={16} />
                        </div>
                        <div>
                          <div>{pkg.packageName}</div>
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-tertiary)',
                            marginTop: '2px'
                          }}>
                            {pkg.packageCode}
                          </div>
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
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        
                        {pkg.totalCredits}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      textAlign: 'center',
                      fontWeight: '600'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      
                        {new Intl.NumberFormat('vi-VN').format(pkg.price)}đ
                      </div>
                      {pkg.discountPercent && pkg.discountPercent > 0 && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--success-600)',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px'
                        }}>
                          <Tag size={10} />
                          -{pkg.discountPercent}%
                        </div>
                      )}
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
                        background: pkg.isActive ? 'var(--success-50)' : 'var(--error-50)',
                        color: pkg.isActive ? 'var(--success-700)' : 'var(--error-700)',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${pkg.isActive ? 'var(--success-200)' : 'var(--error-200)'}`,
                        whiteSpace: 'nowrap'
                      }}>
                        {pkg.isActive ? (
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
            disabled={page === 1}
            onClick={() => setPage(1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: page === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: page === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (page !== 1) {
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
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: page === 1 ? "var(--bg-secondary)" : "var(--bg-card)",
              color: page === 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: page === 1 ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (page !== 1) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (page !== 1) {
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
              let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);
              
              if (endPage - startPage + 1 < maxVisible) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              // First page + ellipsis
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setPage(1)}
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
                    onClick={() => setPage(i)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: i === page ? "1px solid var(--primary-500)" : "1px solid var(--border-primary)",
                      background: i === page ? "var(--primary-50)" : "var(--bg-card)",
                      color: i === page ? "var(--primary-700)" : "var(--text-primary)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: i === page ? "600" : "500",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (i !== page) {
                        e.currentTarget.style.background = "var(--primary-50)"
                        e.currentTarget.style.borderColor = "var(--primary-500)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (i !== page) {
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
                    onClick={() => setPage(totalPages)}
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
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: page === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: page === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (page !== totalPages) {
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
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px",
              border: "1px solid var(--border-primary)",
              background: page === totalPages ? "var(--bg-secondary)" : "var(--bg-card)",
              color: page === totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: page === totalPages ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
            onMouseEnter={(e) => {
              if (page !== totalPages) {
                e.currentTarget.style.background = "var(--primary-50)"
                e.currentTarget.style.borderColor = "var(--primary-500)"
              }
            }}
            onMouseLeave={(e) => {
              if (page !== totalPages) {
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
            width: '700px', 
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
                  {formMode === 'create' ? 'Tạo Gói Dịch vụ Mới' : 'Cập nhật Gói Dịch vụ'}
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)' 
                }}>
                  {formMode === 'create' 
                    ? 'Thêm gói dịch vụ mới vào hệ thống' 
                    : 'Cập nhật thông tin gói dịch vụ'
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Tên gói dịch vụ <span style={{ color: 'var(--error-500)' }}>*</span>
                  </label>
                  <input
                    value={formValues.packageName}
                    onChange={(e) => {
                      setFormValues(v => ({ ...v, packageName: e.target.value }))
                      validateField('packageName', e.target.value)
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: `2px solid ${fieldErrors.packageName ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nhập tên gói dịch vụ"
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.packageName ? 'var(--error-500)' : 'var(--primary-500)'
                      e.target.style.boxShadow = fieldErrors.packageName ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.packageName ? 'var(--error-500)' : 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {fieldErrors.packageName && (
                    <div style={{ 
                      color: 'var(--error-600)', 
                      fontSize: '12px', 
                      marginTop: '4px' 
                    }}>
                      {fieldErrors.packageName}
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
                    Mã gói dịch vụ <span style={{ color: 'var(--error-500)' }}>*</span>
                  </label>
                  <input
                    value={formValues.packageCode}
                    onChange={(e) => {
                      setFormValues(v => ({ ...v, packageCode: e.target.value }))
                      validateField('packageCode', e.target.value)
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: `2px solid ${fieldErrors.packageCode ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nhập mã gói dịch vụ"
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.packageCode ? 'var(--error-500)' : 'var(--primary-500)'
                      e.target.style.boxShadow = fieldErrors.packageCode ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.packageCode ? 'var(--error-500)' : 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {fieldErrors.packageCode && (
                    <div style={{ 
                      color: 'var(--error-600)', 
                      fontSize: '12px', 
                      marginTop: '4px' 
                    }}>
                      {fieldErrors.packageCode}
                    </div>
                  )}
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
                  Mô tả
                </label>
                <textarea
                  value={formValues.description}
                  onChange={(e) => setFormValues(v => ({ ...v, description: e.target.value }))}
                  rows={3}
                  style={{ 
                    width: '100%', 
                    padding: '14px 16px', 
                    border: '2px solid var(--border-primary)', 
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
                  placeholder="Nhập mô tả gói dịch vụ"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Dịch vụ <span style={{ color: 'var(--error-500)' }}>*</span>
                  </label>
                  <select
                    value={formValues.serviceId}
                    onChange={(e) => {
                      setFormValues(v => ({ ...v, serviceId: Number(e.target.value) }))
                      validateField('serviceId', Number(e.target.value))
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: `2px solid ${fieldErrors.serviceId ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px',
                      cursor: 'pointer',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.serviceId ? 'var(--error-500)' : 'var(--primary-500)'
                      e.target.style.boxShadow = fieldErrors.serviceId ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.serviceId ? 'var(--error-500)' : 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value={0}>Chọn dịch vụ</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.serviceId && (
                    <div style={{ 
                      color: 'var(--error-600)', 
                      fontSize: '12px', 
                      marginTop: '4px' 
                    }}>
                      {fieldErrors.serviceId}
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
                    Tổng số credit <span style={{ color: 'var(--error-500)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formValues.totalCredits}
                    onChange={(e) => {
                      setFormValues(v => ({ ...v, totalCredits: Number(e.target.value) }))
                      validateField('totalCredits', Number(e.target.value))
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: `2px solid ${fieldErrors.totalCredits ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nhập tổng số credit"
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.totalCredits ? 'var(--error-500)' : 'var(--primary-500)'
                      e.target.style.boxShadow = fieldErrors.totalCredits ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.totalCredits ? 'var(--error-500)' : 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {fieldErrors.totalCredits && (
                    <div style={{ 
                      color: 'var(--error-600)', 
                      fontSize: '12px', 
                      marginTop: '4px' 
                    }}>
                      {fieldErrors.totalCredits}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Giá gói <span style={{ color: 'var(--error-500)' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formValues.price}
                    onChange={(e) => {
                      setFormValues(v => ({ ...v, price: Number(e.target.value) }))
                      validateField('price', Number(e.target.value))
                    }}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: `2px solid ${fieldErrors.price ? 'var(--error-500)' : 'var(--border-primary)'}`, 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nhập giá gói (VNĐ)"
                    onFocus={(e) => {
                      e.target.style.borderColor = fieldErrors.price ? 'var(--error-500)' : 'var(--primary-500)'
                      e.target.style.boxShadow = fieldErrors.price ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = fieldErrors.price ? 'var(--error-500)' : 'var(--border-primary)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                  {fieldErrors.price && (
                    <div style={{ 
                      color: 'var(--error-600)', 
                      fontSize: '12px', 
                      marginTop: '4px' 
                    }}>
                      {fieldErrors.price}
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
                    Phần trăm giảm giá (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formValues.discountPercent}
                    onChange={(e) => setFormValues(v => ({ ...v, discountPercent: Number(e.target.value) }))}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: '2px solid var(--border-primary)', 
                      borderRadius: '12px', 
                      background: 'var(--bg-secondary)', 
                      color: 'var(--text-primary)', 
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    placeholder="Nhập phần trăm giảm giá"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Có hiệu lực từ
                  </label>
                  <input
                    type="date"
                    value={formValues.validFrom}
                    onChange={(e) => setFormValues(v => ({ ...v, validFrom: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: '2px solid var(--border-primary)', 
                      borderRadius: '12px', 
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

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    color: 'var(--text-primary)', 
                    marginBottom: '8px' 
                  }}>
                    Có hiệu lực đến
                  </label>
                  <input
                    type="date"
                    value={formValues.validTo}
                    onChange={(e) => setFormValues(v => ({ ...v, validTo: e.target.value }))}
                    style={{ 
                      width: '100%', 
                      padding: '14px 16px', 
                      border: '2px solid var(--border-primary)', 
                      borderRadius: '12px', 
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
                    <div>Gói dịch vụ đang hoạt động</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {formValues.isActive ? 'Gói dịch vụ sẽ hoạt động ngay' : 'Gói dịch vụ sẽ bị tạm ngừng hoạt động'}
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
                  {formSubmitting ? 'Đang lưu...' : (formMode === 'create' ? 'Tạo Gói Dịch vụ' : 'Cập nhật Gói Dịch vụ')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModalOpen && selectedPackageDetail && (
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
                  Chi tiết Gói Dịch vụ
                </h3>
                <p style={{ 
                  margin: 0, 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)' 
                }}>
                  {selectedPackageDetail.packageName}
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

            {/* Package Info */}
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
                Thông tin Gói Dịch vụ
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tên gói</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.packageName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mã gói</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.packageCode}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dịch vụ</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.serviceName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tổng credits</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.totalCredits}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Giá</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {new Intl.NumberFormat('vi-VN').format(selectedPackageDetail.price)}đ
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Giảm giá</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.discountPercent ? `${selectedPackageDetail.discountPercent}%` : 'Không có'}
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
                    background: selectedPackageDetail.isActive ? 'var(--success-50)' : 'var(--error-50)',
                    color: selectedPackageDetail.isActive ? 'var(--success-700)' : 'var(--error-700)',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: `1px solid ${selectedPackageDetail.isActive ? 'var(--success-200)' : 'var(--error-200)'}`
                  }}>
                    {selectedPackageDetail.isActive ? (
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
                    {new Date(selectedPackageDetail.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Có hiệu lực từ</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.validFrom 
                      ? new Date(selectedPackageDetail.validFrom).toLocaleDateString('vi-VN')
                      : 'Không xác định'
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Có hiệu lực đến</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.validTo 
                      ? new Date(selectedPackageDetail.validTo).toLocaleDateString('vi-VN')
                      : 'Không giới hạn'
                    }
                  </div>
                </div>
              </div>
              {selectedPackageDetail.description && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Mô tả</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedPackageDetail.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
