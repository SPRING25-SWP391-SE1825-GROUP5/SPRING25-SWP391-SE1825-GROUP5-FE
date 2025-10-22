import React, { useEffect, useMemo, useState } from 'react'
import { ServiceManagementService, type Service as BackendService } from '@/services/serviceManagementService'
import type { ServicePackage } from '@/services/serviceManagementService'
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
  packageId?: number
  packageCode?: string
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
  modelName: string
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
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)
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

  // Load active service packages
  useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true)
      try {
        const res = await ServiceManagementService.getActiveServicePackages({ pageSize: 100 })
        setPackages(res.packages || [])
      } catch (_e) {
        setPackages([])
      } finally {
        setPackagesLoading(false)
      }
    }
    loadPackages()
  }, [])

  // Load vehicle models
  useEffect(() => {
    const loadVehicleModels = async () => {
      setModelsLoading(true)
      try {
        const response = await api.get('/VehicleModel/active')
        // Extract possible nested payloads
        let raw = response.data
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
          raw = raw.data || raw.items || raw.models || raw.list || raw
        }
        const list = Array.isArray(raw) ? raw : []
        // Normalize fields from various BE shapes
        const normalized: VehicleModel[] = list.map((m: any, idx: number) => ({
          id: m.id ?? m.modelId ?? idx,
          name: m.name ?? m.modelName ?? m.vehicleModelName ?? `Model ${idx + 1}`,
          brand: m.brand ?? m.brandName ?? m.manufacturer ?? m.make ?? ''
        }))
        setVehicleModels(normalized)
      } catch (error: any) {
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
    onUpdateService({ services: newServices, packageId: undefined, packageCode: undefined })
  }

  const handleSelectPackage = (pkg: ServicePackage) => {
    const isSelected = serviceData.packageId === pkg.packageId
    onUpdateService({
      packageId: isSelected ? undefined : pkg.packageId,
      packageCode: isSelected ? undefined : (pkg as any).packageCode,
      services: []
    })
  }

  const canProceed = () => {
    return (
      (serviceData.services.length > 0 || serviceData.packageId) &&
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
      <p className="csv-subheading">Chọn dịch vụ hoặc gói dịch vụ và cung cấp thông tin xe để tiếp tục đặt lịch</p>
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

          <h4 className="csv-subtitle">Gói dịch vụ</h4>
          {packagesLoading && <div>Đang tải gói dịch vụ...</div>}
          {!packagesLoading && (
            <div className="pkg-grid">
              {packages.map(pkg => {
                const price = typeof pkg.price === 'number' ? pkg.price : Number((pkg as any).price || 0)
                const priceText = price.toLocaleString('vi-VN')
                const selected = serviceData.packageId === pkg.packageId
                return (
                  <div
                    key={pkg.packageId}
                    className={`pkg-card ${selected ? 'selected' : ''}`}
                    onClick={() => handleSelectPackage(pkg)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="pkg-head">
                      <h5 className="pkg-name">{pkg.packageName}</h5>
                      {pkg.discountPercent ? (
                        <span className="pkg-badge">-{pkg.discountPercent}%</span>
                      ) : null}
                    </div>
                    <div className="pkg-meta">
                      <span className="pkg-service">{pkg.serviceName ?? ''}</span>
                      {pkg.totalCredits ? (
                        <span className="pkg-dot">•</span>
                      ) : null}
                      {pkg.totalCredits ? (
                        <span className="pkg-credits">{pkg.totalCredits} lượt</span>
                      ) : null}
                    </div>
                    <div className="pkg-price">{priceText} VNĐ</div>
                    <div className="pkg-action">{selected ? 'Đã chọn' : 'Chọn gói'}</div>
                  </div>
                )
              })}
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
                  onUpdateVehicle({ 
                    licensePlate: v.licensePlate, 
                    carModel: v.vin,
                    mileage: v.currentMileage?.toString() || ''
                  })
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
                const displayName = model.name || `Model ${index + 1}`

                const brand = model.brand || ''
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
            // Auto-fill vehicle information from the created vehicle
            // Note: Vehicle interface has: licensePlate, vin, color, currentMileage
            // VehicleInfo interface expects: carModel, mileage, licensePlate, year?, color?, brand?
            onUpdateVehicle({ 
              licensePlate: veh.licensePlate, 
              carModel: veh.vin, // Map VIN to carModel field
              mileage: veh.currentMileage?.toString() || '',
              color: veh.color || ''
              // year and brand are not available in Vehicle interface
            })
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
        :root {
          --csv-surface: #ffffff;
          --csv-border: #e5e7eb;
          --csv-shadow: 0 6px 18px rgba(2, 6, 23, .06);
          --csv-shadow-hover: 0 12px 28px rgba(2, 6, 23, .12);
          --csv-primary: var(--progress-current, #1ec774);
          --csv-primary-50: #e6f7ef;
          --csv-text: #0f172a;
          --csv-muted: #64748b;
        }
        .combined-service-vehicle-step { background: linear-gradient(180deg, #ffffff 0%, #f6fbf8 100%); padding-bottom: .5rem; }
        .csv-title { font-size: 1.75rem; font-weight: 800; color: var(--csv-text); margin: 0 0 .25rem 0; letter-spacing: .2px; }
        .csv-subheading { margin: 0 0 1rem 0; color: var(--csv-muted); }
        .csv-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
        .card { 
          background: var(--csv-surface); 
          border: 1px solid var(--csv-border); 
          border-radius: 14px; 
          padding: 1.25rem; 
          box-shadow: var(--csv-shadow);
          box-sizing: border-box;
          overflow: hidden;
          transition: box-shadow .2s ease, transform .15s ease, border-color .2s ease;
        }
        .card:hover { box-shadow: var(--csv-shadow-hover); transform: translateY(-1px); border-color: #dbe1e8; }
        .csv-section-title { margin: 0 0 .75rem 0; font-size: 1.1rem; font-weight: 700; color: var(--csv-text); }
        .csv-subtitle { margin: .5rem 0 .5rem; font-size: .95rem; font-weight: 700; color: var(--csv-muted); }
        .service-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem 1rem; margin-bottom: 1rem; }
        .pkg-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: .5rem; }
        .service-item { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
        .service-item input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
        .service-item span { display: inline-block; padding: .5rem .75rem; border: 1px solid var(--border-primary); border-radius: 999px; background: #fff; color: var(--text-primary); transition: all .2s ease; user-select: none; }
        .service-item:hover span { box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .service-item input:checked + span { background: var(--progress-current); color: #fff; border-color: var(--progress-current); }
        .service-item input:focus-visible + span { outline: 2px solid var(--progress-current); outline-offset: 2px; }
        .pkg-card { 
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid var(--border-primary);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 6px 16px rgba(0,0,0,.06);
          cursor: pointer;
          transition: transform .15s ease, box-shadow .2s ease, border-color .2s ease;
          display: flex; flex-direction: column; gap: 6px;
        }
        .pkg-card:hover { transform: translateY(-2px); box-shadow: 0 10px 18px rgba(0,0,0,.08); }
        .pkg-card.selected { border-color: var(--progress-current); box-shadow: 0 10px 20px rgba(28, 199, 116, .18); }
        .pkg-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .pkg-name { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .pkg-badge { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 10px; font-size: .75rem; font-weight: 700; }
        .pkg-meta { display: flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: .9rem; }
        .pkg-dot { color: #cbd5e1; }
        .pkg-price { margin-top: 4px; font-weight: 800; color: var(--progress-current); letter-spacing: .2px; }
        .pkg-action { margin-top: 6px; align-self: flex-start; background: var(--primary-50, #e6f2f0); color: var(--progress-current); border: 1px solid var(--progress-current); border-radius: 8px; padding: 6px 10px; font-weight: 600; }
        @media (max-width: 768px) { .pkg-grid { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
        .form-group label { font-weight: 700; color: var(--csv-text); }
        .form-group input[type="text"], .form-group select, .form-group textarea { 
          width: 100%; 
          box-sizing: border-box;
          background: var(--csv-surface); 
          border: 1px solid var(--csv-border); 
          color: var(--csv-text); 
          border-radius: 10px; 
          padding: .7rem .85rem; 
          max-width: 100%;
          transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        }
        .form-group input[type="text"]:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--csv-primary); box-shadow: 0 0 0 4px rgba(30, 199, 116, .12); outline: none; }
        .form-actions { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
        .btn-primary { background: var(--csv-primary); color: #fff; border: 1px solid var(--csv-primary); border-radius: 10px; padding: .75rem 1.25rem; font-weight: 700; box-shadow: var(--csv-shadow); transition: transform .15s ease, box-shadow .2s ease; }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: var(--csv-shadow-hover); }
        .btn-secondary { background: #fff; color: var(--csv-text); border: 1px solid var(--csv-border); border-radius: 10px; padding: .75rem 1.1rem; font-weight: 700; }
        @media (max-width: 768px) { .csv-grid { grid-template-columns: 1fr; } .form-actions { justify-content: stretch; } }
      `}</style>
    </div>
  )
}

export default CombinedServiceVehicleStep


