import React, { useEffect, useMemo, useState } from 'react'
import { ServiceManagementService, type Service as BackendService } from '@/services/serviceManagementService'
import { CustomerService } from '@/services/customerService'
import { VehicleService, type Vehicle } from '@/services/vehicleService'
import CreateVehicleModal from './CreateVehicleModal'
import api from '@/services/api'

interface VehicleInfo {
  carModel: string
  mileage: string
  licensePlate: string
  year?: string
  color?: string
  brand?: string
}

interface ServiceInfo {
  services: string[]
  notes: string
}

interface CombinedServiceVehicleStepProps {
  vehicleData: VehicleInfo
  serviceData: ServiceInfo
  onUpdateVehicle: (data: Partial<VehicleInfo>) => void
  onUpdateService: (data: Partial<ServiceInfo>) => void
  onNext: () => void
  onPrev: () => void
}

interface VehicleModel {
  id: number
  name: string
  brand: string
}

const CombinedServiceVehicleStep: React.FC<CombinedServiceVehicleStepProps> = ({
  vehicleData,
  serviceData,
  onUpdateVehicle,
  onUpdateService,
  onNext,
  onPrev
}) => {
  const [services, setServices] = useState<BackendService[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  // Load active services
  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true)
      try {
        const res = await ServiceManagementService.getActiveServices({ pageSize: 100 })
        setServices(res.services || [])
      } catch (_e) {
        setServices([])
      } finally {
        setServicesLoading(false)
      }
    }
    loadServices()
  }, [])

  // Load vehicle models
  useEffect(() => {
    const loadVehicleModels = async () => {
      setModelsLoading(true)
      try {
        console.log('Fetching vehicle models from /VehicleModel/active...')
        const response = await api.get('/VehicleModel/active')
        console.log('Vehicle models response:', response.data)
        console.log('Response type:', typeof response.data)
        console.log('Is array:', Array.isArray(response.data))
        console.log('First item:', response.data?.[0])
        
        // Check if data is nested
        let models = response.data
        if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Try common nested structures
          models = response.data.data || response.data.models || response.data.items || response.data
          console.log('Extracted models from nested structure:', models)
        }
        
        console.log('Final models array:', models)
        console.log('Models length:', models?.length)
        setVehicleModels(models || [])
      } catch (error: any) {
        console.error('Error fetching vehicle models:', error)
        console.error('Error details:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          message: error?.message
        })
        setVehicleModels([])
      } finally {
        setModelsLoading(false)
      }
    }
    loadVehicleModels()
  }, [])

  // Load current customer's vehicles
  useEffect(() => {
    const loadVehicles = async () => {
      setVehiclesLoading(true)
      try {
        const me = await CustomerService.getCurrentCustomer()
        const customerId = me?.data?.customerId
        if (customerId) {
          const v = await VehicleService.getCustomerVehicles(customerId)
          setVehicles(v?.data?.vehicles || [])
        } else {
          setVehicles([])
        }
      } catch (_e) {
        setVehicles([])
      } finally {
        setVehiclesLoading(false)
      }
    }
    loadVehicles()
  }, [])

  const handleServiceToggle = (serviceId: string) => {
    // Single-select behavior (radio-like): keep at most one service
    const isSelected = serviceData.services[0] === serviceId
    const newServices = isSelected ? [] : [serviceId]
    onUpdateService({ services: newServices })
  }

  const canProceed = () => {
    return (
      serviceData.services.length > 0 &&
      !!vehicleData.carModel &&
      !!vehicleData.licensePlate
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canProceed()) onNext()
  }

  return (
    <div className="combined-service-vehicle-step">
      <h2 className="csv-title">Dịch vụ & Thông tin xe</h2>
      <form onSubmit={handleSubmit} className="csv-grid">
        <div className="csv-section card">
          <h3 className="csv-section-title">Chọn dịch vụ</h3>
          {servicesLoading && <div>Đang tải dịch vụ...</div>}
          {!servicesLoading && (
            <div className="service-list">
              {services.map(service => (
                <label key={service.id} className="service-item">
                  <input
                    type="checkbox"
                    checked={serviceData.services[0] === String(service.id)}
                    onChange={() => handleServiceToggle(String(service.id))}
                  />
                  <span>{service.name}</span>
                </label>
              ))}
            </div>
          )}
          <div className="form-group">
            <label>Ghi chú thêm</label>
            <textarea
              value={serviceData.notes}
              onChange={(e) => onUpdateService({ notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="csv-section card">
          <h3 className="csv-section-title">Thông tin xe</h3>
          {/* Select existing vehicle to autofill */}
          <div className="form-group">
            <label>Chọn xe có sẵn</label>
            <select
              value={vehicles.find(v => v.licensePlate === vehicleData.licensePlate)?.vehicleId || ''}
              onChange={(e) => {
                const vid = Number(e.target.value)
                const v = vehicles.find(x => x.vehicleId === vid)
                if (v) {
                  onUpdateVehicle({ licensePlate: v.licensePlate, carModel: v.vin })
                }
              }}
            >
              <option value="">—</option>
              {vehiclesLoading && <option value="" disabled>Đang tải...</option>}
              {!vehiclesLoading && vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>{v.licensePlate} — {v.vin}</option>
              ))}
            </select>
            <button type="button" className="btn-secondary" onClick={() => setOpenCreate(true)} style={{ marginTop: 8 }}>+ Tạo xe mới</button>
          </div>
          <div className="form-group">
            <label>Dòng xe *</label>
            <select
              value={vehicleData.carModel}
              onChange={(e) => onUpdateVehicle({ carModel: e.target.value })}
              required
              disabled={modelsLoading}
            >
              <option value="">
                {modelsLoading ? 'Đang tải...' : 'Chọn dòng xe'}
              </option>
              {vehicleModels.map((model, index) => {
                console.log(`Model ${index}:`, model)
                console.log(`Model ${index} name:`, model.name)
                console.log(`Model ${index} brand:`, model.brand)
                console.log(`Model ${index} id:`, model.id)
                
                const displayName = model.name || model.modelName || model.title || `Model ${index + 1}`
                const brand = model.brand || model.brandName || ''
                
                return (
                  <option key={model.id || `model-${index}`} value={displayName}>
                    {displayName}{brand ? ` (${brand})` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="form-group">
            <label>Số km đã đi</label>
            <input
              type="text"
              value={vehicleData.mileage}
              onChange={(e) => onUpdateVehicle({ mileage: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Biển số xe *</label>
            <input
              type="text"
              value={vehicleData.licensePlate}
              onChange={(e) => onUpdateVehicle({ licensePlate: e.target.value })}
              required
            />
          </div>
        </div>

        <CreateVehicleModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={(veh) => {
            setVehicles((list) => [veh, ...list])
            onUpdateVehicle({ licensePlate: veh.licensePlate, carModel: veh.vin })
            setOpenCreate(false)
          }}
        />

        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary" disabled={!canProceed()}>
            Tiếp theo
          </button>
        </div>
      </form>

      <style>{`
        .csv-title { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 1.25rem 0; }
        .csv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .card { background: var(--bg-card); border: 1px solid var(--border-primary); border-radius: 12px; padding: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,.04); }
        .csv-section-title { margin: 0 0 .75rem 0; font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
        .service-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem 1rem; margin-bottom: 1rem; }
        .service-item { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
        .service-item input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
        .service-item span { display: inline-block; padding: .5rem .75rem; border: 1px solid var(--border-primary); border-radius: 999px; background: #fff; color: var(--text-primary); transition: all .2s ease; user-select: none; }
        .service-item:hover span { box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .service-item input:checked + span { background: var(--progress-current); color: #fff; border-color: var(--progress-current); }
        .service-item input:focus-visible + span { outline: 2px solid var(--progress-current); outline-offset: 2px; }
        .form-group { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
        .form-group input[type="text"], .form-group select, .form-group textarea { width: 100%; background: #fff; border: 1px solid var(--border-primary); color: var(--text-primary); border-radius: 8px; padding: .6rem .75rem; }
        .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
        @media (max-width: 768px) { .csv-grid { grid-template-columns: 1fr; } .form-actions { justify-content: stretch; } }
      `}</style>
    </div>
  )
}

export default CombinedServiceVehicleStep


