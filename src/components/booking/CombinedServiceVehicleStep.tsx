import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ServiceManagementService, type Service as BackendService, type Service } from '@/services/serviceManagementService'
import type { ServicePackage } from '@/services/serviceManagementService'
import { CustomerService } from '@/services/customerService'
import { VehicleService, type Vehicle } from '@/services/vehicleService'
import CreateVehicleModal from './CreateVehicleModal'
import api from '@/services/api'
import { ServiceCategoryService, type ServiceCategory } from '@/services/serviceCategoryService'
import { ServiceChecklistTemplateService, type ServiceChecklistTemplate } from '@/services/serviceChecklistTemplateService'
import { vehicleModelService, type VehicleModelResponse } from '@/services/vehicleModelManagement'
import ServiceDetailModal from '@/components/common/ServiceDetailModal'
// Ảnh dự phòng nếu không có ảnh model trong public/vehicle-models
import fallbackVehicleImg from '@/assets/images/dich-vu-sua-chua-chung-vinfast_0.webp'

// Cloudinary helpers: dựng URL theo modelId nếu có cấu hình
const CLOUD_NAME = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
const CLOUD_FOLDER = ((import.meta as any).env?.VITE_CLOUDINARY_MODEL_FOLDER as string | undefined) || 'vehicle-models'
const buildModelImageUrl = (modelId?: number) => {
  if (!modelId || !CLOUD_NAME) return undefined
  // ví dụ: https://res.cloudinary.com/<cloud>/image/upload/vehicle-models/123.webp
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${CLOUD_FOLDER}/${modelId}.webp`
}

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
  purchaseDate?: string // Ngày mua xe (dùng khi chưa bảo dưỡng)
  hasMaintenanceHistory?: boolean // Đã bảo dưỡng chưa?
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
  // Map modelId -> imageUrl
  const [modelImages, setModelImages] = useState<Record<number, string>>({})
  // Map vehicleId -> modelId (dùng khi API danh sách xe không có modelId)
  const [vehicleModelMap, setVehicleModelMap] = useState<Record<number, number>>({})
  
  // Category states
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(serviceData.categoryId)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined)
  const vehicleScrollerRef = useRef<HTMLDivElement | null>(null)
  const [vehicleIndex, setVehicleIndex] = useState(0)
  useEffect(() => {
    // đảm bảo index hợp lệ khi danh sách thay đổi
    if (!vehicles || vehicles.length === 0) {
      setVehicleIndex(0)
    } else if (vehicleIndex >= vehicles.length) {
      setVehicleIndex(vehicles.length - 1)
    }
  }, [vehicles, vehicleIndex])
  const showPrevVehicle = () => {
    if (!vehicles || vehicles.length === 0) return
    setVehicleIndex((prev) => (prev - 1 + vehicles.length) % vehicles.length)
  }
  const showNextVehicle = () => {
    if (!vehicles || vehicles.length === 0) return
    setVehicleIndex((prev) => (prev + 1) % vehicles.length)
  }
  
  // Recommendation states
  const [recommendedServices, setRecommendedServices] = useState<ServiceChecklistTemplate[]>([])
  const [recommendationLoading, setRecommendationLoading] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceChecklistTemplate | null>(null)
  // Modal chi tiết dịch vụ (có checklist)
  const [isServiceDetailOpen, setIsServiceDetailOpen] = useState(false)
  const [detailService, setDetailService] = useState<Service | null>(null)
  const [loadingDetailService, setLoadingDetailService] = useState(false)
  // Ràng buộc nhập liệu cho Km gần đây
  const [recentMileageError, setRecentMileageError] = useState<string | null>(null)
  
  // Get selected category name
  const selectedCategory = categories.find(c => c.categoryId === selectedCategoryId)
  
  // Check if user has selected an existing vehicle (read-only mode)
  const isVehicleSelected = !!selectedVehicleId
  
  // Hàm tính điểm phù hợp cho dịch vụ
  const calculateServiceScore = useCallback((template: ServiceChecklistTemplate, currentKm: number, daysSinceMaintenance: number): number => {
    let score = 0
    
    // Điểm dựa trên minKm (ưu tiên dịch vụ có minKm gần với currentKm nhất)
    if (template.minKm !== undefined) {
      if (template.minKm <= currentKm) {
        // Dịch vụ phù hợp: minKm <= currentKm
        
        // Ưu tiên dịch vụ có minKm cao hơn khi currentKm cao
        // Ví dụ: với currentKm = 99999, dịch vụ có minKm = 5000 sẽ phù hợp hơn minKm = 0
        if (currentKm > 10000) {
          // Với xe đã đi nhiều km (> 10000), ưu tiên dịch vụ có minKm cao hơn
          // Điểm dựa trên tỷ lệ minKm / currentKm (càng gần 1 càng tốt)
          const minKmRatio = template.minKm / currentKm
          if (minKmRatio < 0.1) {
            // minKm quá thấp (< 10% currentKm), trừ điểm lớn
            score -= 4000
          } else {
            // Điểm tăng theo minKmRatio (minKm càng cao càng tốt)
            score += 1000 * minKmRatio // Tối đa 1000 điểm khi minKm = currentKm
          }
        } else {
          // Với xe mới (< 10000 km), ưu tiên dịch vụ có minKm thấp hơn
          const kmDiff = currentKm - template.minKm
          const ratio = kmDiff / currentKm
          score += 1000 * (1 - Math.min(ratio, 1)) // Tối đa 1000 điểm khi kmDiff = 0
        }
      } else {
        // Dịch vụ không phù hợp: minKm > currentKm (xe chưa đủ km)
        score -= 5000 // Trừ điểm lớn để đẩy xuống cuối
      }
    }
    
    // Điểm dựa trên maxDate (dịch vụ có maxDate >= daysSinceMaintenance và gần daysSinceMaintenance nhất)
    if (template.maxDate !== undefined) {
      if (template.maxDate >= daysSinceMaintenance) {
        // Dịch vụ phù hợp: maxDate >= daysSinceMaintenance
        // Điểm = 500 - (maxDate - daysSinceMaintenance) / 10 (càng gần daysSinceMaintenance càng cao điểm)
        const dayDiff = template.maxDate - daysSinceMaintenance
        score += 500 - Math.min(dayDiff / 10, 500) // Tối đa 500 điểm
      } else {
        // Dịch vụ không phù hợp: maxDate < daysSinceMaintenance (đã quá hạn)
        score -= 2000 // Trừ điểm để đẩy xuống
      }
    }
    
    // Ưu tiên recommendationRank từ backend nếu có (rank cao hơn = điểm cao hơn)
    if (template.recommendationRank !== undefined) {
      score += (100 - template.recommendationRank) * 10 // Rank 1 = +900 điểm, Rank 2 = +800 điểm, ...
    }
    
    return score
  }, [])
  
  // Sắp xếp lại danh sách đề xuất: dịch vụ được chọn sẽ lên đầu, sau đó sắp xếp theo logic phù hợp
  const sortedRecommendedServices = useMemo(() => {
    if (!recommendedServices.length) return []
    
    // Lấy thông tin km và ngày để tính toán
    const mileageToUse = vehicleData.recentMileage || vehicleData.mileage
    const currentKm = mileageToUse ? parseInt(mileageToUse) : 0
    const dateToUse = vehicleData.hasMaintenanceHistory 
      ? vehicleData.lastMaintenanceDate 
      : vehicleData.purchaseDate
    
    // Tính số ngày đã trôi qua từ ngày bảo dưỡng cuối/ngày mua xe
    let daysSinceMaintenance = 0
    if (dateToUse) {
      const lastDate = new Date(dateToUse)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      lastDate.setHours(0, 0, 0, 0)
      daysSinceMaintenance = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    }
    
    // Tạo bản sao để sắp xếp
    const servicesToSort = [...recommendedServices]
    
    // Sắp xếp theo logic phù hợp:
    // 1. Dịch vụ có minKm <= currentKm và gần currentKm nhất (ưu tiên dịch vụ phù hợp với km hiện tại)
    // 2. Dịch vụ có maxDate >= daysSinceMaintenance và gần daysSinceMaintenance nhất
    // 3. Ưu tiên recommendationRank từ backend nếu có
    servicesToSort.sort((a, b) => {
      // Tính điểm phù hợp cho từng dịch vụ
      const scoreA = calculateServiceScore(a, currentKm, daysSinceMaintenance)
      const scoreB = calculateServiceScore(b, currentKm, daysSinceMaintenance)
      
      // Sắp xếp giảm dần theo điểm (điểm cao hơn = phù hợp hơn)
      return scoreB - scoreA
    })
    
    // Nếu có dịch vụ được chọn, đưa lên đầu
    const selectedServiceId = serviceData.services[0] ? Number(serviceData.services[0]) : null
    if (selectedServiceId) {
      const selected = servicesToSort.find(t => t.serviceId === selectedServiceId)
      const others = servicesToSort.filter(t => t.serviceId !== selectedServiceId)
      return selected ? [selected, ...others] : servicesToSort
    }
    
    return servicesToSort
  }, [recommendedServices, serviceData.services, vehicleData.recentMileage, vehicleData.mileage, vehicleData.hasMaintenanceHistory, vehicleData.lastMaintenanceDate, vehicleData.purchaseDate, calculateServiceScore])
  
  // Validate lại recentMileage khi mileage thay đổi
  useEffect(() => {
    if (isVehicleSelected && vehicleData.recentMileage) {
      const baseKm = Number(vehicleData.mileage || 0)
      const recentKm = Number(vehicleData.recentMileage)
      if (!isNaN(baseKm) && !isNaN(recentKm)) {
        if (recentKm < baseKm) {
          setRecentMileageError(`Số Km gần đây không được nhỏ hơn Số Km hiện tại (${baseKm.toLocaleString()} km).`)
        } else {
          setRecentMileageError(null)
        }
      }
    }
  }, [vehicleData.mileage, vehicleData.recentMileage, isVehicleSelected])

  // Load active categories
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true)
      try {
        const cats = await ServiceCategoryService.getActiveCategories()
        setCategories(cats)
        
        // Tự động chọn category "bảo dưỡng" làm mặc định
        if (cats.length > 0) {
          const maintenanceCategory = cats.find(cat => 
            cat.categoryName?.toLowerCase().includes('bảo dưỡng')
          )
          if (maintenanceCategory) {
            setSelectedCategoryId(maintenanceCategory.categoryId)
            onUpdateService({ categoryId: maintenanceCategory.categoryId, services: [], packageId: undefined, packageCode: undefined })
          }
        }
      } catch (error) {
        setCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Load active vehicle models to map imageUrl by modelId
  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await vehicleModelService.getActive()
        const models: VehicleModelResponse[] = Array.isArray(res)
          ? res
          : (res as any)?.data || (res as any)?.items || []
        const map: Record<number, string> = {}
        ;(models || []).forEach((m: VehicleModelResponse) => {
          if (m?.modelId && (m as any)?.imageUrl) map[m.modelId] = (m as any).imageUrl as string
        })
        setModelImages(map)
      } catch (_e) {
        setModelImages({})
      }
    }
    loadModels()
  }, [])

  // Sau khi load danh sách xe, đảm bảo có ảnh cho từng modelId bằng cách gọi getById
  useEffect(() => {
    const ensureModelImages = async () => {
      const ids = Array.from(
        new Set(
          (vehicles || [])
            .map(v => v.modelId || vehicleModelMap[v.vehicleId as number])
            .filter(Boolean)
        )
      ) as number[]
      if (ids.length === 0) return
      const newMap: Record<number, string> = { ...modelImages }
      const fetchIds: number[] = ids.filter(id => !newMap[id])
      if (fetchIds.length === 0) return
      try {
        const results = await Promise.all(
          fetchIds.map(async (id) => {
            try {
              const m = await vehicleModelService.getById(id)
              return m
            } catch {
              return null
            }
          })
        )
        results.forEach((m) => {
          if (m && (m as any).modelId && (m as any).imageUrl) {
            newMap[(m as any).modelId as number] = (m as any).imageUrl as string
          }
        })
        setModelImages(newMap)
      } catch {
        // ignore
      }
    }
    ensureModelImages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, vehicleModelMap])

  // Khi danh sách xe không có modelId, gọi chi tiết từng xe để lấy modelId
  useEffect(() => {
    const enrichVehiclesWithModel = async () => {
      const missing = (vehicles || []).filter(v => !v.modelId && v.vehicleId)
      if (missing.length === 0) return
      try {
        const results = await Promise.all(
          missing.map(async (v) => {
            try {
              const detail = await VehicleService.getVehicleById(Number(v.vehicleId))
              return { id: v.vehicleId as number, modelId: (detail as any)?.data?.modelId ?? (detail as any)?.modelId }
            } catch {
              return { id: v.vehicleId as number, modelId: undefined }
            }
          })
        )
        const map: Record<number, number> = { ...vehicleModelMap }
        results.forEach(r => { if (r.modelId) map[r.id] = Number(r.modelId) })
        setVehicleModelMap(map)
      } catch {
        // ignore
      }
    }
    enrichVehiclesWithModel()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles])

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
    // Reset maintenance history question when category changes to non-maintenance
    const newCategory = categoryId ? categories.find(c => c.categoryId === categoryId) : undefined
    if (!newCategory?.categoryName?.toLowerCase().includes('bảo dưỡng')) {
      onUpdateVehicle({ hasMaintenanceHistory: undefined, lastMaintenanceDate: undefined, purchaseDate: undefined })
    }
  }

  // Function to get recommended services
  const getRecommendedServices = async () => {
    // Use lastMaintenanceDate if has maintenance history, otherwise use purchaseDate
    const dateToUse = vehicleData.hasMaintenanceHistory 
      ? vehicleData.lastMaintenanceDate 
      : vehicleData.purchaseDate
    
    // Ưu tiên sử dụng recentMileage nếu có, nếu không thì dùng mileage
    const mileageToUse = vehicleData.recentMileage || vehicleData.mileage
    
    if (!mileageToUse || !dateToUse || !selectedCategoryId) {
      return
    }

    const currentKm = parseInt(mileageToUse)
    if (isNaN(currentKm)) {
      return
    }

    setRecommendationLoading(true)
    try {
      const response = await ServiceChecklistTemplateService.getRecommendedServices({
        currentKm,
        lastMaintenanceDate: dateToUse,
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
    if (isVehicleSelected && vehicleData.recentMileage) {
      const baseKm = Number(vehicleData.mileage || 0)
      const recentKm = Number(vehicleData.recentMileage)
      if (!isNaN(baseKm) && !isNaN(recentKm) && recentKm < baseKm) {
        return false
      }
    }
    
    // Kiểm tra yêu cầu cho dịch vụ bảo dưỡng
    const isMaintenanceCategory = selectedCategory?.categoryName?.toLowerCase().includes('bảo dưỡng')
    if (isMaintenanceCategory) {
      // Nếu đã chọn loại dịch vụ bảo dưỡng, phải trả lời câu hỏi và nhập ngày tương ứng
      if (vehicleData.hasMaintenanceHistory === undefined) return false
      
      if (vehicleData.hasMaintenanceHistory) {
        if (!vehicleData.lastMaintenanceDate) return false
        // Kiểm tra ngày bảo dưỡng không được là hôm nay hoặc tương lai
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        const todayStr = today.toISOString().split('T')[0]
        if (vehicleData.lastMaintenanceDate >= todayStr) return false
      }
      
      if (!vehicleData.hasMaintenanceHistory) {
        if (!vehicleData.purchaseDate) return false
        // Kiểm tra ngày mua xe không được là tương lai
        const todayStr = new Date().toISOString().split('T')[0]
        if (vehicleData.purchaseDate > todayStr) return false
      }
    }
    
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
      <form onSubmit={handleSubmit}>
        {/* Phần chọn loại dịch vụ - đưa lên đầu tiên */}
        <div className="csv-section card category-section">
          <div className="form-group">
            <label className="csv-section-title">1. Loại dịch vụ <span className="required-star">*</span></label>
            {categoriesLoading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="category-grid">
                {categories.map(cat => {
                  const active = selectedCategoryId === cat.categoryId
                  return (
                    <div key={cat.categoryId} className={`category-card ${active ? 'active' : ''}`}>
                      <button
                        type="button"
                        className="category-main"
                        onClick={() => handleCategoryChange(cat.categoryId)}
                      >
                        <span className="category-name">{cat.categoryName}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Grid 2 cột: Thông tin xe và Chọn dịch vụ */}
        <div className="csv-grid">
          <div className="csv-section card">
            <div className="form-group">
              <label className="csv-section-title">2. Chọn xe<span className="required-star">*</span></label>
              {/* Grid ảnh chọn xe thay cho dropdown */}
              {vehiclesLoading ? (
                <div>Đang tải...</div>
              ) : (
                <>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <button type="button" aria-label="Prev" onClick={showPrevVehicle} style={{ position: 'absolute', left: -6, top: '40%', transform: 'translateY(-50%)', zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--csv-border)', background: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>‹</button>
                  <div ref={vehicleScrollerRef} style={{ width: 320, maxWidth: '100%' }}>
                  {vehicles.length === 0 && (
                    <div style={{ color: 'var(--csv-muted)' }}>Chưa có xe. Vui lòng tạo xe mới.</div>
                  )}
                  {vehicles.length > 0 && (() => {
                    const v = vehicles[vehicleIndex]
                    const active = selectedVehicleId === v.vehicleId
                    const modelId = v.modelId || vehicleModelMap[v.vehicleId as number] || 0
                    // Ưu tiên lấy ảnh Cloudinary theo modelId nếu đã cấu hình; nếu không, thử public/vehicle-models; cuối cùng dùng ảnh dự phòng.
                    const cloudFromVehicle = (() => {
                      const raw = (v as any).modelImageUrl as string | undefined
                      if (!raw) return undefined
                      const s = String(raw).trim()
                      // Chỉ nhận URL hợp lệ bắt đầu bằng http/https
                      return /^https?:\/\//i.test(s) ? s : undefined
                    })()
                    const cloudFromModel = cloudFromVehicle || modelImages[modelId]
                    const cloudUrl = cloudFromModel || buildModelImageUrl(modelId)
                    const imgSrc = cloudUrl || (modelId ? `/vehicle-models/${modelId}.webp` : fallbackVehicleImg)
                    return (
                      <button
                        key={v.vehicleId}
                        type="button"
                        onClick={() => {
                          setSelectedVehicleId(v.vehicleId)
                          onUpdateVehicle({
                            licensePlate: v.licensePlate,
                            carModel: v.vin,
                            mileage: v.currentMileage?.toString() || '',
                            modelId: v.modelId || undefined
                          })
                        }}
                        className={`vehicle-card ${active ? 'selected' : ''}`}
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'stretch',
                          gap: 10,
                          background: '#ffffff',
                          border: active ? `2px solid var(--progress-current)` : '1px solid var(--csv-border)',
                          borderRadius: 14,
                          cursor: 'pointer',
                          transition: 'transform .18s ease, box-shadow .22s ease, border-color .22s ease',
                          textAlign: 'left',
                          boxShadow: active ? '0 8px 26px rgba(30,199,116,.18)' : '0 6px 18px rgba(2,6,23,.06)',
                          padding: 12,
                          minHeight: 270
                        }}
                        aria-pressed={active}
                      >
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '16 / 9',
                            borderRadius: 12,
                            overflow: 'hidden'
                          }}
                        >
                          <img
                            src={imgSrc}
                            alt={`Model xe ${modelId || ''}`}
                            onError={(e) => {
                              // Nếu cloud/public fail, rơi về ảnh dự phòng local
                              (e.currentTarget as HTMLImageElement).src = fallbackVehicleImg
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', letterSpacing: '.1px' }}>{v.licensePlate}</div>
                          <div style={{ fontSize: 12, color: '#64748b', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
                            VIN: <span style={{ color: '#334155' }}>{v.vin}</span>
                          </div>
                        </div>
                        {active && (
                          <div style={{
                            marginTop: 2,
                            fontSize: 12,
                            color: 'var(--progress-current)',
                            fontWeight: 700
                          }}>
                            ✓ Đã chọn
                          </div>
                        )}
                      </button>
                    )
                  })()}
                  </div>
                  <button type="button" aria-label="Next" onClick={showNextVehicle} style={{ position: 'absolute', right: -6, top: '40%', transform: 'translateY(-50%)', zIndex: 2, width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--csv-border)', background: '#fff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }}>›</button>
                </div>
                {vehicles && vehicles.length > 0 && !selectedVehicleId && (
                  <div style={{
                    marginTop: 8,
                    color: '#475569',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    padding: '8px 10px',
                    borderRadius: 10
                  }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>Lưu ý:</span>
                    Vui lòng chọn xe trước khi tiếp tục.
                  </div>
                )}
                </>
              )}
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => {
                  setOpenCreate(true)
                  setSelectedVehicleId(undefined)
                }} 
                style={{ marginTop: 8 }}
              >
                + Tạo xe mới
              </button>
            </div>
          {/* Model selection moved to CreateVehicleModal */}
          <div className="form-group">
            <label>Số Km hiện tại<span className="required-star">*</span></label>
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
              <label>Số Km gần đây khi mang xe đến (tùy chọn)</label>
              <input
                type="number"
                value={vehicleData.recentMileage || ''}
                onChange={(e) => {
                  const val = e.target.value.trim()
                  const base = Number(vehicleData.mileage || 0)
                  const num = Number(val)
                  
                  // Kiểm tra validation: không được nhỏ hơn km hiện tại
                  if (val === '') {
                    // Nếu xóa giá trị, clear error và cập nhật
                    setRecentMileageError(null)
                    onUpdateVehicle({ recentMileage: '' })
                  } else if (!isNaN(num)) {
                    // Nếu là số hợp lệ
                    if (num < base) {
                      setRecentMileageError(`Số Km gần đây không được nhỏ hơn Số Km hiện tại (${base.toLocaleString()} km).`)
                      onUpdateVehicle({ recentMileage: val })
                    } else {
                      setRecentMileageError(null)
                      onUpdateVehicle({ recentMileage: val, mileage: val })
                    }
                  } else {
                    // Nếu không phải số hợp lệ nhưng vẫn có giá trị (ví dụ: đang nhập)
                    onUpdateVehicle({ recentMileage: val })
                    if (val.length > 0) {
                      setRecentMileageError(null) // Clear error khi đang nhập, sẽ validate lại khi blur
                    }
                  }
                }}
                onBlur={(e) => {
                  // Validate lại khi blur để đảm bảo giá trị cuối cùng hợp lệ
                  const val = e.target.value.trim()
                  const base = Number(vehicleData.mileage || 0)
                  const num = Number(val)
                  if (val && !isNaN(num) && num < base) {
                    setRecentMileageError(`Số Km gần đây không được nhỏ hơn Số Km hiện tại (${base.toLocaleString()} km).`)
                  } else if (val && !isNaN(num) && num >= base) {
                    onUpdateVehicle({ mileage: val })
                  }
                }}
                min={Number(vehicleData.mileage || 0)}
                aria-invalid={!!recentMileageError}
                aria-describedby={recentMileageError ? 'recent-mileage-error' : undefined}
                placeholder="Nhập km khi mang xe đến"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: `2px solid ${recentMileageError ? '#dc2626' : '#e5e7eb'}`,
                  borderRadius: '12px',
                  fontSize: '16px',
                  background: '#ffffff',
                  color: '#111827',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
              />
              {recentMileageError && (
                <div id="recent-mileage-error" style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px' }}>
                  {recentMileageError}
                </div>
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
            <>
              <div className="form-group">
                <label>Bạn đã bảo dưỡng chưa? <span className="required-star">*</span></label>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="hasMaintenanceHistory"
                      checked={vehicleData.hasMaintenanceHistory === true}
                      onChange={() => {
                        onUpdateVehicle({ 
                          hasMaintenanceHistory: true,
                          purchaseDate: undefined // Clear purchase date when selecting "yes"
                        })
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Có</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="hasMaintenanceHistory"
                      checked={vehicleData.hasMaintenanceHistory === false}
                      onChange={() => {
                        onUpdateVehicle({ 
                          hasMaintenanceHistory: false,
                          lastMaintenanceDate: undefined // Clear maintenance date when selecting "no"
                        })
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Chưa</span>
                  </label>
                </div>
              </div>

              {/* Hiển thị trường ngày bảo dưỡng cuối nếu đã bảo dưỡng */}
              {vehicleData.hasMaintenanceHistory === true && (
                <div className="form-group">
                  <label>Ngày bảo dưỡng cuối <span className="required-star">*</span></label>
                  {(() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const yesterday = new Date(today)
                    yesterday.setDate(yesterday.getDate() - 1)
                    const yesterdayStr = yesterday.toISOString().split('T')[0]
                    const todayStr = today.toISOString().split('T')[0]
                    const selectedDate = vehicleData.lastMaintenanceDate || ''
                    const isFuture = !!selectedDate && selectedDate > yesterdayStr
                    const isToday = selectedDate === todayStr
                    return (
                      <>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => onUpdateVehicle({ lastMaintenanceDate: e.target.value })}
                          max={yesterdayStr}
                          required
                          aria-invalid={isFuture || isToday}
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
                        {(isFuture || isToday) && (
                          <div style={{ color: '#dc2626', fontSize: '0.875rem' }}>
                            {isToday ? 'Không thể chọn ngày hôm nay' : 'Ngày này không thể chọn trong tương lai'}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Hiển thị trường ngày mua xe nếu chưa bảo dưỡng */}
              {vehicleData.hasMaintenanceHistory === false && (
                <div className="form-group">
                  <label>Ngày mua xe <span className="required-star">*</span></label>
                  {(() => {
                    const todayStr = new Date().toISOString().split('T')[0]
                    const selectedDate = vehicleData.purchaseDate || ''
                    const isFuture = !!selectedDate && selectedDate > todayStr
                    return (
                      <>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => onUpdateVehicle({ purchaseDate: e.target.value })}
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
            </>
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
        <div className="csv-section card">
          {/* Hiển thị phần chọn dịch vụ và gói dịch vụ khi đã chọn loại dịch vụ */}
          {selectedCategoryId && (
            <>
              <h3 className="csv-section-title">3. Chi tiết dịch vụ <span className="required-star">*</span></h3>
              {servicesLoading && <div>Đang tải dịch vụ...</div>}
              {!servicesLoading && (
                <div className="service-list">
                  {services.length === 0 ? (
                    <div style={{ padding: '1rem', color: 'var(--csv-muted)' }}>
                      Không có dịch vụ nào trong danh mục này
                    </div>
                  ) : (
                    services.map(service => (
                      <div key={service.id} className="service-item-wrapper">
                        <label className="service-item">
                          <input
                            type="checkbox"
                            checked={serviceData.services[0] === String(service.id)}
                            onChange={() => handleServiceToggle(String(service.id))}
                          />
                          <span>{service.name}</span>
                        </label>
                        <button
                          type="button"
                          onClick={async () => {
                            setDetailService(service as Service)
                            setIsServiceDetailOpen(true)
                          }}
                          className="service-detail-btn"
                          disabled={loadingDetailService}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Recommendation Section for Maintenance Category - Only show when vehicle info is complete */}
              {selectedCategory?.categoryName?.toLowerCase().includes('bảo dưỡng') && 
               (vehicleData.recentMileage || vehicleData.mileage) && 
               vehicleData.hasMaintenanceHistory !== undefined &&
               ((vehicleData.hasMaintenanceHistory && vehicleData.lastMaintenanceDate) || 
                (!vehicleData.hasMaintenanceHistory && vehicleData.purchaseDate)) && (
                <div className="recommendation-section">
                  <div className="recommendation-header">
                    <h4 className="csv-subtitle">💡 Gợi ý dịch vụ phù hợp</h4>
                    <button
                      type="button"
                      className="btn-recommend"
                      onClick={getRecommendedServices}
                      disabled={
                        recommendationLoading || 
                        !(vehicleData.recentMileage || vehicleData.mileage) || 
                        (vehicleData.hasMaintenanceHistory ? !vehicleData.lastMaintenanceDate : !vehicleData.purchaseDate)
                      }
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
                            Dựa trên số km {vehicleData.recentMileage ? 'gần đây khi mang xe đến' : 'hiện tại'} ({vehicleData.recentMileage || vehicleData.mileage} km) và {vehicleData.hasMaintenanceHistory ? 'ngày bảo dưỡng cuối' : 'ngày mua xe'} ({vehicleData.hasMaintenanceHistory ? vehicleData.lastMaintenanceDate : vehicleData.purchaseDate}), 
                            chúng tôi gợi ý các dịch vụ sau:
                          </p>
                          {sortedRecommendedServices.map((template, index) => {
                            const isSelected = serviceData.services[0] === String(template.serviceId)
                            return (
                            <div key={template.templateId} className={`recommended-service-card ${isSelected ? 'selected-service' : ''}`}>
                              <div className={`recommendation-badge ${isSelected ? 'selected-badge' : ''}`}>
                                {isSelected ? '✓ Đã chọn' : `#${index + 1} Phù hợp nhất`}
                              </div>
                              <div className="recommended-service-content">
                                <div className="recommended-service-header">
                                  <div>
                                    <h5>{template.serviceName}</h5>
                                    <p className="template-name">{template.templateName}</p>
                                  </div>
                                </div>
                                
                                {/* Thông tin tóm tắt - luôn hiển thị */}
                                <div className="recommendation-summary">
                                  {template.minKm && (
                                    <span className="summary-item">
                                      Số Km tối thiểu: {template.minKm.toLocaleString()} km
                                    </span>
                                  )}
                                  {template.maxDate && (
                                    <span className="summary-item">
                                     Ngày tối đa: {template.maxDate} ngày
                                    </span>
                                  )}
                                </div>
                              {/* Cảnh báo mềm nếu backend trả về */}
                              {Array.isArray(template.warnings) && template.warnings.length > 0 && (
                                <div className="recommendation-warnings">
                                  {template.warnings.map((warning, warningIndex) => (
                                    <div key={warningIndex} className="warning-item">
                                      ⚠️ {warning}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {template.recommendationReason && (
                                <div className="recommendation-reason">
                                  {template.recommendationReason}
                                </div>
                              )}
                                
                                <div className="recommended-service-actions">
                                  <button
                                    type="button"
                                    className="btn-toggle-details"
                                    onClick={async () => {
                                      const svcId = Number(template.serviceId)
                                      if (!svcId || isNaN(svcId)) return
                                      setLoadingDetailService(true)
                                      try {
                                        // Ưu tiên lấy từ danh sách services đã load
                                        const svc = services.find(s => s.id === svcId) || await ServiceManagementService.getServiceById(svcId)
                                        setDetailService(svc as Service)
                                        setIsServiceDetailOpen(true)
                                      } catch {
                                        setDetailService(null)
                                      } finally {
                                        setLoadingDetailService(false)
                                      }
                                    }}
                                  >
                                    Xem chi tiết
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn-select-recommended ${isSelected ? 'selected-btn' : ''}`}
                                    onClick={() => handleServiceToggle(String(template.serviceId))}
                                  >
                                    {isSelected ? '✓ Đã chọn' : 'Chọn dịch vụ'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show instruction when maintenance category is selected but vehicle info is incomplete */}
              {selectedCategory?.categoryName?.toLowerCase().includes('bảo dưỡng') && 
               (!(vehicleData.recentMileage || vehicleData.mileage) || 
                vehicleData.hasMaintenanceHistory === undefined ||
                (vehicleData.hasMaintenanceHistory && !vehicleData.lastMaintenanceDate) ||
                (!vehicleData.hasMaintenanceHistory && !vehicleData.purchaseDate)) && (
                <div className="recommendation-instruction">
                  <div className="instruction-content">
                    <h4 className="csv-subtitle">💡 Để nhận gợi ý dịch vụ phù hợp</h4>
                    <p>Vui lòng nhập đầy đủ thông tin xe bên dưới:</p>
                    <ul>
                      <li>Số km đã đi</li>
                      <li>Trả lời câu hỏi "Bạn đã bảo dưỡng chưa?"</li>
                      <li>{vehicleData.hasMaintenanceHistory === true ? 'Ngày bảo dưỡng cuối' : vehicleData.hasMaintenanceHistory === false ? 'Ngày mua xe' : 'Ngày bảo dưỡng cuối hoặc ngày mua xe'}</li>
                    </ul>
                    <p>Sau đó hệ thống sẽ gợi ý các dịch vụ phù hợp nhất với tình trạng xe của bạn.</p>
                  </div>
                </div>
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
            </>
          )}
        </div>
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

      {/* Modal chi tiết dịch vụ */}
      {selectedServiceDetail && (
        <div className="service-detail-modal-overlay" onClick={() => setSelectedServiceDetail(null)}>
          <div className="service-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết dịch vụ</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedServiceDetail(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-service-info">
                <h4>{selectedServiceDetail.serviceName}</h4>
                <p className="modal-template-name">{selectedServiceDetail.templateName}</p>
              </div>
              
              {selectedServiceDetail.description && (
                <div className="modal-section">
                  <h5>Mô tả</h5>
                  <p className="modal-description">{selectedServiceDetail.description}</p>
                </div>
              )}
              
              <div className="modal-section">
                <h5>Tiêu chí</h5>
                <div className="modal-criteria">
                  {selectedServiceDetail.minKm && (
                    <div className="modal-criteria-item">
                      <span className="criteria-label">📏 Km tối thiểu:</span>
                      <span className="criteria-value">{selectedServiceDetail.minKm.toLocaleString()} km</span>
                    </div>
                  )}
                  {selectedServiceDetail.maxDate && (
                    <div className="modal-criteria-item">
                      <span className="criteria-label">📅 Ngày tối đa:</span>
                      <span className="criteria-value">{selectedServiceDetail.maxDate} ngày</span>
                    </div>
                  )}
                  {selectedServiceDetail.maxOverdueDays && (
                    <div className="modal-criteria-item">
                      <span className="criteria-label">⏰ Trễ tối đa:</span>
                      <span className="criteria-value">{selectedServiceDetail.maxOverdueDays} ngày</span>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedServiceDetail.warnings && selectedServiceDetail.warnings.length > 0 && (
                <div className="modal-section">
                  <h5>Cảnh báo</h5>
                  <div className="modal-warnings">
                    {selectedServiceDetail.warnings.map((warning, warningIndex) => (
                      <div key={warningIndex} className="modal-warning-item">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedServiceDetail.recommendationReason && (
                <div className="modal-section">
                  <h5>Lý do gợi ý</h5>
                  <p className="modal-reason">{selectedServiceDetail.recommendationReason}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-secondary"
                onClick={() => setSelectedServiceDetail(null)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-primary"
                onClick={() => {
                  handleServiceToggle(String(selectedServiceDetail.serviceId))
                  setSelectedServiceDetail(null)
                }}
              >
                Chọn dịch vụ này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết dịch vụ (hiển thị checklist) */}
      <ServiceDetailModal
        isOpen={isServiceDetailOpen}
        onClose={() => {
          setIsServiceDetailOpen(false)
          setDetailService(null)
        }}
        service={detailService}
      />

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
        .vehicle-carousel{ -ms-overflow-style: none; }
        .vehicle-carousel::-webkit-scrollbar{ display: none; }
        .combined-service-vehicle-step { background: transparent; padding-bottom: .5rem; }
        .csv-title { font-size: 1.75rem; font-weight: 800; color: var(--csv-text); margin: 0 0 .25rem 0; letter-spacing: .2px; }
        .csv-subheading { margin: 0 0 1rem 0; color: var(--csv-muted); }
        .csv-grid { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 1.25rem; align-items: start; margin-top: 1.25rem; }
        .category-section { margin-bottom: 1.25rem; }
        .card { 
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.45);
          border-radius: 16px; 
          padding: 1.25rem; 
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.15);
          backdrop-filter: blur(18px) saturate(160%);
          -webkit-backdrop-filter: blur(18px) saturate(160%);
          box-sizing: border-box;
          /* Cho phép menu dropdown render ra ngoài card */
          overflow: visible;
        }
        .card:hover { box-shadow: 0 22px 48px rgba(0, 0, 0, 0.18); transform: translateY(-1px); border-color: rgba(255,255,255,0.6); }
        .csv-section-title { margin: 0 0 .75rem 0; font-size: 1.1rem; font-weight: 700; color: var(--csv-text); }
        .csv-subtitle { margin: .5rem 0 .5rem; font-size: .95rem; font-weight: 700; color: var(--csv-muted); }
        .service-list { display: flex; flex-direction: column; gap: .75rem; margin-bottom: 1rem; }
        .service-item-wrapper { display: flex; align-items: center; gap: .75rem; flex-wrap: wrap; }
        .service-item-wrapper .service-item { flex: 0 0 auto; }
        .pkg-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: .5rem; }
        .category-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
        .category-card { display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-primary); border-radius: 12px; padding: .5rem; background: #fff; }
        .category-card.active { border-color: var(--progress-current); box-shadow: 0 2px 10px rgba(0,64,48,.12); background: var(--progress-current); color: #fff; }
        .category-main { width: 100%; text-align: center; background: transparent; border: none; color: var(--text-primary); font-weight: 700; padding: .5rem .75rem; border-radius: 10px; cursor: pointer; }
        .service-item { position: relative; display: inline-flex; align-items: center; cursor: pointer; }
        .service-item input { position: absolute; opacity: 0; inset: 0; cursor: pointer; }
        .service-item span { display: inline-block; padding: .5rem .75rem; border: 1px solid var(--border-primary); border-radius: 999px; background: #fff; color: var(--text-primary); transition: all .2s ease; user-select: none; }
        .service-item:hover span { box-shadow: 0 2px 6px rgba(0,0,0,.06); }
        .service-item input:checked + span { background: var(--progress-current); color: #fff; border-color: var(--progress-current); }
        .service-item input:focus-visible + span { outline: 2px solid var(--progress-current); outline-offset: 2px; }
        .service-detail-btn {
          background: #f0f9ff;
          color: #0ea5e9;
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 0.35rem 0.7rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .service-detail-btn:hover:not(:disabled) {
          background: #e0f2fe;
          border-color: #38bdf8;
          color: #0284c7;
          transform: translateY(-1px);
        }
        .service-detail-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
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
        .pkg-badge { background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; padding: 2px 8px; border-radius: 10px; font-size: .75rem; font-weight: 700; }
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
        .recommendation-instruction { margin-top: 1.5rem; padding: 1rem; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 12px; }
        .instruction-content h4 { margin: 0 0 0.75rem 0; color: var(--text-primary); }
        .instruction-content p { margin: 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem; }
        .instruction-content ul { margin: 0.5rem 0; padding-left: 1.5rem; color: var(--text-secondary); }
        .instruction-content li { margin: 0.25rem 0; font-size: 0.9rem; }
        
        /* Recommendation Styles */
        .recommendation-section { margin-top: 1.5rem; padding: 1rem; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; }
        .recommendation-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; gap: 0.75rem; flex-wrap: wrap; }
        .btn-recommend { background: var(--progress-current, #1ec774); color: #ffffff; border: none; border-radius: 8px; padding: 0.5rem 1.1rem; font-weight: 700; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 6px 16px rgba(30, 199, 116, 0.18); }
        .btn-recommend:hover:not(:disabled) { background: #16a34a; transform: translateY(-1px); box-shadow: 0 10px 24px rgba(22, 163, 74, 0.25); }
        .btn-recommend:disabled { background: #e7f8ef; color: #047857; cursor: not-allowed; box-shadow: none; opacity: 0.8; }
        .recommendation-results { margin-top: 1rem; }
        .no-recommendations { text-align: center; padding: 1rem; color: var(--csv-muted); }
        .recommended-services { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        .recommended-service-card { background: #ffffff; border: 1px solid rgba(16, 185, 129, 0.18); border-radius: 10px; padding: 0.85rem; position: relative; box-shadow: 0 4px 14px rgba(15, 118, 110, 0.1); transition: all 0.3s ease; }
        .recommended-service-card.selected-service { border: 2px solid var(--progress-current, #1ec774); box-shadow: 0 6px 20px rgba(30, 199, 116, 0.24); background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); }
        .recommendation-badge { position: absolute; top: -6px; right: 8px; background: rgba(16, 185, 129, 0.85); color: white; padding: 2px 8px; border-radius: 10px; font-size: 0.65rem; font-weight: 700; letter-spacing: 0.3px; }
        .recommendation-badge.selected-badge { background: var(--progress-current, #1ec774); box-shadow: 0 2px 8px rgba(30, 199, 116, 0.35); }
        .recommended-service-content h5 { margin: 0 0 0.25rem 0; color: var(--csv-text); font-size: 0.875rem; font-weight: 700; line-height: 1.2; }
        .template-name { margin: 0 0 0.5rem 0; color: var(--csv-primary); font-weight: 600; font-size: 0.8rem; line-height: 1.2; }
        .recommended-service-header { margin-bottom: 0.5rem; }
        .recommendation-summary { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
        .summary-item { background: #ecfdf5; color: #047857; padding: 0.25rem 0.45rem; border-radius: 6px; font-size: 0.7rem; font-weight: 600; border: 1px solid rgba(16, 185, 129, 0.2); }
        .recommended-service-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
        .btn-toggle-details { background: #ecfdf5; color: #047857; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 6px; padding: 0.4rem 0.75rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; flex: 1; }
        .btn-toggle-details:hover { background: #d1fae5; border-color: rgba(16, 185, 129, 0.45); }
        .btn-select-recommended { background: var(--csv-primary); color: white; border: none; border-radius: 6px; padding: 0.4rem 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; flex: 1; font-size: 0.75rem; }
        .btn-select-recommended:hover { background: #16a34a; transform: translateY(-1px); }
        .btn-select-recommended.selected-btn { background: #16a34a; box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3); cursor: default; }
        .btn-select-recommended.selected-btn:hover { background: #16a34a; transform: none; }
        
        /* Modal Styles */
        .service-detail-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .service-detail-modal { background: white; border-radius: 12px; max-width: 600px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e5e7eb; }
        .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--csv-text); }
        .modal-close { background: none; border: none; font-size: 1.5rem; color: #6b7280; cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s ease; }
        .modal-close:hover { background: #f3f4f6; color: #111827; }
        .modal-body { padding: 1.5rem; overflow-y: auto; flex: 1; }
        .modal-service-info { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; }
        .modal-service-info h4 { margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 700; color: var(--csv-text); }
        .modal-template-name { margin: 0; color: var(--csv-primary); font-weight: 600; font-size: 0.95rem; }
        .modal-section { margin-bottom: 1.5rem; }
        .modal-section h5 { margin: 0 0 0.75rem 0; font-size: 0.95rem; font-weight: 700; color: var(--csv-text); }
        .modal-description { margin: 0; color: var(--csv-muted); font-size: 0.9rem; line-height: 1.5; }
        .modal-criteria { display: flex; flex-direction: column; gap: 0.5rem; }
        .modal-criteria-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: #f0f9ff; border-radius: 6px; }
        .criteria-label { font-weight: 600; color: #0369a1; font-size: 0.85rem; }
        .criteria-value { color: #0369a1; font-size: 0.85rem; }
        .modal-warnings { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 0.75rem; }
        .modal-warning-item { margin: 0.25rem 0; font-size: 0.85rem; line-height: 1.4; color: #92400e; }
        .modal-reason { margin: 0; padding: 0.75rem; background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; font-size: 0.9rem; line-height: 1.5; color: #0369a1; }
        .modal-footer { display: flex; gap: 0.75rem; padding: 1.25rem 1.5rem; border-top: 1px solid #e5e7eb; justify-content: flex-end; }
        .btn-modal-secondary { background: white; color: var(--csv-text); border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.6rem 1.25rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-modal-secondary:hover { background: #f9fafb; border-color: #d1d5db; }
        .btn-modal-primary { background: var(--csv-primary); color: white; border: none; border-radius: 8px; padding: 0.6rem 1.25rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
        .btn-modal-primary:hover { background: #16a34a; transform: translateY(-1px); }
        .recommendation-message { margin: 0 0 1rem 0; color: var(--csv-text); font-size: 0.9rem; line-height: 1.4; }
        .recommendation-warnings { margin: 0.5rem 0; padding: 0.6rem 0.75rem; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; }
        .warning-item { margin: 0.2rem 0; font-size: 0.75rem; line-height: 1.3; color: #92400e; font-weight: 600; }
        .recommendation-reason { margin: 0.5rem 0; padding: 0.6rem 0.75rem; background: #ecfdf5; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; font-size: 0.75rem; line-height: 1.35; color: #047857; font-weight: 600; }
        
        @media (max-width: 768px) {
          .recommended-services { grid-template-columns: 1fr; }
        }
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


