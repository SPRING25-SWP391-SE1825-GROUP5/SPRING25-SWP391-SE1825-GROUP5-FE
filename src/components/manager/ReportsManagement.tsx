import { 
  DollarSign,
  ShoppingCart,
  Download
} from 'lucide-react'
import {
  LineChart,
  Line,
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

export default function ReportsManagement() {
  // Dữ liệu cho trang báo cáo
  const reportStats = [
    {
      title: 'Doanh thu tháng',
      value: '245.6',
      unit: 'triệu VNĐ',
      change: '+12.5%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đơn hàng',
      value: '1,245',
      unit: 'đơn',
      change: '+8.2%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'var(--success-500)'
    }
  ]

  const revenueReportData = [
    { month: 'Tháng 1', revenue: 45, target: 40 },
    { month: 'Tháng 2', revenue: 52, target: 45 },
    { month: 'Tháng 3', revenue: 48, target: 50 }
  ]

  const serviceCategoryData = [
    { name: 'Bảo dưỡng', value: 35, color: 'var(--primary-500)' },
    { name: 'Sửa chữa', value: 28, color: 'var(--success-500)' }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Báo cáo Chi nhánh
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select style={{
            padding: '10px 16px',
            border: '1px solid var(--border-primary)',
            borderRadius: '8px',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '14px'
          }}>
            <option>Tháng này</option>
            <option>Quý này</option>
            <option>Năm nay</option>
          </select>
          <button style={{
            padding: '10px 20px',
            background: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Tóm tắt Báo cáo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {reportStats.map((stat, index) => (
          <div 
            key={index}
            style={{
              background: 'var(--bg-card)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: stat.color,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={20} />
              </div>
              <div>
                <h3 style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)',
                  margin: '0 0 4px 0',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)'
                  }}>
                    {stat.value}
                  </span>
                  <span style={{ 
                    fontSize: '12px', 
                    color: 'var(--text-secondary)'
                  }}>
                    {stat.unit}
                  </span>
                </div>
              </div>
            </div>
            <div style={{
              padding: '4px 8px',
              borderRadius: '12px',
              background: stat.changeType === 'positive' ? 'var(--success-50)' : 'var(--error-50)',
              color: stat.changeType === 'positive' ? 'var(--success-700)' : 'var(--error-700)',
              fontSize: '12px',
              fontWeight: '600',
              width: 'fit-content'
            }}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Phần Biểu đồ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
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
            <LineChart data={revenueReportData}>
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
                formatter={(value) => [`${value} triệu VNĐ`, 'Doanh thu']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--primary-500)" 
                strokeWidth={2}
                name="Doanh thu"
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="var(--success-500)" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Mục tiêu"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--border-primary)'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: '0 0 20px 0'
          }}>
            Danh mục Dịch vụ
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={serviceCategoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {serviceCategoryData.map((entry, index) => (
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
                formatter={(value, name) => [`${value}%`, name]}
              />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
