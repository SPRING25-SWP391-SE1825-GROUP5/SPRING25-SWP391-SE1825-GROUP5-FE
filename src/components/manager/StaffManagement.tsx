import { 
  Users, 
  CheckCircle,
  Wrench,
  TrendingUp,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Mail
} from 'lucide-react'

export default function StaffManagement() {
  // Dữ liệu cho trang nhân viên
  const staffStats = [
    {
      title: 'Tổng nhân viên',
      value: '64',
      unit: 'người',
      icon: Users,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đang làm việc',
      value: '58',
      unit: 'người',
      icon: CheckCircle,
      color: 'var(--success-500)'
    },
    {
      title: 'Kỹ thuật viên',
      value: '32',
      unit: 'người',
      icon: Wrench,
      color: 'var(--info-500)'
    },
    {
      title: 'Hiệu suất TB',
      value: '87.5',
      unit: '%',
      icon: TrendingUp,
      color: 'var(--warning-500)'
    }
  ]

  const staffData = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@company.com',
      position: 'Kỹ thuật viên',
      experience: '3 năm',
      branch: 'Quận 1',
      shift: 'Ca sáng (8h-17h)',
      performance: 92,
      status: 'active'
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@company.com',
      position: 'Tư vấn viên',
      experience: '2 năm',
      branch: 'Quận 3',
      shift: 'Ca sáng (8h-17h)',
      performance: 88,
      status: 'active'
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Quản lý Nhân viên
        </h2>
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
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {/* Thống kê Nhân viên */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {staffStats.map((stat, index) => (
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
          </div>
        ))}
      </div>

      {/* Bảng Nhân viên */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: 'var(--text-primary)',
            margin: 0
          }}>
            Danh sách Nhân viên
          </h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              padding: '8px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <Filter size={16} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Lọc</span>
            </div>
            <div style={{
              padding: '8px 12px',
              border: '1px solid var(--border-primary)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <Download size={16} />
              <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Xuất file</span>
            </div>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Nhân viên</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Vị trí</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Chi nhánh</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Hiệu suất</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staffData.map((staff, index) => (
                <tr key={staff.id} style={{ borderBottom: index < staffData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary-50)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-500)',
                        fontWeight: '600',
                        fontSize: '14px'
                      }}>
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          margin: '0 0 4px 0'
                        }}>
                          {staff.name}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Mail size={12} />
                          {staff.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {staff.position}
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      Kinh nghiệm: {staff.experience}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {staff.branch}
                    </p>
                    <p style={{ 
                      fontSize: '12px', 
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      {staff.shift}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: 'var(--border-primary)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${staff.performance}%`,
                          height: '100%',
                          background: staff.performance >= 80 ? 'var(--success-500)' : 
                                    staff.performance >= 60 ? 'var(--warning-500)' : 'var(--error-500)'
                        }} />
                      </div>
                      <span style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        color: staff.performance >= 80 ? 'var(--success-600)' : 
                              staff.performance >= 60 ? 'var(--warning-600)' : 'var(--error-600)'
                      }}>
                        {staff.performance}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: staff.status === 'active' ? 'var(--success-50)' : 'var(--error-50)',
                      color: staff.status === 'active' ? 'var(--success-700)' : 'var(--error-700)'
                    }}>
                      {staff.status === 'active' ? 'Đang làm việc' : 'Nghỉ phép'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}>
                        <Eye size={16} />
                      </button>
                      <button style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                      }}>
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
