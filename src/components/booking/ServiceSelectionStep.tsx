import React, { useEffect, useState } from 'react'
import { ServiceManagementService, type Service } from '@/services/serviceManagementService'
import type { ServicePackage } from '@/services/serviceManagementService'

interface ServiceInfo {
  services: string[]
  notes: string
  packageId?: number
  packageCode?: string
}

interface ServiceSelectionStepProps {
  data: ServiceInfo
  onUpdate: (data: Partial<ServiceInfo>) => void
  onNext: () => void
  onPrev: () => void
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ data, onUpdate, onNext, onPrev }) => {
  const [tab, setTab] = useState<'services' | 'packages'>('services')
  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const [svc, pkg] = await Promise.all([
          ServiceManagementService.getActiveServices({ pageSize: 1000 }),
          ServiceManagementService.getActiveServicePackages({ pageSize: 1000 })
        ])
        if (!mounted) return
        setServices(svc.services || [])
        setPackages(pkg.packages || [])
      } catch {
        if (!mounted) return
        setServices([])
        setPackages([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleServiceToggle = (serviceId: string) => {
    const newServices = data.services.includes(serviceId)
      ? data.services.filter(id => id !== serviceId)
      : [...data.services, serviceId]
    onUpdate({ services: newServices, packageId: undefined, packageCode: undefined })
  }

  const handleSelectPackage = (pkg: ServicePackage) => {
    // Chọn gói: clear dịch vụ đang chọn để tránh mâu thuẫn
    onUpdate({ packageId: pkg.packageId, packageCode: pkg.packageCode, services: [] })
    setTab('packages')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (data.services.length > 0 || data.packageId) {
      onNext()
    }
  }

  return (
    <div className="service-selection-step">
      <h2>Chọn dịch vụ</h2>
      <div className="tabs">
        <button type="button" className={`tab ${tab==='services' ? 'active' : ''}`} onClick={() => setTab('services')}>Dịch vụ</button>
        <button type="button" className={`tab ${tab==='packages' ? 'active' : ''}`} onClick={() => setTab('packages')}>Gói dịch vụ</button>
      </div>
      <form onSubmit={handleSubmit}>
        {loading ? (
          <div style={{ padding: '1rem' }}>Đang tải...</div>
        ) : (
          <>
            {tab === 'services' && (
              <div className="service-list">
                {services.map(s => (
                  <label key={s.id} className={`service-item ${data.packageId ? 'disabled' : ''}`}>
                    <input
                      type="checkbox"
                      disabled={!!data.packageId}
                      checked={data.services.includes(String(s.id))}
                      onChange={() => handleServiceToggle(String(s.id))}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            )}
            {tab === 'packages' && (
              <div className="service-list">
                {packages.map(p => {
                  const priceText = (typeof p.price === 'number' ? p.price : Number(p.price || 0))
                    .toLocaleString('vi-VN')
                  return (
                    <label key={p.packageId} className={`service-item package ${data.packageId === p.packageId ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="service-package"
                        checked={data.packageId === p.packageId}
                        onChange={() => handleSelectPackage(p)}
                      />
                      <span>
                        <strong>{p.packageName}</strong>
                        {` · ${p.serviceName ?? ''}`}
                        {p.totalCredits ? ` · ${p.totalCredits} lượt` : ''}
                        {p.discountPercent ? ` · Giảm ${p.discountPercent}%` : ''}
                        {` · ${priceText} VNĐ`}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </>
        )}
        <div className="form-group">
          <label>Ghi chú thêm</label>
          <textarea
            value={data.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            rows={3}
          />
        </div>
        <div className="form-actions">
          <button type="button" onClick={onPrev} className="btn-secondary">
            Quay lại
          </button>
          <button type="submit" className="btn-primary">
            Tiếp theo
          </button>
        </div>
      </form>
    </div>
  )
}

export default ServiceSelectionStep