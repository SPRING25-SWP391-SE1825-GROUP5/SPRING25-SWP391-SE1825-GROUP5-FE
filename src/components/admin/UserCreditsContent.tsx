import React, { useState, useEffect } from 'react'
import { CreditCard, RefreshCw } from 'lucide-react'
import { CustomerService, CustomerServicePackage } from '@/services/customerService'
import toast from 'react-hot-toast'

interface UserCreditsContentProps {
  userId: number
  customerId: number | null
  onRefresh?: () => void
}

export default function UserCreditsContent({ userId, customerId, onRefresh }: UserCreditsContentProps) {
  const [credits, setCredits] = useState<CustomerServicePackage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCredits()
  }, [customerId, userId])

  const loadCredits = async () => {
    try {
      setLoading(true)
      if (customerId) {
        const response = await CustomerService.getCustomerCredits(customerId)
        console.log('Credits response:', response)

        if (response.success) {
          let creditsList: CustomerServicePackage[] = []
          const data = response.data as any

          if (Array.isArray(data)) {
            creditsList = data
          } else if (data?.data && Array.isArray(data.data)) {
            creditsList = data.data
          } else if (data?.credits && Array.isArray(data.credits)) {
            creditsList = data.credits
          } else if (data?.Credits && Array.isArray(data.Credits)) {
            creditsList = data.Credits
          }

          console.log('Parsed credits list:', creditsList)
          setCredits(creditsList)
        } else {
          console.warn('Credits response not successful:', response)
          setCredits([])
        }
      } else {
        setCredits([])
      }
    } catch (err: any) {
      console.error('Error loading credits:', err)
      toast.error('Không thể tải danh sách credits')
      setCredits([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  return (
    <div>
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
          <RefreshCw size={20} className="animate-spin" style={{ display: 'inline-block', marginRight: '8px' }} />
          Đang tải...
        </div>
      ) : credits.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
          Chưa có service credits nào
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Gói dịch vụ</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Dịch vụ</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Tổng credits</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Đã dùng</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Còn lại</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'right', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Giá</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Ngày mua</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'left', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Hết hạn</th>
                <th style={{ border: '1px solid #FFD875', padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 400, background: '#FFF8E6' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {credits.map((credit) => (
                <tr key={credit.creditId}>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#111827', fontWeight: 500 }}>
                    {credit.packageName || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                    {credit.serviceName || 'N/A'}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
                    {credit.totalCredits || 0}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
                    {credit.usedCredits || 0}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'right', fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    {credit.remainingCredits || 0}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'right', fontSize: 13, color: '#374151' }}>
                    {formatCurrency(credit.finalPrice || 0)}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                    {formatDate(credit.purchaseDate)}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', fontSize: 13, color: '#374151' }}>
                    {formatDate(credit.expiryDate)}
                  </td>
                  <td style={{ border: '1px solid #E5E7EB', padding: '10px', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: 12,
                        fontWeight: 500,
                        background: credit.status === 'ACTIVE' ? '#D1FAE5' : credit.status === 'EXPIRED' ? '#FEE2E2' : '#F3F4F6',
                        color: credit.status === 'ACTIVE' ? '#065F46' : credit.status === 'EXPIRED' ? '#991B1B' : '#6B7280'
                      }}
                    >
                      {credit.status === 'ACTIVE' ? 'Đang hoạt động' : credit.status === 'EXPIRED' ? 'Hết hạn' : credit.status || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

