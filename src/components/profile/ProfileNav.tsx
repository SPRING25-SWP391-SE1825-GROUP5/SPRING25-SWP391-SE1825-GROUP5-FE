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
} from '@heroicons/react/24/outline'

export type ProfileTabKey =
  | 'overview'
  | 'info'
  | 'vehicles'
  | 'history'
  | 'reviews'
  | 'promotions'
  | 'packages'
  | 'notifications'
  

interface NavItem {
  key: ProfileTabKey
  label: string
  icon: ReactNode
}

interface ProfileNavProps {
  active: ProfileTabKey
  onChange: (key: ProfileTabKey) => void
}

const items: NavItem[] = [
  { key: 'overview', label: 'Tổng quan', icon: <HomeIcon width={16} height={16} /> },
  { key: 'info', label: 'Thông tin', icon: <IdentificationIcon width={16} height={16} /> },
  { key: 'vehicles', label: 'Phương tiện', icon: <TruckIcon width={16} height={16} /> },
  { key: 'history', label: 'Lịch sử đặt lịch', icon: <ClockIcon width={16} height={16} /> },
  { key: 'packages', label: 'Gói dịch vụ', icon: <GiftTopIcon width={16} height={16} /> },
  { key: 'promotions', label: 'Mã khuyến mãi đã lưu', icon: <TagIcon width={16} height={16} /> },
  { key: 'reviews', label: 'Đánh giá của tôi', icon: <ChatBubbleLeftRightIcon width={16} height={16} /> },
  { key: 'notifications', label: 'Thông báo', icon: <BellIcon width={16} height={16} /> },
]

export default function ProfileNav({ active, onChange }: ProfileNavProps) {

  return (
    <div className="profile-v2__tabs">
      {items.map((it) => (
        <button
          key={it.key}
          className={`profile-v2__tab ${active === it.key ? 'active' : ''}`}
          onClick={() => onChange(it.key)}
          type="button"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {it.icon}
            <span>{it.label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}


