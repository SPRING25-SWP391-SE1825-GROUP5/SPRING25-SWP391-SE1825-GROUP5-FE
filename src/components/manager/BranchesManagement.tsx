import {
  Building2,
  CheckCircle,
  DollarSign,
  Users,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Phone
} from 'lucide-react'

export default function BranchesManagement() {
  // Dữ liệu cho trang chi nhánh
  const branchStats = [
    {
      title: 'Tổng số chi nhánh',
      value: '8',
      unit: 'chi nhánh',
      icon: Building2,
      color: 'var(--primary-500)'
    },
    {
      title: 'Đang hoạt động',
      value: '7',
      unit: 'chi nhánh',
      icon: CheckCircle,
      color: 'var(--success-500)'
    },
    {
      title: 'Doanh thu trung bình',
      value: '45.2',
      unit: 'triệu VNĐ',
      icon: DollarSign,
      color: 'var(--info-500)'
    },
    {
      title: 'Nhân viên',
      value: '64',
      unit: 'người',
      icon: Users,
      color: 'var(--warning-500)'
    }
  ]

  const branchesData = [
    {
      id: 1,
      name: 'Chi nhánh Quận 1',
      address: '123 Nguyễn Huệ',
      district: 'Quận 1, TP.HCM',
      phone: '028 3823 4567',
      staffCount: 12,
      manager: '',
      revenue: 125000000,
      revenueChange: 15,
      status: 'active'
    },
    {
      id: 2,
      name: 'Chi nhánh Quận 3',
      address: '456 Lê Văn Sỹ',
      district: 'Quận 3, TP.HCM',
      phone: '028 3823 4568',
      staffCount: 10,
      manager: '',
      revenue: 98000000,
      revenueChange: 8,
      status: 'active'
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Quản lý chi nhánh
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
          Thêm chi nhánh
        </button>
      </div>

      {/* Thống kê chi nhánh */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {branchStats.map((stat, index) => (
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

      {/* Bảng chi nhánh */}
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
            Danh sách chi nhánh
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
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Chi nhánh</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Địa chỉ</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Nhân viên</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Doanh thu</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {branchesData.map((branch, index) => (
                <tr key={branch.id} style={{ borderBottom: index < branchesData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--primary-50)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-500)'
                      }}>
                        <Building2 size={20} />
                      </div>
                      <div>
                        <p style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'var(--text-primary)',
                          margin: '0 0 4px 0'
                        }}>
                          {branch.name}
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Phone size={12} />
                          {branch.phone}
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
                      {branch.address}
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      {branch.district}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {branch.staffCount} nhân viên
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      margin: 0
                    }}>
                      {branch.manager}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--text-primary)',
                      margin: '0 0 4px 0'
                    }}>
                      {(branch.revenue || 0).toLocaleString()} VNĐ
                    </p>
                    <p style={{
                      fontSize: '12px',
                      color: branch.revenueChange >= 0 ? 'var(--success-600)' : 'var(--error-600)',
                      margin: 0
                    }}>
                      {branch.revenueChange >= 0 ? '+' : ''}{branch.revenueChange}%
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background:
                        branch.status === 'active' ? 'var(--success-50)' :
                        branch.status === 'maintenance' ? 'var(--warning-50)' :
                        'var(--error-50)',
                      color:
                        branch.status === 'active' ? 'var(--success-700)' :
                        branch.status === 'maintenance' ? 'var(--warning-700)' :
                        'var(--error-700)'
                    }}>
                      {branch.status === 'active' ? 'Đang hoạt động' :
                       branch.status === 'maintenance' ? 'Bảo trì' : 'Đã đóng'}
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
                      <button style={{
                        padding: '6px',
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--error-500)'
                      }}>
                        <Trash2 size={16} />
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
