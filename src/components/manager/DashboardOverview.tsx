import { useState } from 'react'
import { 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp,
  BarChart3,
  Wrench
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface DashboardOverviewProps {
  onNavigate: (page: string) => void
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  // Dữ liệu mẫu cho thống kê dashboard
  const stats = [
    {
      title: 'Doanh thu tháng này',
      value: '67.2',
      unit: 'triệu VNĐ',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--success-500)'
    },
    {
      title: 'Chi nhánh đang hoạt động',
      value: '4',
      unit: 'chi nhánh',
      change: '+1',
      changeType: 'positive',
      icon: Building2,
      color: 'var(--primary-500)'
    }
  ]

  const quickActions = [
    {
      title: 'Quản lý chi nhánh',
      description: 'Xem và quản lý các chi nhánh',
      icon: Building2,
      page: 'branches',
      color: 'var(--primary-500)'
    },
    {
      title: 'Quản lý nhân viên',
      description: 'Phân công và quản lý nhân viên',
      icon: Users,
      page: 'staff',
      color: 'var(--success-500)'
    },
    {
      title: 'Quản lý dịch vụ',
      description: 'Quản lý danh mục dịch vụ',
      icon: Wrench,
      page: 'services',
      color: 'var(--info-500)'
    }
  ]

  const branchStatus = [
    {
      id: 1,
      name: 'Chi nhánh Quận 1',
      location: '123 Nguyễn Huệ, Q1',
      staff: 8,
      status: 'active'
    },
    {
      id: 2,
      name: 'Chi nhánh Quận 3',
      location: '456 Lê Văn Sỹ, Q3',
      staff: 6,
      status: 'active'
    }
  ]

  // Dữ liệu biểu đồ cho dashboard
  const revenueData = [
    { month: 'Tháng 1', revenue: 45, profit: 12 },
    { month: 'Tháng 2', revenue: 52, profit: 15 },
    { month: 'Tháng 3', revenue: 48, profit: 13 }
  ]

  const branchPerformanceData = [
    { name: 'Chi nhánh 1', value: 35, color: 'var(--primary-500)' },
    { name: 'Chi nhánh 2', value: 28, color: 'var(--success-500)' }
  ]

  const staffPerformanceData = [
    { staff: 'Nguyễn Văn A', tasks: 25, completed: 23 },
    { staff: 'Trần Thị B', tasks: 30, completed: 28 }
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
          Bảng điều khiển Quản lý
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'var(--text-secondary)',
          margin: '0'
        }}>
          Quản lý chi nhánh và hiệu suất kinh doanh
        </p>
      </div>

      {/* Lưới thống kê */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px',
        width: '100%'
      }}>
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

      {/* Phần biểu đồ */}
      <div style={{ marginBottom: '32px', width: '100%' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)',
          margin: '0 0 24px 0'
        }}>
          Biểu đồ thống kê chi nhánh
        </h2>
        
        {/* Biểu đồ doanh thu */}
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
            Doanh thu hàng tháng
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
              <XAxis 
                dataKey="month" 
                stroke="var(--text-secondary)"
                fontSize={12}
              />
              <YAxis 
                stroke="var(--text-secondary)"
                fontSize={12}
                tickFormatter={(value) => `${value}M`}
              />
              <Tooltip 
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--text-primary)'
                }}
                formatter={(value, name) => [
                  `${value} triệu VNĐ`,
                  name === 'revenue' ? 'Doanh thu' : 'Lợi nhuận'
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--primary-500)"
                fill="var(--primary-50)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="var(--success-500)"
                fill="var(--success-50)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lưới biểu đồ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Biểu đồ hiệu suất chi nhánh */}
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
              Hiệu suất chi nhánh
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={branchPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {branchPerformanceData.map((entry, index) => (
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
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Biểu đồ hiệu suất nhân viên */}
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
              Hiệu suất nhân viên
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={staffPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis 
                  dataKey="staff" 
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
                <Bar dataKey="tasks" fill="var(--primary-500)" name="Số công việc" />
                <Bar dataKey="completed" fill="var(--success-500)" name="Đã hoàn thành" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Lưới nội dung */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', width: '100%' }}>
        {/* Thao tác nhanh */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Thao tác quản lý
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {quickActions.map((action, index) => (
              <div
                key={index}
                onClick={() => onNavigate(action.page)}
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

        {/* Trạng thái chi nhánh */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 24px 0'
          }}>
            Trạng thái chi nhánh
          </h2>
          <div style={{
            background: 'var(--bg-card)',
            borderRadius: '12px',
            border: '1px solid var(--border-primary)',
            overflow: 'hidden'
          }}>
            {branchStatus.map((branch, index) => (
              <div 
                key={branch.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < branchStatus.length - 1 ? '1px solid var(--border-primary)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: branch.status === 'active' ? 'var(--success-500)' : 
                             branch.status === 'maintenance' ? 'var(--warning-500)' : 'var(--error-500)',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: 'var(--text-primary)',
                    margin: '0 0 2px 0'
                  }}>
                    {branch.name}
                  </p>
                  <p style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)',
                    margin: '0'
                  }}>
                    {branch.location} • {branch.staff} nhân viên
                  </p>
                </div>
                <span style={{ 
                  fontSize: '11px', 
                  color: branch.status === 'active' ? 'var(--success-700)' : 
                         branch.status === 'maintenance' ? 'var(--warning-700)' : 'var(--error-700)',
                  whiteSpace: 'nowrap',
                  fontWeight: '500'
                }}>
                  {branch.status === 'active' ? 'Đang hoạt động' : 
                   branch.status === 'maintenance' ? 'Bảo trì' : 'Đã đóng'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}