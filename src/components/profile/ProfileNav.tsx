import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  HomeIcon,
  IdentificationIcon,
  TruckIcon,
  ClockIcon,
  GiftTopIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
  BellIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { ReminderService } from '@/services/reminderService'
import { CustomerService } from '@/services/customerService'
import { useAppSelector } from '@/store/hooks'

export type ProfileTabKey =
  | 'overview'
  | 'info'
  | 'vehicles'
  | 'history'
  | 'reviews'
  | 'promotions'
  | 'packages'
  | 'notifications'
  | 'service-history'
  | 'promo-codes'
  | 'reminders'


interface NavItem {
  key: ProfileTabKey
  label: string
  icon: ReactNode
  badge?: number
}

interface ProfileNavProps {
  active: ProfileTabKey
  onChange: (key: ProfileTabKey) => void
}

export default function ProfileNav({ active, onChange }: ProfileNavProps) {
  const auth = useAppSelector(state => state.auth)
  const [reminderBadge, setReminderBadge] = useState<number>(0)

  useEffect(() => {
    const loadReminderBadge = async () => {
      try {
        const response = await CustomerService.getCurrentCustomer()
        if (response.success && response.data?.customerId) {
          const reminders = await ReminderService.getUpcoming(response.data.customerId)
          // Chỉ đếm DUE và OVERDUE
          const urgentCount = reminders.filter(r => r.status === 'DUE' || r.status === 'OVERDUE').length
          setReminderBadge(urgentCount)
        }
      } catch (error) {
        // Silently fail - badge is optional
        console.error('Error loading reminder badge:', error)
      }
    }

    if (auth.user?.id) {
      loadReminderBadge()
    }
  }, [auth.user?.id])

  const items: NavItem[] = [
    { key: 'info', label: 'Thông tin', icon: <IdentificationIcon width={16} height={16} /> },
    { key: 'vehicles', label: 'Phương tiện', icon: <TruckIcon width={16} height={16} /> },
    {
      key: 'reminders',
      label: 'Nhắc nhở bảo dưỡng',
      icon: <CalendarDaysIcon width={16} height={16} />,
      badge: reminderBadge > 0 ? reminderBadge : undefined
    },
    { key: 'history', label: 'Lịch sử hoạt động', icon: <ClockIcon width={16} height={16} /> },
    { key: 'packages', label: 'Gói dịch vụ', icon: <GiftTopIcon width={16} height={16} /> },
    { key: 'promotions', label: 'Mã khuyến mãi đã lưu', icon: <TagIcon width={16} height={16} /> },
    { key: 'reviews', label: 'Đánh giá của tôi', icon: <ChatBubbleLeftRightIcon width={16} height={16} /> },
    { key: 'notifications', label: 'Thông báo', icon: <BellIcon width={16} height={16} /> },
  ]

  return (
    <div className="profile-v2__tabs">
      {items.map((it) => (
        <button
          key={it.key}
          className={`profile-v2__tab ${active === it.key ? 'active' : ''}`}
          onClick={() => onChange(it.key)}
          type="button"
          style={{ position: 'relative' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {it.icon}
            <span>{it.label}</span>
            {it.badge !== undefined && it.badge > 0 && (
              <span
                style={{
                  background: '#EF4444',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '14px',
                  marginLeft: 4
                }}
              >
                {it.badge > 99 ? '99+' : it.badge}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  )
}


