import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { CustomerService } from '@/services/customerService'
import { ReminderBanner } from '@/components/reminder'

export default function Home() {
  const auth = useAppSelector(state => state.auth)
  const [customerId, setCustomerId] = useState<number | undefined>(undefined)
  const [loadingCustomerId, setLoadingCustomerId] = useState(false)

  useEffect(() => {
    const loadCustomerId = async () => {
      if (!auth.user?.id || customerId) return

      setLoadingCustomerId(true)
      try {
        const response = await CustomerService.getCurrentCustomer()
        if (response.success && response.data?.customerId) {
          setCustomerId(response.data.customerId)
        }
      } catch (error) {
        console.error('Error loading customer ID:', error)
      } finally {
        setLoadingCustomerId(false)
      }
    }

    loadCustomerId()
  }, [auth.user?.id, customerId])

  return (
    <section className="container py-4">
      <h2 className="text-2xl font-semibold text-primary-700 mb-4">Trang chủ</h2>

      {/* Reminder Banner - chỉ hiển thị cho customer */}
      {!loadingCustomerId && customerId && (
        <ReminderBanner customerId={customerId} />
      )}

      <div style={{ marginTop: 24 }}>
        <p>Đây là trang chủ (React). UI sử dụng lại màu sắc và styles từ dự án cũ.</p>
      </div>
    </section>
  )
}

