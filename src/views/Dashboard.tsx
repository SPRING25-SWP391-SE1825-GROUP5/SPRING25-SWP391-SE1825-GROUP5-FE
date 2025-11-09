import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { CustomerService } from '@/services/customerService'
import { ReminderBanner } from '@/components/reminder'
import './Dashboard.scss'

export default function Dashboard() {
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
    <section className="container py-4 dashboard-page">
      <h2 className="text-2xl font-semibold text-primary-700 mb-4">Dashboard</h2>

      {/* Reminder Banner - chỉ hiển thị cho customer */}
      {!loadingCustomerId && customerId && (
        <ReminderBanner customerId={customerId} />
      )}

      <div style={{ marginTop: 24 }}>
        <p>Trang Dashboard placeholder.</p>
      </div>
    </section>
  )
}
