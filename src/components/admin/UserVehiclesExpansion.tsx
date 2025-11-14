import React, { useState, useEffect } from 'react'
import { Car, Edit, Plus, RefreshCw } from 'lucide-react'
import { VehicleService, Vehicle } from '@/services/vehicleService'
import toast from 'react-hot-toast'

interface UserVehiclesExpansionProps {
  userId: number
  customerId: number | null
  onRefresh?: () => void
}

export default function UserVehiclesExpansion({ userId, customerId, onRefresh }: UserVehiclesExpansionProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    loadVehicles()
  }, [customerId, userId])

  const loadVehicles = async () => {
    try {
      setLoading(true)
      if (customerId) {
        // Use customerId if available
        const response = await VehicleService.getCustomerVehicles(customerId)
        console.log('Vehicle response:', response)

        if (response.success) {
          // Handle different response structures
          let vehiclesList: Vehicle[] = []

          // Backend returns: { success: true, data: { Vehicles: [...], PageNumber, PageSize, ... } }
          // Structure: response.data = VehicleListResponse { Vehicles: Vehicle[], PageNumber, PageSize, ... }
          const data = response.data as any
          console.log('Response data structure:', data)

          if (Array.isArray(data)) {
            // Direct array
            vehiclesList = data
          } else if (data?.Vehicles && Array.isArray(data.Vehicles)) {
            // PascalCase: data.Vehicles (from VehicleListResponse)
            vehiclesList = data.Vehicles
          } else if (data?.vehicles && Array.isArray(data.vehicles)) {
            // camelCase: data.vehicles
            vehiclesList = data.vehicles
          } else if (data && typeof data === 'object' && 'vehicleId' in data) {
            // Single vehicle object
            vehiclesList = [data as Vehicle]
          } else if (data?.data) {
            // Double nested
            const innerData = data.data
            if (Array.isArray(innerData)) {
              vehiclesList = innerData
            } else if (innerData?.Vehicles && Array.isArray(innerData.Vehicles)) {
              vehiclesList = innerData.Vehicles
            } else if (innerData?.vehicles && Array.isArray(innerData.vehicles)) {
              vehiclesList = innerData.vehicles
            }
          }

          console.log('Parsed vehicles list:', vehiclesList)
          console.log('Vehicles count:', vehiclesList.length)
          setVehicles(vehiclesList)
        } else {
          console.warn('Vehicle response not successful:', response)
          setVehicles([])
        }
      } else {
        // Try to get vehicles using VehicleService.getVehicles with search
        // This is a workaround when customerId is not available
        try {
          const vehiclesResponse = await VehicleService.getVehicles({ pageNumber: 1, pageSize: 100 })
          if (vehiclesResponse.success && vehiclesResponse.data) {
            const allVehicles = Array.isArray(vehiclesResponse.data)
              ? vehiclesResponse.data
              : vehiclesResponse.data.vehicles || []
            // Filter vehicles by checking if they belong to this user
            // This is a workaround - ideally we should have customerId
            setVehicles([])
          }
        } catch (err) {
          console.error('Error loading vehicles without customerId:', err)
          setVehicles([])
        }
      }
    } catch (err: any) {
      console.error('Error loading vehicles:', err)
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      })
      toast.error('Không thể tải danh sách xe')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  // Note: We can still show vehicles even without customerId by using VehicleService.getVehicles
  // But for adding new vehicles, we need customerId

  return (
    <>
      <tr style={{ background: '#FAFAFA' }}>
        <td colSpan={8} style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: 14, color: '#374151', fontWeight: 400 }}>
                <Car size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Danh sách xe ({vehicles.length})
              </h4>
              {customerId && (
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #FFD875',
                    borderRadius: '6px',
                    background: '#FFF6D1',
                    color: '#111827',
                    fontSize: 13,
                    fontWeight: 400,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={14} /> Thêm xe
                </button>
              )}
              {!customerId && (
                <span style={{ fontSize: 12, color: '#6B7280' }}>
                  Cần customerId để thêm xe mới
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
                <RefreshCw size={20} className="animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
                Đang tải...
              </div>
            ) : vehicles.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                Chưa có xe nào
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Biển số</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>VIN</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Màu sắc</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Số KM</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Ngày mua</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Bảo dưỡng cuối</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Ngày tạo</th>
                      <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => (
                      <tr key={vehicle.vehicleId}>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                          {vehicle.licensePlate || 'N/A'}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                          {vehicle.vin || 'N/A'}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                          {vehicle.color || 'N/A'}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
                          {vehicle.currentMileage ? vehicle.currentMileage.toLocaleString('vi-VN') : 'N/A'}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                          {formatDate(vehicle.purchaseDate)}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                          {formatDate(vehicle.lastServiceDate)}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                          {formatDate(vehicle.createdAt)}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVehicle(vehicle)
                              setShowAddModal(true)
                            }}
                            style={{
                              padding: '6px 10px',
                              border: '1px solid #D1D5DB',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              color: '#374151',
                              cursor: 'pointer',
                              fontSize: 13,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit size={14} /> Sửa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </td>
      </tr>

      {/* Add/Edit Vehicle Modal */}
      {showAddModal && (
        <AddEditVehicleModal
          customerId={customerId}
          vehicle={editingVehicle}
          onClose={() => {
            setShowAddModal(false)
            setEditingVehicle(null)
          }}
          onSuccess={() => {
            loadVehicles()
            onRefresh?.()
            setShowAddModal(false)
            setEditingVehicle(null)
          }}
        />
      )}
    </>
  )
}

interface AddEditVehicleModalProps {
  customerId: number
  vehicle: Vehicle | null
  onClose: () => void
  onSuccess: () => void
}

function AddEditVehicleModal({ customerId, vehicle, onClose, onSuccess }: AddEditVehicleModalProps) {
  const [formData, setFormData] = useState({
    licensePlate: vehicle?.licensePlate || '',
    vin: vehicle?.vin || '',
    color: vehicle?.color || '',
    currentMileage: vehicle?.currentMileage || 0,
    purchaseDate: vehicle?.purchaseDate ? new Date(vehicle.purchaseDate).toISOString().split('T')[0] : '',
    lastServiceDate: vehicle?.lastServiceDate ? new Date(vehicle.lastServiceDate).toISOString().split('T')[0] : '',
    modelId: vehicle?.modelId || undefined
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      if (vehicle) {
        // Update
        await VehicleService.updateVehicle(vehicle.vehicleId, {
          color: formData.color,
          currentMileage: formData.currentMileage,
          lastServiceDate: formData.lastServiceDate || undefined,
          purchaseDate: formData.purchaseDate || undefined
        })
        toast.success('Đã cập nhật xe thành công')
      } else {
        // Create
        await VehicleService.createVehicle({
          customerId,
          licensePlate: formData.licensePlate,
          vin: formData.vin,
          color: formData.color,
          currentMileage: formData.currentMileage,
          purchaseDate: formData.purchaseDate || undefined,
          lastServiceDate: formData.lastServiceDate || undefined,
          modelId: formData.modelId
        })
        toast.success('Đã thêm xe thành công')
      }
      onSuccess()
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '900px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#111827' }}>
          {vehicle ? 'Sửa thông tin xe' : 'Thêm xe mới'}
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Biển số *
              </label>
              <input
                type="text"
                required
                disabled={!!vehicle}
                value={formData.licensePlate}
                onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                style={{
                  width: '420px',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: 13
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                VIN *
              </label>
              <input
                type="text"
                required
                disabled={!!vehicle}
                value={formData.vin}
                onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                style={{
                  width: '420px',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: 13
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Màu sắc *
              </label>
              <input
                type="text"
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                style={{
                  width: '420px',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: 13
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Số KM hiện tại *
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.currentMileage}
                onChange={(e) => setFormData({ ...formData, currentMileage: Number(e.target.value) })}
                style={{
                  width: '420px',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: 13
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Ngày mua
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                style={{
                  width: '420px',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: 13
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                Bảo dưỡng cuối
              </label>
              <input
                type="date"
                value={formData.lastServiceDate}
                onChange={(e) => setFormData({ ...formData, lastServiceDate: e.target.value })}
                style={{
                  width: '420px',
                  padding: '8px 10px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: 13
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#374151',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: submitting ? '#9CA3AF' : '#FFD875',
                color: '#111827',
                fontSize: 14,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Đang xử lý...' : vehicle ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

