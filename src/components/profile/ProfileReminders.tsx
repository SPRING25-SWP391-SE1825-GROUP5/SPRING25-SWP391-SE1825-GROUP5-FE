import { useState, useEffect } from 'react'
import { Bell, AlertCircle, Calendar, Wrench, Loader2, Filter, Search } from 'lucide-react'
import { ReminderService, MaintenanceReminder } from '@/services/reminderService'
import { ReminderCard } from '@/components/reminder/ReminderCard'
import toast from 'react-hot-toast'

interface ProfileRemindersProps {
  customerId?: number
}

export default function ProfileReminders({ customerId }: ProfileRemindersProps) {
  const [reminders, setReminders] = useState<MaintenanceReminder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'DUE' | 'OVERDUE' | 'COMPLETED'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadReminders()
  }, [customerId])

  const loadReminders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await ReminderService.list({
        customerId: customerId,
        status: statusFilter === 'all' ? undefined : statusFilter
      })
      setReminders(data)
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách nhắc nhở')
      toast.error('Không thể tải danh sách nhắc nhở')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()
  }, [statusFilter, customerId])

  const filteredReminders = reminders.filter(reminder => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    const vehicleName = `${reminder.vehicle?.vehicleModel?.modelName || ''} ${reminder.vehicle?.licensePlate || ''}`.toLowerCase()
    const serviceName = reminder.service?.serviceName?.toLowerCase() || ''

    return vehicleName.includes(searchLower) || serviceName.includes(searchLower)
  })

  // Sắp xếp: OVERDUE -> DUE -> PENDING -> COMPLETED
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    const statusOrder = { 'OVERDUE': 0, 'DUE': 1, 'PENDING': 2, 'COMPLETED': 3 }
    const orderA = statusOrder[a.status] ?? 4
    const orderB = statusOrder[b.status] ?? 4
    if (orderA !== orderB) return orderA - orderB

    // Nếu cùng status, sắp xếp theo DueDate
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return 0
  })

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'PENDING').length,
    due: reminders.filter(r => r.status === 'DUE').length,
    overdue: reminders.filter(r => r.status === 'OVERDUE').length,
    completed: reminders.filter(r => r.status === 'COMPLETED' || r.isCompleted).length
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 700,
          color: '#1F2937',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <Bell size={28} color="#FFD875" />
          Nhắc nhở bảo dưỡng
        </h2>
        <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
          Quản lý các nhắc nhở bảo dưỡng định kỳ cho phương tiện của bạn
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16,
        marginBottom: 24
      }}>
        <div style={{
          background: '#F3F4F6',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #E5E7EB'
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Tổng số</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937' }}>{stats.total}</div>
        </div>
        <div style={{
          background: '#DBEAFE',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #93C5FD'
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Chờ đến hạn</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#3B82F6' }}>{stats.pending}</div>
        </div>
        <div style={{
          background: '#FEF3C7',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #FCD34D'
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Đến hạn</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#F59E0B' }}>{stats.due}</div>
        </div>
        <div style={{
          background: '#FEE2E2',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #FCA5A5'
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Quá hạn</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#EF4444' }}>{stats.overdue}</div>
        </div>
        <div style={{
          background: '#D1FAE5',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #6EE7B7'
        }}>
          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Đã hoàn thành</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>{stats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          minWidth: 200,
          position: 'relative'
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={18} style={{
              position: 'absolute',
              left: 12,
              color: '#9CA3AF'
            }} />
            <input
              type="text"
              placeholder="Tìm kiếm theo xe, dịch vụ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 40px',
                border: '1px solid #E5E7EB',
                borderRadius: 8,
                fontSize: 14,
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#FFD875'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255, 216, 117, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{
            padding: '10px 16px',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: 14,
            background: '#fff',
            cursor: 'pointer',
            outline: 'none',
            minWidth: 180
          }}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="PENDING">Chờ đến hạn</option>
          <option value="DUE">Đến hạn</option>
          <option value="OVERDUE">Quá hạn</option>
          <option value="COMPLETED">Đã hoàn thành</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: 16,
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: 8,
          color: '#DC2626',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Reminders List */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          color: '#6B7280'
        }}>
          <Loader2 size={32} className="animate-spin" style={{ marginBottom: 12 }} />
          <p>Đang tải danh sách nhắc nhở...</p>
        </div>
      ) : sortedReminders.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <Calendar size={64} color="#9CA3AF" style={{ marginBottom: 16 }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#1F2937', marginBottom: 8 }}>
            {searchTerm || statusFilter !== 'all'
              ? 'Không tìm thấy nhắc nhở phù hợp'
              : 'Không có nhắc nhở nào'
            }
          </h3>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14 }}>
            {searchTerm || statusFilter !== 'all'
              ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
              : 'Các nhắc nhở bảo dưỡng sẽ xuất hiện ở đây sau khi bạn hoàn thành dịch vụ'
            }
          </p>
        </div>
      ) : (
        <div>
          {sortedReminders.map((reminder) => (
            <ReminderCard
              key={reminder.reminderId}
              reminder={reminder}
              onRefresh={loadReminders}
            />
          ))}
        </div>
      )}
    </div>
  )
}

