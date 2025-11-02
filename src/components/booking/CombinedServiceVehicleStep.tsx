import React, { useEffect, useMemo, useState } from 'react'
import { ServiceManagementService, type Service as BackendService } from '@/services/serviceManagementService'
import type { ServicePackage } from '@/services/serviceManagementService'
import { CustomerService } from '@/services/customerService'
import { VehicleService, type Vehicle } from '@/services/vehicleService'
import CreateVehicleModal from './CreateVehicleModal'
import api from '@/services/api'
import { ServiceCategoryService, type ServiceCategory } from '@/services/serviceCategoryService'
import { ServiceChecklistTemplateService, type ServiceChecklistTemplate } from '@/services/serviceChecklistTemplateService'

interface VehicleInfo {
  carModel: string
  modelId?: number // Thêm model ID để track model đã chọn
  mileage: string
  // Km gần đây người dùng nhập khi mang xe đến (tùy chọn)
  recentMileage?: string
  licensePlate: string
  year?: string
  color?: string
  brand?: string
  // Bảo dưỡng fields
  lastMaintenanceDate?: string
  // Sửa chữa fields
  vehicleCondition?: string
  repairChecklist?: string[]
  repairImages?: File[]
}

interface ServiceInfo {
  services: string[]
  notes: string
  packageId?: number
  packageCode?: string
  categoryId?: number
}

interface CombinedServiceVehicleStepProps {
  vehicleData: VehicleInfo
  serviceData: ServiceInfo
  onUpdateVehicle: (data: Partial<VehicleInfo>) => void
  onUpdateService: (data: Partial<ServiceInfo>) => void
  onNext: () => void
  onPrev: () => void
  customerInfo?: {
    fullName: string
    phone: string
    email: string
  }
  onGuestCustomerCreated?: (customerId: number) => void
}

// VehicleModel interface moved to CreateVehicleModal

const CombinedServiceVehicleStep: React.FC<CombinedServiceVehicleStepProps> = ({
  vehicleData,
  serviceData,
  onUpdateVehicle,
  onUpdateService,
  onNext,
  onPrev,
  customerInfo,
  onGuestCustomerCreated
}) => {
  const [services, setServices] = useState<BackendService[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [packagesLoading, setPackagesLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)
  // Removed vehicle models state - now handled in CreateVehicleModal
  const [openCreate, setOpenCreate] = useState(false)
  
  // Category states
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(serviceData.categoryId)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined)
  
  // Recommendation states
  const [recommendedServices, setRecommendedServices] = useState<ServiceChecklistTemplate[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  // Ràng buộc nhập liệu cho Km gần đây
  const [recentMileageError, setRecentMileageError] = useState<string | null>(null)
  
  // Get selected category name
  const selectedCategory = categories.find(c => c.categoryId === selectedCategoryId)
  
  // Check if user has selected an existing vehicle (read-only mode)
  const isVehicleSelected = !!selectedVehicleId

  // Load active categories
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true)
      try {
        const cats = await ServiceCategoryService.getActiveCategories()
        setCategories(cats)
      } catch (error) {
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])

  // Load active services (filter by category if selected)
  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true)
      try {
        const res = await ServiceManagementService.getActiveServices({ 
          pageSize: 100,
          categoryId: selectedCategoryId 
        })
        setServices(res.services || [])
      } catch (_e) {
        setServices([])
      } finally {
        setServicesLoading(false)
      }
    }
    loadServices()
  }, [selectedCategoryId])

  // Load active service packages (filter by category if selected)
  useEffect(() => {
    const loadPackages = async () => {
      setPackagesLoading(true)
      try {
        const res = await ServiceManagementService.getActiveServicePackages({ pageSize: 100 })
        
        // Filter packages by category
        let filteredPackages = res.packages || []
        if (selectedCategoryId) {
          // Get services for this category
          const categoryServices = await ServiceManagementService.getActiveServices({ 
            pageSize: 100,
            categoryId: selectedCategoryId 
          })
          const serviceIds = categoryServices.services.map(s => s.id)
          filteredPackages = filteredPackages.filter(pkg => {
            return serviceIds.includes(pkg.serviceId)
          })
        }
        setPackages(filteredPackages)
      } catch (_e) {
        setPackages([])
      } finally {
        setPackagesLoading(false)
      }
    }
    loadPackages()
  }, [selectedCategoryId])

  // Vehicle models loading moved to CreateVehicleModal

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

  const handleCategoryChange = (categoryId: number | undefined) => {
    setSelectedCategoryId(categoryId)
    onUpdateService({ categoryId, services: [], packageId: undefined, packageCode: undefined })
    // Reset recommendations when category changes
    setRecommendedServices([])
    setShowRecommendations(false)
  }

  // Function to get recommended services
  const getRecommendedServices = async () => {
    if (!vehicleData.mileage || !vehicleData.lastMaintenanceDate || !selectedCategoryId) {
      return
    }

    const currentKm = parseInt(vehicleData.mileage)
    if (isNaN(currentKm)) {
      return
    }

    setRecommendationLoading(true)
    try {
      const response = await ServiceChecklistTemplateService.getRecommendedServices({
        currentKm,
        lastMaintenanceDate: vehicleData.lastMaintenanceDate,
        categoryId: selectedCategoryId
      })
      
      setRecommendedServices(response.data)
      setShowRecommendations(true)
    } catch (error) {
      setRecommendedServices([])
    } finally {
      setRecommendationLoading(false)
    }
  }

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
    // Không cho tiếp tục nếu nhập Km gần đây < Km hiện tại
    const baseKm = Number(vehicleData.mileage || 0)
    const recentKm = Number(vehicleData.recentMileage || '')
    const invalidRecent = isVehicleSelected && !!vehicleData.recentMileage && !isNaN(recentKm) && recentKm < baseKm
    if (invalidRecent) return false
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
          <div className="form-group">
            <label>Loại dịch vụ <span className="required-star">*</span></label>
            {categoriesLoading ? (
              <div>Đang tải...</div>
            ) : (
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => handleCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
                required
              >
                <option value="">-- Chọn loại dịch vụ --</option>
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCategoryId && (
            <>
          <h3 className="csv-section-title">Chọn dịch vụ</h3>
              {servicesLoading && <div>Đang tải dịch vụ...</div>}
              {!servicesLoading && (
                <div className="service-list">
                  {services.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--csv-muted)' }}>
                      Không có dịch vụ nào trong danh mục này
                    </div>
                  ) : (
                    services.map(service => (
                      <label key={service.id} className="service-item">
                        <input
                          type="checkbox"
                          checked={serviceData.services[0] === String(service.id)}
                          onChange={() => handleServiceToggle(String(service.id))}
                        />
                        <span>{service.name}</span>
                      </label>
                    ))
                  )}
                </div>
              )}

              {/* Recommendation Section for Maintenance Category - Only show when vehicle info is complete */}
              {selectedCategory?.categoryName?.toLowerCase().includes('bảo dưỡng') && 
               vehicleData.mileage && 
               vehicleData.lastMaintenanceDate && (
                <div className="recommendation-section">
                  <div className="recommendation-header">
                    <h4 className="csv-subtitle">💡 Gợi ý dịch vụ phù hợp</h4>
                    <button
                      type="button"
                      className="btn-recommend"
                      onClick={getRecommendedServices}
                      disabled={recommendationLoading || !vehicleData.mileage || !vehicleData.lastMaintenanceDate}
                    >
                      {recommendationLoading ? 'Đang tìm...' : 'Tìm dịch vụ phù hợp'}
                    </button>
                  </div>

                  {showRecommendations && (
                    <div className="recommendation-results">
                      {recommendedServices.length === 0 ? (
                        <div className="no-recommendations">
                          <p>Không tìm thấy dịch vụ phù hợp với thông tin xe của bạn.</p>
                          <p>Vui lòng chọn dịch vụ từ danh sách trên.</p>
                        </div>
                      ) : (
                        <div className="recommended-services">
                          <p className="recommendation-message">
                            Dựa trên số km hiện tại ({vehicleData.mileage} km) và ngày bảo dưỡng cuối ({vehicleData.lastMaintenanceDate}), 
                            chúng tôi gợi ý các dịch vụ sau:
                          </p>
                          {recommendedServices.map((template, index) => (
                            <div key={template.templateId} className="recommended-service-card">
                              <div className="recommendation-badge">
                                #{index + 1} Phù hợp nhất
                              </div>
                              <div className="recommended-service-content">
                                <h5>{template.serviceName}</h5>
                                <p className="template-name">{template.templateName}</p>
                                {template.description && (
                                  <p className="template-description">{template.description}</p>
                                )}
                                <div className="recommendation-criteria">
                                  {template.minKm && (
                                    <span className="criteria-item">
                                      📏 Km tối thiểu: {template.minKm.toLocaleString()}
                                    </span>
                                  )}
                                  {template.maxDate && (
                                    <span className="criteria-item">
                                      📅 Ngày tối đa: {template.maxDate} ngày
                                    </span>
                                  )}
                                  {template.maxOverdueDays && (
                                    <span className="criteria-item">
                                      ⏰ Trễ tối đa: {template.maxOverdueDays} ngày
                                    </span>
                                  )}
                                </div>
                                
                                {/* Warnings */}
                                {template.warnings && template.warnings.length > 0 && (
                                  <div className="recommendation-warnings">
                                    {template.warnings.map((warning, warningIndex) => (
                                      <div key={warningIndex} className="warning-item">
                                        {warning}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Recommendation Reason */}
                                {template.recommendationReason && (
                                  <div className="recommendation-reason">
                                    <strong>Lý do:</strong> {template.recommendationReason}
                                  </div>
                                )}
                                <button
                                  type="button"
                                  className="btn-select-recommended"
                                  onClick={() => handleServiceToggle(String(template.serviceId))}
                                >
                                  Chọn dịch vụ này
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show instruction when maintenance category is selected but vehicle info is incomplete */}
              {selectedCategory?.categoryName?.toLowerCase().includes('bảo dưỡng') && 
               (!vehicleData.mileage || !vehicleData.lastMaintenanceDate) && (
                <div className="recommendation-instruction">
                  <div className="instruction-content">
                    <h4 className="csv-subtitle">💡 Để nhận gợi ý dịch vụ phù hợp</h4>
                    <p>Vui lòng nhập đầy đủ thông tin xe bên dưới:</p>
                    <ul>
                      <li>✅ Số km đã đi</li>
                      <li>✅ Ngày bảo dưỡng cuối</li>
                    </ul>
                    <p>Sau đó hệ thống sẽ gợi ý các dịch vụ phù hợp nhất với tình trạng xe của bạn.</p>
                  </div>
                </div>
              )}
            </>
          )}

          <h4 className="csv-subtitle">Gói dịch vụ</h4>
          {packagesLoading && <div>Đang tải gói dịch vụ...</div>}
          {!packagesLoading && packages.length === 0 && (
            <div style={{ padding: '1rem', color: 'var(--csv-muted)', textAlign: 'center' }}>
              Không có gói dịch vụ nào trong danh mục này
            </div>
          )}
          {!packagesLoading && packages.length > 0 && (
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
            <label>{selectedCategory?.categoryName?.toLowerCase().includes('sửa chữa') ? 'Tình trạng xe / ghi chú' : 'Ghi chú thêm'}</label>
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
            <label>Chọn xe có sẵn<span className="required-star">*</span></label>
            <select
              value={selectedVehicleId || ''}
              onChange={(e) => {
                const vid = Number(e.target.value)
                const v = vehicles.find(x => x.vehicleId === vid)
                if (v) {
                  setSelectedVehicleId(vid)
                  onUpdateVehicle({ 
                    licensePlate: v.licensePlate, 
                    carModel: v.vin,
                    mileage: v.currentMileage?.toString() || ''
                  })
                } else {
                  setSelectedVehicleId(undefined)
                  onUpdateVehicle({ licensePlate: '', carModel: '', mileage: '' })
                }
              }}
            >
              <option value="">—</option>
              {vehiclesLoading && <option value="" disabled>Đang tải...</option>}
              {!vehiclesLoading && vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>{v.licensePlate} — {v.vin}</option>
              ))}
            </select>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => {
                setOpenCreate(true)
                // Reset selected vehicle khi tạo xe mới
                setSelectedVehicleId(undefined)
              }} 
              style={{ marginTop: 8 }}
            >
              + Tạo xe mới
            </button>
          </div>
          {/* Model selection moved to CreateVehicleModal */}
          <div className="form-group">
            <label>Số km đã đi<span className="required-star">*</span></label>
            <input
              type="text"
              value={vehicleData.mileage}
              onChange={(e) => onUpdateVehicle({ mileage: e.target.value })}
              disabled={isVehicleSelected}
              style={{ backgroundColor: isVehicleSelected ? '#f5f5f5' : 'white' }}
            />
          </div>
          {/* Km gần đây: chỉ hiển thị khi chọn xe có sẵn, dùng để cập nhật km hiện tại */}
          {isVehicleSelected && (
            <div className="form-group">
              <label>Km gần đây (tùy chọn)</label>
              <input
                type="number"
                value={vehicleData.recentMileage || ''}
                onChange={(e) => {
                  const val = e.target.value
                  onUpdateVehicle({ recentMileage: val })
                  const base = Number(vehicleData.mileage || 0)
                  const num = Number(val)
                  if (val && !isNaN(num) && num < base) {
                    setRecentMileageError(`Km gần đây không được nhỏ hơn km hiện tại (${base.toLocaleString()} km).`)
                  } else {
                    setRecentMileageError(null)
                  }
                }}
                min={Number(vehicleData.mileage || 0)}
                aria-invalid={!!recentMileageError}
                placeholder="Nhập km khi mang xe đến"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${ isVehicleSelected ? '#e5e7eb' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#ffffff',
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
              {recentMileageError && (
                <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>{recentMileageError}</div>
              )}
            </div>
          )}
          <div className="form-group">
            <label>Biển số xe <span className="required-star">*</span></label>
            <input
              type="text"
              value={vehicleData.licensePlate}
              onChange={(e) => onUpdateVehicle({ licensePlate: e.target.value })}
              required
              disabled={isVehicleSelected}
              style={{ backgroundColor: isVehicleSelected ? '#f5f5f5' : 'white', cursor: isVehicleSelected ? 'not-allowed' : 'auto' , pointerEvents: isVehicleSelected ? 'none' : 'auto' , opacity: isVehicleSelected ? 0.5 : 1 , borderColor: isVehicleSelected ? '#e5e7eb' : 'var(--csv-border)' , borderStyle: isVehicleSelected ? 'dashed' : 'solid' , borderWidth: isVehicleSelected ? '1px' : '1px' , borderRadius: isVehicleSelected ? '10px' : '10px' , padding: isVehicleSelected ? '0.7rem .85rem' : '0.7rem .85rem' , maxWidth: isVehicleSelected ? '100%' : '100%' , transition: 'all 0.2s ease' ,}}
            />
          </div>

          {/* Fields riêng cho Bảo dưỡng */}
          {selectedCategory?.categoryName?.toLowerCase().includes('bảo dưỡng') && (
            <div className="form-group">
              <label>Ngày bảo dưỡng cuối <span className="required-star">*</span></label>
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0]
                const selectedDate = vehicleData.lastMaintenanceDate || ''
                const isFuture = !!selectedDate && selectedDate > todayStr
                return (
                  <>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => onUpdateVehicle({ lastMaintenanceDate: e.target.value })}
                      max={todayStr}
                      required
                      aria-invalid={isFuture}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: `2px solid ${ isVehicleSelected ? '#e5e7eb' : '#e5e7eb'}`,
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: '#ffffff',
                        color: '#111827',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box'
                      }}
                    />
                    {isFuture && (
                      <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                        Ngày này không thể chọn trong tương lai
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {/* Fields riêng cho Sửa chữa */}
          {selectedCategory?.categoryName?.toLowerCase().includes('sửa chữa') && (
            <>
              <div className="form-group">
                <label>Checklist sửa chữa (mỗi mục một dòng)</label>
                <textarea
                  value={vehicleData.repairChecklist?.join('\n') || ''}
                  onChange={(e) => {
                    const items = e.target.value.split('\n').filter(item => item.trim())
                    onUpdateVehicle({ repairChecklist: items })
                  }}
                  rows={4}
                  placeholder="Ví dụ:&#10;Kiểm tra hệ thống pin&#10;Kiểm tra hệ thống phanh&#10;Kiểm tra hệ thống điện"
                />
              </div>
              <div className="form-group">
                <label>Hình ảnh xe (tùy chọn)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    onUpdateVehicle({ repairImages: files })
                  }}
                />
                {vehicleData.repairImages && vehicleData.repairImages.length > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--csv-muted)' }}>
                    Đã chọn {vehicleData.repairImages.length} ảnh
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <CreateVehicleModal
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onCreated={(veh, customerId) => {
            setVehicles((list) => [veh, ...list])
            
            // Reset selected vehicle (since new vehicle was created)
            setSelectedVehicleId(undefined)
            
            // Auto-fill vehicle information from the created vehicle
            // Note: Vehicle interface has: licensePlate, vin, color, currentMileage
            // VehicleInfo interface expects: carModel, mileage, licensePlate, year?, color?, brand?
            onUpdateVehicle({ 
              licensePlate: veh.licensePlate, 
              carModel: veh.vin, // Map VIN to carModel field
              mileage: veh.currentMileage?.toString() || '',
              color: veh.color || '',
              modelId: veh.modelId || undefined
              // year and brand are not available in Vehicle interface
            })
            
            // Nếu có customerId từ guest, truyền về ServiceBookingForm
            if (customerId && onGuestCustomerCreated) {
              onGuestCustomerCreated(customerId)
            }
            
            setOpenCreate(false)
          }}
          guestCustomerInfo={customerInfo}
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
          /* Cho phép menu dropdown render ra ngoài card */
          overflow: visible;
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
        
        /* Recommendation Instruction Styles */
        .recommendation-instruction { margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 12px; }
        .instruction-content h4 { margin: 0 0 0.75rem 0; color: #92400e; }
        .instruction-content p { margin: 0.5rem 0; color: #a16207; font-size: 0.9rem; }
        .instruction-content ul { margin: 0.5rem 0; padding-left: 1.5rem; color: #a16207; }
        .instruction-content li { margin: 0.25rem 0; font-size: 0.9rem; }
        
        /* Recommendation Styles */
        .recommendation-section { margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 1px solid #bae6fd; border-radius: 12px; }
        .recommendation-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .btn-recommend { background: #0ea5e9; color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-recommend:hover:not(:disabled) { background: #0284c7; transform: translateY(-1px); }
        .btn-recommend:disabled { opacity: 0.6; cursor: not-allowed; }
        .recommendation-results { margin-top: 1rem; }
        .no-recommendations { text-align: center; padding: 1rem; color: var(--csv-muted); }
        .recommended-services { display: flex; flex-direction: column; gap: 1rem; }
        .recommended-service-card { background: white; border: 1px solid #e0f2fe; border-radius: 10px; padding: 1rem; position: relative; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1); }
        .recommendation-badge { position: absolute; top: -8px; right: 12px; background: #0ea5e9; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; }
        .recommended-service-content h5 { margin: 0 0 0.5rem 0; color: var(--csv-text); font-size: 1rem; font-weight: 700; }
        .template-name { margin: 0 0 0.5rem 0; color: var(--csv-primary); font-weight: 600; font-size: 0.9rem; }
        .template-description { margin: 0 0 0.75rem 0; color: var(--csv-muted); font-size: 0.875rem; line-height: 1.4; }
        .recommendation-criteria { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
        .criteria-item { background: #f0f9ff; color: #0369a1; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 500; }
        .btn-select-recommended { background: var(--csv-primary); color: white; border: none; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-select-recommended:hover { background: #16a34a; transform: translateY(-1px); }
        .recommendation-message { margin: 0 0 1rem 0; color: var(--csv-text); font-size: 0.9rem; line-height: 1.4; }
        .recommendation-warnings { margin: 0.75rem 0; padding: 0.75rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; }
        .warning-item { margin: 0.25rem 0; font-size: 0.85rem; line-height: 1.4; color: #92400e; }
        .recommendation-reason { margin: 0.75rem 0; padding: 0.75rem; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; font-size: 0.85rem; line-height: 1.4; color: #0369a1; }
        .required-star { color: #ef4444; margin-left: 4px; }
        
        @media (max-width: 768px) { 
          .csv-grid { grid-template-columns: 1fr; } 
          .form-actions { justify-content: stretch; }
          .recommendation-header { flex-direction: column; align-items: stretch; gap: 0.5rem; }
          .recommendation-criteria { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}

export default CombinedServiceVehicleStep


