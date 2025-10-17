import { 
  Users, 
  Calendar, 
  CheckCircle,
  BarChart3
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

export default function DashboardContent() {
  // Chart data
  const satisfactionData = [
    { month: 'T1', satisfaction: 85, dissatisfaction: 15 },
    { month: 'T2', satisfaction: 88, dissatisfaction: 12 },
    { month: 'T3', satisfaction: 90, dissatisfaction: 10 },
    { month: 'T4', satisfaction: 87, dissatisfaction: 13 },
    { month: 'T5', satisfaction: 92, dissatisfaction: 8 },
    { month: 'T6', satisfaction: 94, dissatisfaction: 6 }
  ]

  const serviceTypesData = [
    { name: 'Bảo trì', value: 35, color: 'var(--primary-500)' },
    { name: 'Sửa chữa', value: 30, color: 'var(--success-500)' },
    { name: 'Tư vấn', value: 20, color: 'var(--warning-500)' },
    { name: 'Khác', value: 15, color: 'var(--info-500)' }
  ]

  const appointmentStatusData = [
    { status: 'Đã xác nhận', count: 45 },
    { status: 'Chờ xác nhận', count: 12 },
    { status: 'Đã hoàn thành', count: 38 },
    { status: 'Đã hủy', count: 5 }
  ]

  // Mock data for dashboard stats
  const stats = [
    {
      title: 'Khách hàng mới',
      value: '28',
      unit: 'người',
      change: '+12.5%',
      changeType: 'positive',
      icon: Users,
      color: 'var(--success-500)'
    },
    {
      title: 'Lịch hẹn hôm nay',
      value: '15',
      unit: 'cuộc',
      change: '+8.2%',
      changeType: 'positive',
      icon: Calendar,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đơn hàng hoàn thành',
      value: '42',
      unit: 'đơn',
      change: '+15.1%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'var(--info-500)'
    },
    {
      title: 'Đánh giá trung bình',
      value: '4.8',
      unit: '/5',
      change: '+0.3',
      changeType: 'positive',
      icon: BarChart3,
      color: 'var(--warning-500)'
    }
  ]

  const quickActions = [
    {
      title: 'Quản lý khách hàng',
      description: 'Xem và quản lý thông tin khách hàng',
      icon: Users,
      page: 'customers',
      color: 'var(--success-500)'
    },
    {
      title: 'Lịch hẹn',
      description: 'Quản lý lịch hẹn và đặt chỗ',
      icon: Calendar,
      page: 'appointments',
      color: 'var(--primary-500)'
    },
    {
      title: 'Đơn hàng dịch vụ',
      description: 'Xử lý đơn hàng và dịch vụ',
      icon: CheckCircle,
      page: 'service-orders',
      color: 'var(--info-500)'
    },
    {
      title: 'Quản lý kho',
      description: 'Theo dõi tồn kho và sản phẩm',
      icon: BarChart3,
      page: 'inventory',
      color: 'var(--warning-500)'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      title: 'Lịch hẹn mới',
      description: 'Khách hàng Nguyễn Văn A đặt lịch bảo trì',
      time: '10 phút trước',
      type: 'appointment'
    },
    {
      id: 2,
      title: 'Khách hàng mới',
      description: 'Đăng ký tài khoản mới',
      time: '1 giờ trước',
      type: 'customer'
    },
    {
      id: 3,
      title: 'Hoàn thành dịch vụ',
      description: 'Dịch vụ sửa chữa xe Honda Lead',
      time: '2 giờ trước',
      type: 'service'
    },
    {
      id: 4,
      title: 'Tư vấn khách hàng',
      description: 'Tư vấn về gói dịch vụ bảo trì',
      time: '3 giờ trước',
      type: 'customer'
    }
  ]

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '700', 
          color: 'var(--text-primary)',
          margin: '0 0 8px 0'
        }}>
          Staff Dashboard
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Tổng quan công việc nhân viên
        </p>
      </div>

      {/* Stats Grid */}
      <div 
        className="staff-stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
          width: '100%'
        }}
      >
        {stats.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: stat.color,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={24} />
              </div>
              <div style={{
                padding: '4px 8px',
                borderRadius: '20px',
                background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
                color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.change}
              </div>
            </div>
            <h3 style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              margin: '0 0 8px 0',
              fontWeight: '500'
            }}>
              {stat.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ 
                fontSize: '28px', 
                fontWeight: '700', 
                color: 'var(--text-primary)'
              }}>
                {stat.value}
              </span>
              <span style={{ 
                fontSize: '14px', 
                color: 'var(--text-secondary)'
              }}>
                {stat.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 24px 0'
        }}>
          Biểu đồ thống kê
        </h2>
        
        {/* Customer Satisfaction Chart */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid var(--border-primary)',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Mức độ hài lòng khách hàng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  `${value}%`,
                  name === 'satisfaction' ? 'Hài lòng' : 'Không hài lòng'
                ]}
              />
              <Area
                type="monotone"
                dataKey="satisfaction"
                stroke="var(--success-500)"
                fill="var(--success-50)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="dissatisfaction"
                stroke="var(--error-500)"
                fill="var(--error-50)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Service Types Pie Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Loại dịch vụ phổ biến
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                  formatter={(value) => [`${value}%`, 'Tỷ lệ']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Appointment Status Chart */}
          <div style={{
            background: 'var(--bg-card)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: 'var(--text-primary)',
              margin: '0 0 20px 0'
            }}>
              Trạng thái lịch hẹn
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={appointmentStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="status" 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <YAxis 
                  stroke="var(--text-secondary)"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)'
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="var(--primary-500)" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', width: '100%' }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Thao tác nhanh
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                style={{
                  background: 'var(--bg-card)',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: action.color,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <action.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: 'var(--text-primary)',
                    margin: '0 0 4px 0'
                  }}>
                    {action.title}
                  </h3>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Hoạt động gần đây
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {recentActivities.map((activity, index) => (
              <div 
                key={activity.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < recentActivities.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: activity.type === 'appointment' ? 'var(--success-500)' : 
                             activity.type === 'customer' ? 'var(--info-500)' :
                             activity.type === 'service' ? 'var(--warning-500)' : 'var(--primary-500)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0'
                  }}>
                    {activity.title}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {activity.description}
                  </p>
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  color: 'var(--text-tertiary)',
                  whiteSpace: 'nowrap'
                }}>
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
