import { useState } from 'react'
import { 
  Package,
  DollarSign,
  Plus,
  Filter,
  Download,
  Edit,
  Trash2,
  Truck,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle
} from 'lucide-react'

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Dữ liệu cho trang kho
  const inventoryStats = [
    {
      title: 'Tổng sản phẩm',
      value: '156',
      unit: 'sản phẩm',
      icon: Package,
      color: 'var(--primary-500)',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Giá trị kho',
      value: '245.8',
      unit: 'triệu VNĐ',
      icon: DollarSign,
      color: 'var(--success-500)',
      trend: '+8.5%',
      trendUp: true
    },
    {
      title: 'Sắp hết hàng',
      value: '23',
      unit: 'sản phẩm',
      icon: AlertTriangle,
      color: 'var(--warning-500)',
      trend: '-3',
      trendUp: false
    },
    {
      title: 'Hết hàng',
      value: '5',
      unit: 'sản phẩm',
      icon: AlertCircle,
      color: 'var(--error-500)',
      trend: '+2',
      trendUp: false
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
      cost: 85000,
      lastUpdated: '2025-01-10T10:30:00Z'
    },
    {
      id: 2,
      name: 'Phanh đĩa Brembo',
      sku: 'BR-BR001',
      category: 'Phanh',
      supplier: 'Công ty B',
      stock: 8,
      minStock: 15,
      maxStock: 50,
      unit: 'bộ',
      cost: 2500000,
      lastUpdated: '2025-01-09T14:20:00Z'
    },
    {
      id: 3,
      name: 'Bugi NGK Iridium',
      sku: 'NG-IR001',
      category: 'Bugí',
      supplier: 'Công ty C',
      stock: 0,
      minStock: 20,
      maxStock: 100,
      unit: 'cái',
      cost: 120000,
      lastUpdated: '2025-01-08T09:15:00Z'
    },
    {
      id: 4,
      name: 'Dầu động cơ 5W-30',
      sku: 'OIL-5W30',
      category: 'Dầu nhớt',
      supplier: 'Công ty D',
      stock: 120,
      minStock: 30,
      maxStock: 200,
      unit: 'lít',
      cost: 450000,
      lastUpdated: '2025-01-11T16:45:00Z'
    }
  ]

  const categories = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'Lọc dầu', label: 'Lọc dầu' },
    { value: 'Phanh', label: 'Phanh' },
    { value: 'Bugí', label: 'Bugí' },
    { value: 'Dầu nhớt', label: 'Dầu nhớt' },
    { value: 'Lốp xe', label: 'Lốp xe' },
    { value: 'Ắc quy', label: 'Ắc quy' }
  ]

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  const handleViewItem = (item: any) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const handleEditItem = (item: any) => {
    setFormMode('edit')
    setSelectedItem(item)
    setShowFormModal(true)
  }

  const handleDeleteItem = (item: any) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${item.name}?`)) {
      setSuccess(`Đã xóa sản phẩm ${item.name} thành công`)
    }
  }

  const handleCreateItem = () => {
    setFormMode('create')
    setSelectedItem(null)
    setShowFormModal(true)
  }

  return (
    <div style={{
      padding: '32px',
      background: 'var(--bg-secondary)',
      minHeight: '100vh',
      fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif'
    }}>
      {/* Success/Error Messages */}
      {success && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--success-50)',
          border: '1px solid var(--success-200)',
          color: 'var(--success-700)',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-md)'
        }}>
          <CheckCircle size={16} />
          {success}
        </div>
      )}

      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--error-50)',
          border: '1px solid var(--error-200)',
          color: 'var(--error-700)',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 1001,
          boxShadow: 'var(--shadow-md)'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            margin: '0 0 8px 0'
          }}>
            Quản lý Kho
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Quản lý và theo dõi tồn kho sản phẩm
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => {}}
            style={{
              padding: '12px 20px',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-50)'
              e.currentTarget.style.borderColor = 'var(--primary-300)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)'
              e.currentTarget.style.borderColor = 'var(--border-primary)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <Truck size={18} />
            Nhập kho
          </button>
          <button 
            onClick={handleCreateItem}
            style={{
              padding: '12px 20px',
              background: 'var(--primary-500)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-600)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = 'var(--shadow-md)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary-500)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <Plus size={18} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {inventoryStats.map((stat, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
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
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'var(--text-secondary)',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '24px', 
                    fontWeight: '700', 
                    color: stat.color,
                    lineHeight: '1'
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
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '12px',
                background: stat.trendUp ? 'var(--success-50)' : 'var(--error-50)',
                color: stat.trendUp ? 'var(--success-700)' : 'var(--error-700)',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {stat.trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'var(--bg-card)',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              top: '50%',
              left: '12px',
              transform: 'translateY(-50%)',
              color: 'var(--text-tertiary)'
            }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, SKU, nhà cung cấp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '12px 16px 12px 44px',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary-500)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-primary)'
            }}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ 
            padding: '12px 16px', 
            borderRadius: '8px',
            border: '1px solid var(--border-primary)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            outline: 'none',
            minWidth: '160px'
          }}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div style={{
        overflowX: 'auto',
        background: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ 
              background: 'var(--bg-secondary)',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Sản phẩm</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Mã SKU</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Danh mục</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Tồn kho</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Giá</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Trạng thái</th>
              <th style={{ 
                padding: '20px 16px', 
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <div style={{ fontSize: '48px' }}>📦</div>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
                      {searchTerm ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
                    </p>
                    {searchTerm && (
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((item, i) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: i < filteredData.length - 1 ? '1px solid var(--border-primary)' : 'none',
                    background: 'var(--bg-card)',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-secondary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-card)'
                  }}
                >
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
                          background: item.stock === 0 ? 'var(--error-500)' :
                                    item.stock < item.minStock ? 'var(--warning-500)' : 'var(--success-500)'
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
                            item.stock < item.minStock ? 'var(--warning-700)' : 'var(--success-700)',
                      border: item.stock === 0 ? '1px solid var(--error-200)' :
                             item.stock < item.minStock ? '1px solid var(--warning-200)' : '1px solid var(--success-200)'
                    }}>
                      {item.stock === 0 ? 'Hết hàng' :
                       item.stock < item.minStock ? 'Sắp hết' : 'Còn hàng'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleViewItem(item)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--info-50)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--info-100)'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--info-50)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <Eye size={16} color="var(--info-600)" />
                      </button>
                      <button
                        onClick={() => handleEditItem(item)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--warning-50)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--warning-100)'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--warning-50)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <Edit size={16} color="var(--warning-600)" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'var(--error-50)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--error-100)'
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--error-50)'
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        <Trash2 size={16} color="var(--error-600)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Item Detail Modal */}
      {showItemModal && selectedItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '32px',
            borderRadius: '16px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid var(--border-primary)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border-primary)'
            }}>
              <h3 style={{ 
                margin: 0,
                fontSize: '20px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Chi tiết sản phẩm
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error-50)'
                  e.currentTarget.style.color = 'var(--error-600)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-secondary)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'var(--primary-500)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  <Package size={20} />
                </div>
                <div>
                  <p style={{ 
                    margin: '0 0 4px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    {selectedItem.name}
                  </p>
                  <p style={{ 
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-secondary)'
                  }}>
                    {selectedItem.sku} • {selectedItem.supplier}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <Package size={16} color="var(--primary-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Danh mục</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>{selectedItem.category}</p>
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px'
                }}>
                  <DollarSign size={16} color="var(--success-600)" />
                  <div>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Giá</p>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {selectedItem.cost.toLocaleString()} VNĐ
                    </p>
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px'
              }}>
                <AlertTriangle size={16} color="var(--warning-600)" />
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-tertiary)' }}>Tồn kho</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                    {selectedItem.stock} {selectedItem.unit} (Min: {selectedItem.minStock}, Max: {selectedItem.maxStock})
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-primary)'
            }}>
              <button
                onClick={() => setShowItemModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'var(--primary-500)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-600)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--primary-500)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
