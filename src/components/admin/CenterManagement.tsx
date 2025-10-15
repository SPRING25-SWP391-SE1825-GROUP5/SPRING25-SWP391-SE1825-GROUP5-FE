import { useState, useEffect } from 'react'
import { 
  Globe, 
  Edit, 
  X, 
  Plus, 
  CheckCircle, 
  Search 
} from 'lucide-react'
import { CenterService, type Center, type CenterListParams } from '../../services/centerService'

export default function CenterManagement() {
  const [centers, setCenters] = useState<Center[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [city, setCity] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  
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

  const fetchCenters = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: CenterListParams = { pageNumber: page, pageSize }
      if (searchTerm) params.searchTerm = searchTerm
      if (city) params.city = city
      
      console.log('Fetching centers with params:', params)
      console.log('Only active:', onlyActive)
      
      const response = onlyActive 
        ? await CenterService.getActiveCenters(params)
        : await CenterService.getCenters(params)
      
      console.log('Centers response:', response)
      
      if (response && response.centers) {
        setCenters(response.centers)
        console.log('Set centers:', response.centers)
      } else {
        console.warn('No centers found in response:', response)
        setCenters([])
      }
    } catch (err: any) {
      console.error('Error fetching centers:', err)
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
      
      console.log('Submitting form with data:', cleanData)

      if (formMode === 'create') {
        console.log('Creating center...')
        await CenterService.createCenter(cleanData)
        console.log('Center created successfully')
      } else {
        if (!selectedCenter) {
          setFormError('Không tìm thấy trung tâm để cập nhật')
          return
        }
        console.log('Updating center...')
        await CenterService.updateCenter(selectedCenter.centerId, cleanData)
        console.log('Center updated successfully')
      }
      
      setFormOpen(false)
      await fetchCenters()
    } catch (err: any) {
      console.error('Lỗi khi gửi form trung tâm:', err)
      
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
      console.log('Toggling center status for ID:', centerId)
      const updatedCenter = await CenterService.toggleCenterStatus(centerId)
      console.log('Center status updated successfully:', updatedCenter)
      
      // Show success message
      alert(`Trạng thái trung tâm đã được cập nhật thành công!`)
      
      // Refresh the list
      await fetchCenters()
    } catch (err: any) {
      console.error('Lỗi khi chuyển trạng thái trung tâm:', err)
      alert(`Lỗi: ${err.message || 'Không thể cập nhật trạng thái'}`)
    } finally {
      setTogglingCenterId(null)
    }
  }

  useEffect(() => {
    fetchCenters()
  }, [page, pageSize, searchTerm, city, onlyActive])

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
            Quản lý Trung tâm Dịch vụ
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi các trung tâm dịch vụ xe điện
          </p>
        </div>
        
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
            Thêm trung tâm
          </button>
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
          alignItems: 'end',

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
                placeholder="Tìm kiếm trung tâm..."
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
              Thành phố
            </label>
            <input
              placeholder="Lọc theo thành phố..."
              value={city}
              onChange={(e) => { setPage(1); setCity(e.target.value) }}
              style={{
                width: '100%',
                padding: '12px',
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

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '600', 
              color: 'var(--text-primary)', 
              marginBottom: '8px' 
            }}>
              Hiển thị
            </label>
            <select
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)) }}
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
              <option value={10}>10 mỗi trang</option>
              <option value={20}>20 mỗi trang</option>
              <option value={50}>50 mỗi trang</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: 'var(--text-primary)', 
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              padding: '12px 16px',
              background: onlyActive ? 'var(--primary-50)' : 'var(--bg-secondary)',
              border: `2px solid ${onlyActive ? 'var(--primary-500)' : 'var(--border-primary)'}`,
              borderRadius: '10px',
              transition: 'all 0.2s ease'
            }}>
              <input 
                type="checkbox" 
                checked={onlyActive} 
                onChange={(e) => { setPage(1); setOnlyActive(e.target.checked) }}
                style={{ margin: 0 }}
              />
              Chỉ hiện hoạt động
            </label>
          </div>

          <div>
            <button 
              onClick={fetchCenters}
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
              <Search size={16} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Centers List */}
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
            Danh sách Trung tâm
          </h3>
          <div style={{
            padding: '8px 16px',
            background: 'var(--primary-50)',
            color: 'var(--primary-700)',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {centers.length} trung tâm
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
            <p style={{ margin: 0, fontSize: '16px' }}>Đang tải trung tâm...</p>
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
        ) : centers.length === 0 ? (
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
              fontSize: '24px'
            }}>
              🏢
            </div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
              Không tìm thấy trung tâm nào
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Thử thay đổi bộ lọc hoặc tạo trung tâm mới
            </p>
          </div>
        ) : (
          <div style={{ overflow: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-card)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
            }}>
              <thead>
                <tr style={{
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                  color: 'white'
                }}>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    ID
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Tên trung tâm
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Địa chỉ
                  </th>
                  <th style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: 'none'
                  }}>
                    Số điện thoại
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
                    Ngày tạo
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
                {centers.map((center, index) => (
                  <tr 
                    key={center.centerId}
                    style={{
                      borderBottom: '1px solid var(--border-primary)',
                      transition: 'all 0.2s ease',
                      background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--primary-50)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'
                    }}
                  >
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      fontWeight: '600'
                    }}>
                      #{center.centerId}
                    </td>
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
                          <Globe size={16} />
                        </div>
                        {center.centerName}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      maxWidth: '300px'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {center.address}
                      </div>
                      {center.city && (
                        <div style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-tertiary)',
                          marginTop: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {center.city}
                        </div>
                      )}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                         {center.phoneNumber}
                      </div>
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
                        background: center.isActive ? 'var(--success-50)' : 'var(--error-50)',
                        color: center.isActive ? 'var(--success-700)' : 'var(--error-700)',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: `1px solid ${center.isActive ? 'var(--success-200)' : 'var(--error-200)'}`
                      }}>
                        {center.isActive ? '🟢' : '🔴'} {center.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </div>
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      fontSize: '14px',
                      color: 'var(--text-secondary)',
                      textAlign: 'center'
                    }}>
                      {new Date(center.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{
                      padding: '16px 20px',
                      textAlign: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditForm(center); }}
                          style={{
                            padding: '8px 12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            background: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--primary-500)'
                            e.currentTarget.style.background = 'var(--primary-50)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-primary)'
                            e.currentTarget.style.background = 'var(--bg-card)'
                          }}
                          title="Sửa trung tâm"
                        >
                          <Edit size={14} />
                          Sửa
                        </button>
                        
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCenterStatus(center.centerId); }}
                          disabled={togglingCenterId === center.centerId}
                          style={{
                            padding: '8px 12px',
                            border: '2px solid var(--border-primary)',
                            borderRadius: '8px',
                            background: togglingCenterId === center.centerId ? 'var(--text-tertiary)' : 'var(--bg-card)',
                            color: togglingCenterId === center.centerId ? 'var(--text-secondary)' : 'var(--text-primary)',
                            cursor: togglingCenterId === center.centerId ? 'not-allowed' : 'pointer',
                            fontSize: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            opacity: togglingCenterId === center.centerId ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (togglingCenterId !== center.centerId) {
                              e.currentTarget.style.borderColor = center.isActive ? 'var(--error-500)' : 'var(--success-500)'
                              e.currentTarget.style.background = center.isActive ? 'var(--error-50)' : 'var(--success-50)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (togglingCenterId !== center.centerId) {
                              e.currentTarget.style.borderColor = 'var(--border-primary)'
                              e.currentTarget.style.background = 'var(--bg-card)'
                            }
                          }}
                          title={center.isActive ? 'Tắt trung tâm' : 'Bật trung tâm'}
                        >
                          <CheckCircle size={14} />
                          {togglingCenterId === center.centerId ? 'Đang cập nhật...' : (center.isActive ? 'Tắt' : 'Bật')}
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
                    fontFamily: 'inherit'
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
                  marginBottom: '8px' 
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
                    outline: 'none'
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
    </div>
  )
}
