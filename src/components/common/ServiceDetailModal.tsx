import { useState, useEffect } from 'react'
import { X, CheckCircle2, Clock, DollarSign, Wrench, Loader2 } from 'lucide-react'
import { Service } from '@/services/serviceManagementService'
import { ServiceChecklistTemplateService, ServiceChecklistTemplate } from '@/services/serviceChecklistTemplateService'
import './ServiceDetailModal.scss'

interface ServiceDetailModalProps {
  isOpen: boolean
  onClose: () => void
  service: Service | null
  onBookService?: (serviceId: number) => void
}

export default function ServiceDetailModal({ isOpen, onClose, service, onBookService }: ServiceDetailModalProps) {
  const [checklistTemplates, setChecklistTemplates] = useState<ServiceChecklistTemplate[]>([])
  const [loadingChecklist, setLoadingChecklist] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch checklist templates when modal opens and service is available
  useEffect(() => {
    if (isOpen && service?.id) {
      fetchChecklistTemplates(service.id)
    } else {
      // Reset when modal closes
      setChecklistTemplates([])
      setError(null)
    }
  }, [isOpen, service?.id])

  const fetchChecklistTemplates = async (serviceId: number) => {
    setLoadingChecklist(true)
    setError(null)
    try {

      // Sử dụng method mới để lấy templates kèm items (parts)
      const templates = await ServiceChecklistTemplateService.getTemplatesByServiceWithItems(serviceId, true)

      // Nếu không có templates, không hiển thị error - chỉ hiển thị empty state
      setChecklistTemplates(templates || [])
      
      // Chỉ set error nếu có lỗi thực sự (không phải empty result)
      if (templates === null || templates === undefined) {
        setError('Không thể tải danh sách checklist. Vui lòng thử lại sau.')
      }
    } catch (err: any) {

      // Nếu là 404 hoặc service không có checklist, không hiển thị error
      if (err.response?.status === 404) {
        setChecklistTemplates([])
        setError(null)
      } else {
        setError(err.message || 'Không thể tải danh sách checklist. Vui lòng thử lại sau.')
      }
    } finally {
      setLoadingChecklist(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (!isOpen || !service) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleBookService = () => {
    if (onBookService) {
      onBookService(service.id)
    }
    onClose()
  }

  return (
    <div className="service-detail-modal-overlay" onClick={handleBackdropClick}>
      <div className="service-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="service-detail-modal__header">
          <div className="service-detail-modal__header-content">
            <Wrench className="service-detail-modal__header-icon" />
            <h2 className="service-detail-modal__title">{service.name}</h2>
          </div>
          <button className="service-detail-modal__close" onClick={onClose} aria-label="Đóng">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="service-detail-modal__content">
          {/* Service Info */}
          <div className="service-detail-modal__info-grid">
            <div className="service-detail-modal__info-item">
              <DollarSign className="service-detail-modal__info-icon" />
              <div className="service-detail-modal__info-content">
                <span className="service-detail-modal__info-label">Giá dịch vụ</span>
                <span className="service-detail-modal__info-value">{formatPrice(service.price)}</span>
              </div>
            </div>
          </div>

          {/* Checklist Templates Section */}
          <div className="service-detail-modal__section">
            <h3 className="service-detail-modal__section-title">Quy trình thực hiện dịch vụ</h3>
            {loadingChecklist ? (
              <div className="service-detail-modal__loading">
                <Loader2 className="service-detail-modal__loading-icon" />
                <span>Đang tải checklist...</span>
              </div>
            ) : error ? (
              <div className="service-detail-modal__error">
                <p>{error}</p>
              </div>
            ) : checklistTemplates.length === 0 ? (
              <div className="service-detail-modal__empty">
                <p>Chưa có thông tin checklist cho dịch vụ này.</p>
              </div>
            ) : (
              <div className="service-detail-modal__checklist-list">
                {checklistTemplates.map((template, index) => {
                  const templateId =
                    template.templateId ??
                    (template as any).templateID ??
                    (template as any).TemplateID ??
                    (template as any).TemplateId ??
                    index
                  const parts = template.items || []

                  return (
                    <div key={templateId ?? index} className="service-detail-modal__checklist-item">
                      <div className="service-detail-modal__checklist-header">
                        <CheckCircle2 className="service-detail-modal__checklist-icon" />
                        <h4 className="service-detail-modal__checklist-title">
                          {template.templateName || `Quy trình ${index + 1}`}
                        </h4>
                      </div>
                      {parts.length > 0 ? (
                        <div className="service-detail-modal__parts">
                          <div className="service-detail-modal__parts-table-wrapper">
                            <table className="service-detail-modal__parts-table">
                              <thead>
                                <tr>
                                  <th>#</th>
                                  <th>Danh mục kiểm tra</th>
                                </tr>
                              </thead>
                              <tbody>
                                {parts.map((item, idx) => (
                                  <tr key={item.itemId ?? idx}>
                                    <td>{idx + 1}</td>
                                    <td>{(item as any).partName || (item as any).categoryName || (item as any)?.category?.categoryName || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="service-detail-modal__empty" style={{ paddingLeft: 0, paddingRight: 0 }}>
                          Không có danh mục kiểm tra
                        </div>
                      )}

                      {/* Metadata áp dụng (nếu có) */}
                      {(template.minKm || template.intervalKm || template.intervalDays || template.maxDate) && (
                        <div className="service-detail-modal__checklist-meta">
                          {template.minKm && (
                            <span>Áp dụng cho xe từ {template.minKm.toLocaleString('vi-VN')} km trở lên</span>
                          )}
                          {template.intervalKm && (
                            <span>Bảo dưỡng định kỳ mỗi {template.intervalKm.toLocaleString('vi-VN')} km</span>
                          )}
                          {template.intervalDays && (
                            <span>Bảo dưỡng định kỳ mỗi {template.intervalDays} ngày</span>
                          )}
                          {template.maxDate && (
                            <span>Hiệu lực tối đa: {template.maxDate} ngày</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="service-detail-modal__footer">
          <button className="service-detail-modal__btn service-detail-modal__btn--secondary" onClick={onClose}>
            Đóng
          </button>
          <button 
            className="service-detail-modal__btn service-detail-modal__btn--primary" 
            onClick={handleBookService}
          >
            Đặt lịch ngay
          </button>
        </div>
      </div>
    </div>
  )
}

