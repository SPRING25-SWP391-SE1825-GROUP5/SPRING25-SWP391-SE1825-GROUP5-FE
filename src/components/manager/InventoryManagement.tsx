import { 
  Package,
  DollarSign,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Truck
} from 'lucide-react'

export default function InventoryManagement() {
  // Dữ liệu cho trang kho
  const inventoryStats = [
    {
      title: 'Tổng sản phẩm',
      value: '156',
      unit: 'sản phẩm',
      icon: Package,
      color: 'var(--primary-500)'
    },
    {
      title: 'Giá trị kho',
      value: '245.8',
      unit: 'triệu VNĐ',
      icon: DollarSign,
      color: 'var(--success-500)'
    }
  ]

  const inventoryData = [
    {
      id: 1,
      name: 'Lọc dầu OE 123',
      sku: 'OF-OE123',
      category: 'Lọc dầu',
      supplier: 'Công ty A',
      stock: 45,
      minStock: 10,
      maxStock: 100,
      unit: 'cái',
      cost: 85000
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Quản lý Kho
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{
            padding: '10px 20px',
            border: '1px solid var(--border-primary)',
            background: 'transparent',
            color: 'var(--text-primary)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Truck size={16} />
            Nhập kho
          </button>
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
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Thống kê Kho */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {inventoryStats.map((stat, index) => (
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

      {/* Bảng Kho */}
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
            Danh sách sản phẩm
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
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Sản phẩm</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Mã SKU</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Danh mục</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Tồn kho</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Giá</th>
                <th style={{ textAlign: 'left', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Trạng thái</th>
                <th style={{ textAlign: 'right', padding: '16px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {inventoryData.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: index < inventoryData.length - 1 ? '1px solid var(--border-primary)' : 'none' }}>
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
                        <Package size={20} />
                      </div>
                      <div>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          margin: '0 0 4px 0'
                        }}>
                          {item.name}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'var(--text-secondary)',
                          margin: 0
                        }}>
                          {item.supplier}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {item.sku}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {item.category}
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <p style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: 'var(--text-primary)',
                        margin: '0 0 4px 0'
                      }}>
                        {item.stock} {item.unit}
                      </p>
                      <div style={{
                        width: '80px',
                        height: '6px',
                        background: 'var(--border-primary)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(item.stock / item.maxStock) * 100}%`,
                          height: '100%',
                          background: item.stock < item.minStock ? 'var(--error-500)' : 
                                    item.stock < item.maxStock * 0.3 ? 'var(--warning-500)' : 'var(--success-500)'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: 'var(--text-primary)',
                      margin: 0
                    }}>
                      {(item.cost || 0).toLocaleString()} VNĐ
                    </p>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: item.stock === 0 ? 'var(--error-50)' :
                                item.stock < item.minStock ? 'var(--warning-50)' : 'var(--success-50)',
                      color: item.stock === 0 ? 'var(--error-700)' :
                            item.stock < item.minStock ? 'var(--warning-700)' : 'var(--success-700)'
                    }}>
                      {item.stock === 0 ? 'Hết hàng' :
                       item.stock < item.minStock ? 'Sắp hết' : 'Còn hàng'}
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
