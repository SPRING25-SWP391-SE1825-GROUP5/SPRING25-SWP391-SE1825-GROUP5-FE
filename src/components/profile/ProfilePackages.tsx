import { useEffect, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { CustomerService, type CustomerServicePackage } from '@/services/customerService'
import toast from 'react-hot-toast'
import { GiftTopIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function ProfilePackages() {
  const user = useAppSelector((state) => state.auth.user)
  const [packages, setPackages] = useState<CustomerServicePackage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadServicePackages = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await CustomerService.getCustomerServicePackages()
        
        if (response.success && response.data) {
          setPackages(response.data)
        } else {
          setPackages([])
        }
      } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('Error loading service packages:', error)
        toast.error(err.message || 'Không thể tải danh sách gói dịch vụ')
        setPackages([])
      } finally {
        setLoading(false)
      }
    }

    loadServicePackages()
  }, [user])

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đang hoạt động</span>
      case 'EXPIRED':
        return <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Đã hết hạn</span>
      case 'INACTIVE':
      default:
        return <span style={{ backgroundColor: '#f3f4f6', color: '#6b7280', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>Không hoạt động</span>
    }
  }

  if (loading) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">Đang tải...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="profile-v2__section">
        <div className="profile-v2__empty">Vui lòng đăng nhập để xem gói dịch vụ của bạn.</div>
      </div>
    )
  }

  if (packages.length === 0) {
  return (
    <div className="profile-v2__section">
        <div className="profile-v2__empty">
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
              Bạn chưa có gói dịch vụ nào.
            </p>
            <p style={{ fontSize: '14px', color: '#999', margin: '8px 0 0 0' }}>
              Khám phá các gói dịch vụ và đăng ký để nhận nhiều ưu đãi hấp dẫn.
            </p>
          </div>
        </div>
    </div>
  )
}

  return (
    <div className="profile-v2__section">
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
        gap: '20px',
        padding: '16px 0'
      }}>
        {packages.map((pkg) => (
          <div 
            key={pkg.creditId} 
            className="profile-v2__card"
            style={{ 
              padding: '20px',
              border: `1px solid ${pkg.status === 'ACTIVE' ? '#e5e7eb' : '#f3f4f6'}`,
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Status Badge */}
            <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
              {getStatusBadge(pkg.status)}
            </div>

            {/* Package Name */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              marginBottom: '16px',
              paddingRight: '120px'
            }}>
              <GiftTopIcon width={20} height={20} style={{ color: '#FFD875', flexShrink: 0 }} />
              <span style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: '#111827',
                letterSpacing: '0.5px'
              }}>
                {pkg.packageName}
              </span>
            </div>

            {/* Service Name */}
            <div style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#374151',
              marginBottom: '8px'
            }}>
              {pkg.serviceName}
            </div>

            {/* Service Description */}
            {pkg.serviceDescription && (
              <div style={{ 
                fontSize: '14px', 
                color: '#4b5563',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                {pkg.serviceDescription}
              </div>
            )}

            {/* Package Description */}
            {pkg.packageDescription && (
              <div style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                {pkg.packageDescription}
              </div>
            )}

            {/* Price Info */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Giá gốc</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280', textDecoration: 'line-through' }}>
                  {formatCurrency(pkg.originalPrice)}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Giảm giá</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                  {pkg.discountPercent}%
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Giá cuối</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#FFD875' }}>
                  {formatCurrency(pkg.finalPrice)}
                </div>
              </div>
            </div>

            {/* Credits Info */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#fef3c7',
              borderRadius: '8px'
            }}>
              <ClockIcon width={18} height={18} style={{ color: '#FFD875' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '4px' }}>Số lượt sử dụng</div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                  {pkg.usedCredits}/{pkg.totalCredits} lượt
                </div>
              </div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#92400e',
                padding: '4px 8px',
                backgroundColor: '#fef3c7',
                borderRadius: '4px'
              }}>
                Còn lại: {pkg.remainingCredits}
              </div>
            </div>

            {/* Details */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              paddingTop: '16px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                <CalendarIcon width={16} height={16} />
                <span>Mua ngày: <strong>{formatDate(pkg.purchaseDate)}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                <CalendarIcon width={16} height={16} />
                <span>Hết hạn: <strong>{formatDate(pkg.expiryDate)}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
