import { useState, useEffect } from 'react'
import { 
  Car,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  Wrench,
  Gauge,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { 
  vehicleModelService, 
  VehicleModelResponse, 
  CreateVehicleModelRequest, 
  UpdateVehicleModelRequest 
} from '../../services/vehicleModelManagement'

export default function VehicleModel() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBrand, setFilterBrand] = useState('all')
  const [selectedModel, setSelectedModel] = useState<VehicleModelResponse | null>(null)
  const [showModelModal, setShowModelModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState<Partial<CreateVehicleModelRequest>>({
    modelName: '',
    brand: '',
    isActive: true
  })

  const [models, setModels] = useState<VehicleModelResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Load vehicle models from API
  const loadModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vehicleModelService.getAll()
      setModels(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách mẫu xe')

    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadModels()
  }, [])

  const brands = [
    { value: 'all', label: 'Tất cả hãng xe' },
    { value: 'Tesla', label: 'Tesla' },
    { value: 'Vinfast', label: 'Vinfast' },
    { value: 'Toyota', label: 'Toyota' },
    { value: 'Honda', label: 'Honda' },
    { value: 'Ford', label: 'Ford' },
    { value: 'BMW', label: 'BMW' },
    { value: 'Mercedes', label: 'Mercedes' }
  ]

  const filteredModels = models.filter(model => {
    const matchesSearch = model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesBrand = filterBrand === 'all' || model.brand === filterBrand
    
    return matchesSearch && matchesBrand
  })

  // Clear messages after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const stats = [
    {
      label: 'Tổng mẫu xe',
      value: models.length,
      color: 'var(--primary-500)',
      icon: Car
    },
    {
      label: 'Đang hoạt động',
      value: models.filter(m => m.isActive).length,
      color: 'var(--success-500)',
      icon: Wrench
    },
    {
      label: 'Hãng xe',
      value: new Set(models.map(m => m.brand)).size,
      color: 'var(--info-500)',
      icon: Users
    },
    {
      label: 'Ngừng hoạt động',
      value: models.filter(m => !m.isActive).length,
      color: 'var(--error-500)',
      icon: Gauge
    }
  ]

  const handleViewModel = (model: VehicleModelResponse) => {
    setSelectedModel(model)
    setShowModelModal(true)
  }

  const handleEditModel = (model: VehicleModelResponse) => {
    setFormMode('edit')
    setFormData({
      modelName: model.modelName,
      brand: model.brand,
      isActive: model.isActive
    })
    setShowFormModal(true)
  }

  const handleDeleteModel = async (model: VehicleModelResponse) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mẫu xe ${model.modelName}?`)) {
      setActionLoading(model.modelId)
      try {
        await vehicleModelService.delete(model.modelId)
        setSuccess(`Đã xóa mẫu xe ${model.modelName} thành công`)
        await loadModels() // Reload data
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể xóa mẫu xe')
      } finally {
        setActionLoading(null)
      }
    }
  }

  const handleToggleActive = async (model: VehicleModelResponse) => {
    setActionLoading(model.modelId)
    try {
      await vehicleModelService.toggleActive(model.modelId)
      setSuccess(`Đã ${model.isActive ? 'ngừng' : 'kích hoạt'} mẫu xe ${model.modelName}`)
      await loadModels() // Reload data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể thay đổi trạng thái mẫu xe')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCreateModel = () => {
    setFormMode('create')
    setFormData({
      modelName: '',
      brand: '',
      isActive: true
    })
    setShowFormModal(true)
  }

  const handleSubmitForm = async () => {
    if (!formData.modelName || !formData.brand) {
      setError('Vui lòng điền đầy đủ thông tin')
      return
    }

    setActionLoading(-1) 
    try {
      if (formMode === 'create') {
        await vehicleModelService.create(formData as CreateVehicleModelRequest)
        setSuccess('Đã thêm mẫu xe mới thành công')
      } else {
        const modelId = selectedModel?.modelId
        if (modelId) {
          await vehicleModelService.update(modelId, formData as UpdateVehicleModelRequest)
          setSuccess('Đã cập nhật mẫu xe thành công')
        }
      }
      setShowFormModal(false)
      await loadModels() // Reload data
    } catch (err: any) {
      setError(err.response?.data?.message || `Không thể ${formMode === 'create' ? 'thêm' : 'cập nhật'} mẫu xe`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '32px', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary-500)" />
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Đang tải dữ liệu...</p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '32px',
      background: 'var(--bg-secondary)',
      minHeight: '100vh',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      {/* Success/Error Messages */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          color: 'var(--success-700)',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-md)'
        }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--error-50)',
          border: '1px solid var(--error-200)',
          color: 'var(--error-700)',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-md)'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Quản lý Mẫu xe
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi các mẫu xe trong hệ thống
          </p>
        </div>
        <button
          onClick={handleCreateModel}
          style={{
            background: 'var(--primary-500)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-600)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = 'var(--shadow-md)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--primary-500)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
          }}
        >
          <Plus size={18} /> Thêm mẫu xe
        </button>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {stats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: stat.color,
                borderRadius: '8px',
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
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  {stat.label}
                </div>
                <div style={{ 
                  fontSize: '24px', 
                  fontWeight: '700', 
                  color: stat.color,
                  lineHeight: '1'
                }}>
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, hãng xe..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 16px 12px 44px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-500)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          />
        </div>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px',
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            minWidth: '160px'
          }}
        >
          {brands.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* Models Table */}
      <div style={{
        overflowX: 'auto',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ 
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Mẫu xe</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Hãng xe</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Ngày tạo</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Trạng thái</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '48px' }}>🚗</div>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                      {searchTerm ? 'Không tìm thấy mẫu xe nào' : 'Chưa có mẫu xe nào'}
                    </p>
                    {searchTerm && (
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredModels.map((model, i) => (
                <tr
                  key={model.modelId}
                  style={{
                    borderBottom: i < filteredModels.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    background: 'var(--bg-card)',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card)'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary-50)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-500)'
                      }}>
                        <Car size={20} />
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          margin: '0 0 4px 0'
                        }}>
                          {model.modelName}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          margin: 0
                        }}>
                          ID: {model.modelId}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {model.brand}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {new Date(model.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      {new Date(model.createdAt).toLocaleTimeString('vi-VN')}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: model.isActive ? 'var(--success-50)' : 'var(--error-50)',
                      color: model.isActive ? 'var(--success-700)' : 'var(--error-700)',
                      border: model.isActive ? '1px solid var(--success-200)' : '1px solid var(--error-200)'
                    }}>
                      {model.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleViewModel(model)}
                        disabled={actionLoading === model.modelId}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--info-50)',
                          cursor: actionLoading === model.modelId ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: actionLoading === model.modelId ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = 'var(--info-100)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = 'var(--info-50)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }
                        }}
                      >
                        {actionLoading === model.modelId ? (
                          <Loader2 size={16} className="animate-spin" color="var(--info-600)" />
                        ) : (
                          <Eye size={16} color="var(--info-600)" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditModel(model)}
                        disabled={actionLoading === model.modelId}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--warning-50)',
                          cursor: actionLoading === model.modelId ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: actionLoading === model.modelId ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = 'var(--warning-100)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = 'var(--warning-50)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }
                        }}
                      >
                        {actionLoading === model.modelId ? (
                          <Loader2 size={16} className="animate-spin" color="var(--warning-600)" />
                        ) : (
                          <Edit size={16} color="var(--warning-600)" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleActive(model)}
                        disabled={actionLoading === model.modelId}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: model.isActive ? 'var(--warning-50)' : 'var(--success-50)',
                          cursor: actionLoading === model.modelId ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: actionLoading === model.modelId ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = model.isActive ? 'var(--warning-100)' : 'var(--success-100)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = model.isActive ? 'var(--warning-50)' : 'var(--success-50)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }
                        }}
                      >
                        {actionLoading === model.modelId ? (
                          <Loader2 size={16} className="animate-spin" color={model.isActive ? "var(--warning-600)" : "var(--success-600)"} />
                        ) : (
                          <Gauge size={16} color={model.isActive ? "var(--warning-600)" : "var(--success-600)"} />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteModel(model)}
                        disabled={actionLoading === model.modelId}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--error-50)',
                          cursor: actionLoading === model.modelId ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: actionLoading === model.modelId ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = 'var(--error-100)'
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (actionLoading !== model.modelId) {
                            e.currentTarget.style.background = 'var(--error-50)'
                            e.currentTarget.style.transform = 'scale(1)'
                          }
                        }}
                      >
                        {actionLoading === model.modelId ? (
                          <Loader2 size={16} className="animate-spin" color="var(--error-600)" />
                        ) : (
                          <Trash2 size={16} color="var(--error-600)" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Model Detail Modal */}
      {showModelModal && selectedModel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '16px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <h3 style={{ 
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Chi tiết mẫu xe
              </h3>
              <button
                onClick={() => setShowModelModal(false)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.color = 'var(--error-600)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-500)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  <Car size={20} />
                </div>
                <div>
                  <p style={{ 
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {selectedModel.modelName}
                  </p>
                  <p style={{ 
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    {selectedModel.brand} • ID: {selectedModel.modelId}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <Users size={16} color="var(--primary-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Hãng xe</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{selectedModel.brand}</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <Gauge size={16} color="var(--success-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Trạng thái</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {selectedModel.isActive ? 'Hoạt động' : 'Ngừng hoạt động'}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <Calendar size={16} color="var(--info-600)" />
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Ngày tạo</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {new Date(selectedModel.createdAt).toLocaleDateString('vi-VN')} - {new Date(selectedModel.createdAt).toLocaleTimeString('vi-VN')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-primary)'
            }}>
              <button
                onClick={() => setShowModelModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--primary-500)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
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
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '16px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <h3 style={{ 
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {formMode === 'create' ? 'Thêm mẫu xe mới' : 'Chỉnh sửa mẫu xe'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.color = 'var(--error-600)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Tên mẫu xe *
                </label>
                <input
                  type="text"
                  value={formData.modelName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  placeholder="Nhập tên mẫu xe"
                />
              </div>
              
              <div>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: 'var(--text-primary)',
                  marginBottom: '8px'
                }}>
                  Hãng xe *
                </label>
                <select
                  value={formData.brand || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="">Chọn hãng xe</option>
                  {brands.slice(1).map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  style={{ width: '16px', height: '16px' }}
                />
                <label style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}>
                  Mẫu xe đang hoạt động
                </label>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-primary)'
            }}>
              <button
                onClick={() => setShowFormModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.borderColor = 'var(--error-200)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={actionLoading === -1}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--primary-500)',
                  color: '#fff',
                  border: 'none',
                  cursor: actionLoading === -1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  opacity: actionLoading === -1 ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  if (actionLoading !== -1) {
                    e.currentTarget.style.background = 'var(--primary-600)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (actionLoading !== -1) {
                    e.currentTarget.style.background = 'var(--primary-500)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {actionLoading === -1 ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  formMode === 'create' ? 'Thêm mẫu xe' : 'Cập nhật'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}