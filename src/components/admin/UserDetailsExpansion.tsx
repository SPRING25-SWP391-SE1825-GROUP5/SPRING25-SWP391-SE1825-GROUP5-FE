import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Car, CreditCard } from 'lucide-react'
import UserVehiclesContent from './UserVehiclesContent'
import UserCreditsContent from './UserCreditsContent'

interface UserDetailsExpansionProps {
  userId: number
  customerId: number | null
  onRefresh?: () => void
}

type TabType = 'vehicles' | 'credits' | null

export default function UserDetailsExpansion({ userId, customerId, onRefresh }: UserDetailsExpansionProps) {
  const [activeTab, setActiveTab] = useState<TabType>(null)

  const toggleTab = (tab: TabType) => {
    setActiveTab(activeTab === tab ? null : tab)
  }

  return (
    <tr style={{ background: '#FAFAFA' }}>
      <td colSpan={8} style={{ padding: '12px 16px', borderTop: '1px solid #E5E7EB' }}>
        <div>
          {/* Accordion Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Vehicles Tab */}
            <div style={{ background: '#fff' }}>
              <button
                type="button"
                onClick={() => toggleTab('vehicles')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Car size={16} />
                  Danh sách xe
                </span>
                {activeTab === 'vehicles' ? (
                  <ChevronUp size={18} style={{ color: '#6B7280' }} />
                ) : (
                  <ChevronDown size={18} style={{ color: '#6B7280' }} />
                )}
              </button>
              {activeTab === 'vehicles' && (
                <div style={{ padding: '16px', background: '#fff' }}>
                  <UserVehiclesContent
                    userId={userId}
                    customerId={customerId}
                    onRefresh={onRefresh}
                  />
                </div>
              )}
            </div>

            {/* Service Credits Tab */}
            <div style={{ background: '#fff' }}>
              <button
                type="button"
                onClick={() => toggleTab('credits')}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#374151',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={16} />
                  Service Credits
                </span>
                {activeTab === 'credits' ? (
                  <ChevronUp size={18} style={{ color: '#6B7280' }} />
                ) : (
                  <ChevronDown size={18} style={{ color: '#6B7280' }} />
                )}
              </button>
              {activeTab === 'credits' && (
                <div style={{ padding: '16px', background: '#fff' }}>
                  <UserCreditsContent
                    userId={userId}
                    customerId={customerId}
                    onRefresh={onRefresh}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

