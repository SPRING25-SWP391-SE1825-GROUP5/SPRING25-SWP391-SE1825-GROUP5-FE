import { useState } from 'react'
import ProfileHistory from './ProfileHistory'
import OrderHistory from './OrderHistory'

export default function ProfileActivity() {
  const [activeTab, setActiveTab] = useState<'booking' | 'order'>('booking')

  return (
    <div className="profile-v2__section" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => setActiveTab('booking')}
          className="btn"
          style={{
            padding: '8px 14px',
            border: '1px solid',
            borderColor: activeTab === 'booking' ? '#FFE9A8' : '#f1f5f9',
            background: activeTab === 'booking' ? '#FFD875' : '#fff',
            borderRadius: 8,
            fontWeight: 400
          }}
        >
          Lịch sử đặt lịch
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('order')}
          className="btn"
          style={{
            padding: '8px 14px',
            border: '1px solid',
            borderColor: activeTab === 'order' ? '#FFE9A8' : '#f1f5f9',
            background: activeTab === 'order' ? '#FFD875' : '#fff',
            borderRadius: 8,
            fontWeight: 400
          }}
        >
          Lịch sử mua hàng
        </button>
      </div>

      <div>
        {activeTab === 'booking' ? <ProfileHistory /> : <OrderHistory />}
      </div>
    </div>
  )
}


