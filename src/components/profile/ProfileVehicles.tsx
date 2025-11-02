import { useEffect, useState, useCallback } from 'react'
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  TruckIcon,
  HashtagIcon,
  SwatchIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  ShoppingBagIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { VehicleService, type Vehicle } from '@/services/vehicleService'
import { useAppSelector } from '@/store/hooks'
import toast from 'react-hot-toast'
import AddVehicleModal from './AddVehicleModal'

interface EditVehicleData {
  color: string
  currentMileage: string
  lastServiceDate: string
}

export default function ProfileVehicles() {
  const user = useAppSelector((s) => s.auth.user)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsedVehicles, setCollapsedVehicles] = useState<Set<number>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVehicles, setEditingVehicles] = useState<Set<number>>(new Set())
  const [editData, setEditData] = useState<Record<number, EditVehicleData>>({})
  const [savingVehicles, setSavingVehicles] = useState<Set<number>>(new Set())

  const loadVehicles = useCallback(async () => {
    const customerId = user?.customerId
    
    if (!customerId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await VehicleService.getCustomerVehicles(customerId)
      
      if (response.success && response.data?.vehicles) {
        setVehicles(response.data.vehicles)
      } else {
        setVehicles([])
      }
    } catch (error: unknown) {
      const err = error as { message?: string }
      toast.error(err.message || 'Không thể tải danh sách phương tiện')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }, [user?.customerId])

  useEffect(() => {
    if (user?.customerId) {
      loadVehicles()
    } else {
      setLoading(false)
    }
  }, [loadVehicles, user?.customerId])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const toggleVehicle = (vehicleId: number) => {
    setCollapsedVehicles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId)
      } else {
        newSet.add(vehicleId)
      }
      return newSet
    })
  }

  const startEdit = (vehicle: Vehicle) => {
    setEditingVehicles((prev) => new Set(prev).add(vehicle.vehicleId))
    setEditData((prev) => ({
      ...prev,
      [vehicle.vehicleId]: {
        color: vehicle.color || '',
        currentMileage: vehicle.currentMileage?.toString() || '',
        lastServiceDate: vehicle.lastServiceDate ? vehicle.lastServiceDate.split('T')[0] : ''
      }
    }))
  }

  const cancelEdit = (vehicleId: number) => {
    setEditingVehicles((prev) => {
      const newSet = new Set(prev)
      newSet.delete(vehicleId)
      return newSet
    })
    setEditData((prev) => {
      const newData = { ...prev }
      delete newData[vehicleId]
      return newData
    })
  }

  const handleEditChange = (vehicleId: number, field: keyof EditVehicleData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        [field]: value
      }
    }))
  }

  const saveVehicle = async (vehicleId: number) => {
    const data = editData[vehicleId]
    if (!data) return

    // Validation
    if (!data.color.trim()) {
      toast.error('Vui lòng nhập màu sắc')
      return
    }
    if (!data.currentMileage || parseInt(data.currentMileage) < 0) {
      toast.error('Vui lòng nhập số km hợp lệ (≥ 0)')
      return
    }

    setSavingVehicles((prev) => new Set(prev).add(vehicleId))
    try {
      const payload = {
        color: data.color.trim(),
        currentMileage: parseInt(data.currentMileage),
        lastServiceDate: data.lastServiceDate || undefined
      }

      await VehicleService.updateVehicle(vehicleId, payload)
      toast.success('Cập nhật thông tin phương tiện thành công!')
      
      // Reload vehicles
      await loadVehicles()
      
      // Exit edit mode
      cancelEdit(vehicleId)
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      
      // Handle validation errors
      if (err.response?.status === 400 && err.response.data?.errors) {
        const backendErrors = err.response.data.errors
        let errorMessages: string[] = []
        
        Object.keys(backendErrors).forEach((field) => {
          const messages = backendErrors[field]
          if (Array.isArray(messages) && messages.length > 0) {
            errorMessages.push(...messages)
          }
        })
        
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0])
        }
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật phương tiện'
        toast.error(errorMessage)
      }
    } finally {
      setSavingVehicles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(vehicleId)
        return newSet
      })
    }
  }

  const colorOptions = [
    { value: '', label: 'Chọn màu' },
    { value: 'Đen', label: 'Đen' },
    { value: 'Trắng', label: 'Trắng' },
    { value: 'Bạc', label: 'Bạc' },
    { value: 'Xám', label: 'Xám' },
    { value: 'Đỏ', label: 'Đỏ' },
    { value: 'Xanh dương', label: 'Xanh dương' },
    { value: 'Xanh lá', label: 'Xanh lá' },
    { value: 'Vàng', label: 'Vàng' },
    { value: 'Cam', label: 'Cam' },
    { value: 'Nâu', label: 'Nâu' },
    { value: 'Tím', label: 'Tím' },
    { value: 'Hồng', label: 'Hồng' },
    { value: 'Khác', label: 'Khác' }
  ]

  if (loading) {
    return (
      <>
        <div className="profile-v2__section">
          <div className="profile-v2__empty">Đang tải...</div>
        </div>
        {modalOpen && (
          <AddVehicleModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              loadVehicles()
            }}
          />
        )}
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="profile-v2__section">
          <div className="profile-v2__empty">Vui lòng đăng nhập để xem phương tiện của bạn.</div>
        </div>
        {modalOpen && (
          <AddVehicleModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              loadVehicles()
            }}
          />
        )}
      </>
    )
  }

  if (vehicles.length === 0) {
    return (
      <>
        <div className="profile-v2__section">
          <div className="profile-v2__empty">
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
                Bạn chưa có phương tiện nào.
              </p>
              <p style={{ fontSize: '14px', color: '#999', margin: '8px 0 0 0' }}>
                Thông tin phương tiện của bạn sẽ được hiển thị tại đây.
              </p>
            </div>
          </div>
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              className="vehicle-form-add-btn"
              onClick={(e) => {
                e.stopPropagation()
                setModalOpen(true)
              }}
            >
              <PlusIcon width={18} height={18} />
              <span>Thêm phương tiện</span>
            </button>
          </div>
        </div>
        {modalOpen && (
          <AddVehicleModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSuccess={() => {
              loadVehicles()
            }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="profile-v2__section">
        <div className="profile-v2__card" style={{ padding: 16 }}>
          <div className="profile-v2__card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span>Phương tiện của tôi</span>
            <button
              type="button"
              className="vehicle-form-add-btn"
              onClick={(e) => {
                e.stopPropagation()
                setModalOpen(true)
              }}
            >
              <PlusIcon width={18} height={18} />
              <span>Thêm phương tiện</span>
            </button>
          </div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
          {vehicles.map((vehicle, index) => {
            const isCollapsed = collapsedVehicles.has(vehicle.vehicleId)
            const vehicleName = vehicle.licensePlate ? vehicle.licensePlate.toUpperCase() : `VIN: ${vehicle.vin}`
            
            // Màu sắc cho mỗi form (luân phiên)
            const colors = [
              { bg: '#FFEBB7', border: '#FFD875', inputBg: '#FFF9E6', inputBorder: '#FFE082' }, // Vàng nhạt
              { bg: '#E3F2FD', border: '#90CAF9', inputBg: '#F1F8FF', inputBorder: '#BBDEFB' }, // Xanh nhạt
              { bg: '#F3E5F5', border: '#CE93D8', inputBg: '#FCE4EC', inputBorder: '#F48FB1' }, // Tím nhạt
              { bg: '#E8F5E9', border: '#A5D6A7', inputBg: '#F1F8E9', inputBorder: '#C8E6C9' }, // Xanh lá nhạt
            ]
            const colorScheme = colors[index % colors.length]
            
            const isEditing = editingVehicles.has(vehicle.vehicleId)
            const isSaving = savingVehicles.has(vehicle.vehicleId)
            const editValues = editData[vehicle.vehicleId]
            
            return (
              <div 
                key={vehicle.vehicleId}
                style={{
                  width: '360px',
                  border: isCollapsed ? 'none' : `2px solid ${colorScheme.border}`,
                  borderRadius: '0',
                  background: isCollapsed ? 'transparent' : colorScheme.bg,
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {/* Header với icon mũi tên và tên xe */}
                <div
                  onClick={() => toggleVehicle(vehicle.vehicleId)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    background: colorScheme.border,
                    borderBottom: isCollapsed ? 'none' : `2px solid ${colorScheme.border}`,
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
          >
            {isCollapsed ? (
                    <ChevronDownIcon width={18} height={18} style={{ color: '#111827', flexShrink: 0 }} />
                  ) : (
                    <ChevronUpIcon width={18} height={18} style={{ color: '#111827', flexShrink: 0 }} />
                  )}
                  <TruckIcon width={20} height={20} style={{ color: '#111827', flexShrink: 0 }} />
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    color: '#111827',
                    flex: 1
                  }}>
                    {vehicleName}
                  </span>
                </div>

                {/* Form dọc - chỉ hiển thị khi không collapsed */}
                {!isCollapsed && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Buttons Sửa/Lưu/Hủy */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'flex-end' }}>
                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(vehicle)
                          }}
                          style={{
                            padding: '6px 12px',
                            border: `1px solid ${colorScheme.border}`,
                            borderRadius: '4px',
                            backgroundColor: '#fff',
                            color: '#374151',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <PencilSquareIcon width={14} height={14} />
                          Sửa
                        </button>
            ) : (
              <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              cancelEdit(vehicle.vehicleId)
                            }}
                            disabled={isSaving}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              backgroundColor: '#fff',
                              color: '#374151',
                              fontSize: '13px',
                              fontWeight: '500',
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              opacity: isSaving ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <XMarkIcon width={14} height={14} />
                            Hủy
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              saveVehicle(vehicle.vehicleId)
                            }}
                            disabled={isSaving}
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              borderRadius: '4px',
                              backgroundColor: colorScheme.border,
                              color: '#111827',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: isSaving ? 'not-allowed' : 'pointer',
                              opacity: isSaving ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <CheckIcon width={14} height={14} />
                            {isSaving ? 'Đang lưu...' : 'Lưu'}
                          </button>
              </>
            )}
          </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        <TruckIcon width={16} height={16} style={{ color: colorScheme.border }} />
                        Biển số xe
                      </label>
                      <div style={{ 
                        fontSize: '16px', 
                        color: '#111827',
                        padding: '8px 12px',
                        background: colorScheme.inputBg,
                        border: `1px solid ${colorScheme.inputBorder}`,
                        borderRadius: '0'
                      }}>
                        {vehicle.licensePlate ? vehicle.licensePlate.toUpperCase() : 'Chưa có'}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        <HashtagIcon width={16} height={16} style={{ color: colorScheme.border }} />
                        VIN
                      </label>
                      <div style={{ 
                        fontSize: '16px', 
                        color: '#111827',
                        padding: '8px 12px',
                        background: colorScheme.inputBg,
                        border: `1px solid ${colorScheme.inputBorder}`,
                        borderRadius: '0'
                      }}>
                        {vehicle.vin || 'Chưa có'}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        <SwatchIcon width={16} height={16} style={{ color: colorScheme.border }} />
                        Màu sắc <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {isEditing && editValues ? (
                        <select
                          value={editValues.color}
                          onChange={(e) => handleEditChange(vehicle.vehicleId, 'color', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colorScheme.inputBorder}`,
                            borderRadius: '0',
                            fontSize: '16px',
                            backgroundColor: colorScheme.inputBg
                          }}
                        >
                          {colorOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#111827',
                          padding: '8px 12px',
                          background: colorScheme.inputBg,
                          border: `1px solid ${colorScheme.inputBorder}`,
                          borderRadius: '0'
                        }}>
                          {vehicle.color || 'Chưa có'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        <ArrowPathIcon width={16} height={16} style={{ color: colorScheme.border }} />
                        Số km hiện tại <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {isEditing && editValues ? (
                        <input
                          type="number"
                          value={editValues.currentMileage}
                          onChange={(e) => handleEditChange(vehicle.vehicleId, 'currentMileage', e.target.value)}
                          min="0"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colorScheme.inputBorder}`,
                            borderRadius: '0',
                            fontSize: '16px',
                            backgroundColor: colorScheme.inputBg
                          }}
                        />
                      ) : (
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#111827',
                          padding: '8px 12px',
                          background: colorScheme.inputBg,
                          border: `1px solid ${colorScheme.inputBorder}`,
                          borderRadius: '0'
                        }}>
                          {vehicle.currentMileage !== undefined && vehicle.currentMileage !== null 
                            ? `${vehicle.currentMileage.toLocaleString('vi-VN')} km`
                            : 'Chưa có'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                        <WrenchScrewdriverIcon width={16} height={16} style={{ color: colorScheme.border }} />
                        Lần bảo dưỡng cuối
                      </label>
                      {isEditing && editValues ? (
                        <input
                          type="date"
                          value={editValues.lastServiceDate}
                          onChange={(e) => handleEditChange(vehicle.vehicleId, 'lastServiceDate', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: `1px solid ${colorScheme.inputBorder}`,
                            borderRadius: '0',
                            fontSize: '16px',
                            backgroundColor: colorScheme.inputBg
                          }}
                        />
                      ) : (
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#111827',
                          padding: '8px 12px',
                          background: colorScheme.inputBg,
                          border: `1px solid ${colorScheme.inputBorder}`,
                          borderRadius: '0'
                        }}>
                          {vehicle.lastServiceDate ? formatDate(vehicle.lastServiceDate) : 'Chưa có'}
                          </div>
                            )}
                          </div>


                    {vehicle.nextServiceDue && (
                      <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: 6, fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                          <CalendarIcon width={16} height={16} style={{ color: colorScheme.border }} />
                          Lần bảo dưỡng tiếp theo
                        </label>
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#111827',
                          padding: '8px 12px',
                          background: colorScheme.inputBg,
                          border: `1px solid ${colorScheme.inputBorder}`,
                          borderRadius: '0'
                        }}>
                          {formatDate(vehicle.nextServiceDue)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
              </div>
        </div>
      </div>
      {modalOpen && (
        <AddVehicleModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            loadVehicles()
          }}
        />
      )}
    </>
  )
}
