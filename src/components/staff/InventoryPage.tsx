import { useState, useEffect } from 'react'
import { 
  Search, 
  Package, 
  Loader2
} from 'lucide-react'

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventorySearchTerm, setInventorySearchTerm] = useState('')
  const [inventoryFilterCategory, setInventoryFilterCategory] = useState('all')

  // Inventory items data
  const inventoryData = [
    {
      id: 1,
      name: 'Lọc dầu OE 123',
      sku: 'OF-OE123',
      category: 'Lọc dầu',
      stock: 45,
      minStock: 10,
      maxStock: 100,
      unit: 'cái',
      cost: 85000,
      status: 'in-stock'
    },
    {
      id: 2,
      name: 'Phanh trước Brembo',
      sku: 'BR-PT001',
      category: 'Phanh',
      stock: 8,
      minStock: 15,
      maxStock: 50,
      unit: 'bộ',
      cost: 2500000,
      status: 'low-stock'
    },
    {
      id: 3,
      name: 'Bugí NGK BKR6E',
      sku: 'NG-BKR6E',
      category: 'Bugí',
      stock: 0,
      minStock: 5,
      maxStock: 30,
      unit: 'cái',
      cost: 45000,
      status: 'out-of-stock'
    },
    {
      id: 4,
      name: 'Dầu nhớt 5W-30',
      sku: 'OIL-5W30',
      category: 'Dầu nhớt',
      stock: 120,
      minStock: 20,
      maxStock: 200,
      unit: 'lít',
      cost: 180000,
      status: 'in-stock'
    },
    {
      id: 5,
      name: 'Lọc gió K&N',
      sku: 'KN-AF001',
      category: 'Lọc dầu',
      stock: 25,
      minStock: 8,
      maxStock: 60,
      unit: 'cái',
      cost: 320000,
      status: 'in-stock'
    },
    {
      id: 6,
      name: 'Phanh sau OEM',
      sku: 'OEM-PS002',
      category: 'Phanh',
      stock: 3,
      minStock: 10,
      maxStock: 40,
      unit: 'bộ',
      cost: 1800000,
      status: 'low-stock'
    },
    {
      id: 7,
      name: 'Bugí Denso Iridium',
      sku: 'DN-IR001',
      category: 'Bugí',
      stock: 15,
      minStock: 5,
      maxStock: 25,
      unit: 'cái',
      cost: 75000,
      status: 'in-stock'
    },
    {
      id: 8,
      name: 'Dầu nhớt 10W-40',
      sku: 'OIL-10W40',
      category: 'Dầu nhớt',
      stock: 0,
      minStock: 15,
      maxStock: 100,
      unit: 'lít',
      cost: 160000,
      status: 'out-of-stock'
    },
    {
      id: 9,
      name: 'Lọc dầu Mann',
      sku: 'MN-OF003',
      category: 'Lọc dầu',
      stock: 60,
      minStock: 12,
      maxStock: 80,
      unit: 'cái',
      cost: 95000,
      status: 'in-stock'
    },
    {
      id: 10,
      name: 'Phanh đĩa Brembo',
      sku: 'BR-DISC001',
      category: 'Phanh',
      stock: 12,
      minStock: 8,
      maxStock: 35,
      unit: 'cái',
      cost: 1200000,
      status: 'in-stock'
    }
  ]

  // Load inventory data
  const loadInventory = async () => {
    setInventoryLoading(true)
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Use mock data
      setInventoryItems(inventoryData)
    } catch (err) {

    } finally {
      setInventoryLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
  }, [])

  const categories = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'Lọc dầu', label: 'Lọc dầu' },
    { value: 'Phanh', label: 'Phanh' },
    { value: 'Bugí', label: 'Bugí' },
    { value: 'Dầu nhớt', label: 'Dầu nhớt' }
  ]

  const filteredInventory = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(inventorySearchTerm.toLowerCase())
    const matchesCategory = inventoryFilterCategory === 'all' || item.category === inventoryFilterCategory
    
    return matchesSearch && matchesCategory
  })

  return (
    <div>
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
            Quản lý kho
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'var(--text-secondary)',
            margin: '0'
          }}>
            Theo dõi tồn kho và quản lý sản phẩm
          </p>
        </div>
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
            placeholder="Tìm kiếm theo tên, SKU..."
            value={inventorySearchTerm}
            onChange={(e) => setInventorySearchTerm(e.target.value)}
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
          value={inventoryFilterCategory}
          onChange={(e) => setInventoryFilterCategory(e.target.value)}
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
      {inventoryLoading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Loader2 size={32} className="animate-spin" color="var(--primary-500)" />
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Đang tải dữ liệu...</p>
        </div>
      ) : (
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
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ 
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
                        {inventorySearchTerm ? 'Không tìm thấy sản phẩm nào' : 'Chưa có sản phẩm nào'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: i < filteredInventory.length - 1 ? '1px solid var(--border-primary)' : 'none',
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
