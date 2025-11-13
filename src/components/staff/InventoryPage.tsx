import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Loader2
} from 'lucide-react'
import { InventoryService, type InventoryListItem, type InventoryPart } from '@/services/inventoryService'
import InventoryCenterSection from './InventoryCenterSection'

type InventoryDisplay = InventoryListItem & { inventoryParts: InventoryPart[]; visibleParts: InventoryPart[] }

const normalizeBrand = (brand?: string | null) => {
  const value = (brand || '').trim()
  return value.length > 0 ? value : 'Khác'
}

export default function InventoryPage() {
  const [inventories, setInventories] = useState<InventoryListItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventorySearchTerm, setInventorySearchTerm] = useState('')
  const [inventoryFilterCategory, setInventoryFilterCategory] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [expandedInventoryId, setExpandedInventoryId] = useState<number | null>(null)

  const loadInventory = async () => {
    setInventoryLoading(true)
    try {
      setError(null)
      const response = await InventoryService.getInventories(1, 100)
      if (response.success && response.data?.inventories) {
        const baseInventories = response.data.inventories
        const inventoriesWithParts = await Promise.all(
          baseInventories.map(async (inventory) => {
            if (inventory.inventoryParts && inventory.inventoryParts.length > 0) {
              return { ...inventory, inventoryParts: inventory.inventoryParts }
            }

            try {
              const detail = await InventoryService.getInventoryById(inventory.inventoryId)
              const parts = detail?.data?.parts ?? detail?.data?.inventoryParts ?? []
              return { ...inventory, inventoryParts: parts }
            } catch (detailError) {
              console.error('Không thể tải chi tiết kho:', inventory.inventoryId, detailError)
              return { ...inventory, inventoryParts: [] }
            }
          })
        )

        setInventories(inventoriesWithParts)
        if (inventoriesWithParts.length > 0) {
          setExpandedInventoryId(inventoriesWithParts[0].inventoryId)
        } else {
          setExpandedInventoryId(null)
        }
      } else {
        setInventories([])
        setExpandedInventoryId(null)
        setError(response.message || 'Không thể tải dữ liệu kho')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu kho'
      setError(message)
      setInventories([])
      setExpandedInventoryId(null)
    } finally {
      setInventoryLoading(false)
    }
  }

  useEffect(() => {
    loadInventory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    inventories.forEach(inventory => {
      const parts = inventory.inventoryParts ?? []
      parts.forEach(part => unique.add(normalizeBrand(part.brand)))
    })

    return [
      { value: 'all', label: 'Tất cả thương hiệu' },
      ...Array.from(unique).sort().map(value => ({ value, label: value }))
    ]
  }, [inventories])

  const hasFilters = inventorySearchTerm.trim() !== '' || inventoryFilterCategory !== 'all'

  const processedInventories: InventoryDisplay[] = useMemo(() => {
    const keyword = inventorySearchTerm.trim().toLowerCase()

    return inventories
      .map(inventory => {
        const parts = inventory.inventoryParts ?? []
        const filteredParts = parts.filter(part => {
          const brand = normalizeBrand(part.brand)
          const matchesCategory = inventoryFilterCategory === 'all' || brand === inventoryFilterCategory
          const matchesSearch = keyword === ''
            ? true
            : [part.partName, part.partNumber, brand].some(value => (value || '').toLowerCase().includes(keyword))
          return matchesCategory && matchesSearch
        })

        const visibleParts = hasFilters ? filteredParts : parts
        return {
          ...inventory,
          inventoryParts: parts,
          visibleParts
        }
      })
      .filter(inventory => (hasFilters ? inventory.visibleParts.length > 0 : true))
  }, [inventories, inventoryFilterCategory, hasFilters, inventorySearchTerm])

  useEffect(() => {
    if (expandedInventoryId === null) return
    const stillVisible = processedInventories.some(inv => inv.inventoryId === expandedInventoryId)
    if (!stillVisible) {
      setExpandedInventoryId(processedInventories.length > 0 ? processedInventories[0].inventoryId : null)
    }
  }, [expandedInventoryId, processedInventories])

  const totalVisibleParts = processedInventories.reduce((count, inventory) => count + inventory.visibleParts.length, 0)

  const formatCurrency = (value: number) => {
    if (!value || Number.isNaN(value)) return '0 ₫'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

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
            Theo dõi tồn kho theo từng chi nhánh
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
            placeholder="Tìm kiếm theo tên phụ tùng, mã, thương hiệu..."
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
            minWidth: '200px'
          }}
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory content */}
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
      ) : error ? (
        <div style={{
          textAlign: 'center',
          color: 'var(--error-500)',
          padding: '40px',
          border: '1px solid var(--error-200)',
          borderRadius: '12px',
          background: 'var(--error-50)'
        }}>
          {error}
        </div>
      ) : processedInventories.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          borderRadius: '12px',
          border: '1px dashed var(--border-primary)',
          color: 'var(--text-secondary)'
        }}>
          {hasFilters
            ? 'Không tìm thấy phụ tùng nào phù hợp với bộ lọc.'
            : 'Hiện chưa có dữ liệu tồn kho.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {processedInventories.map(inventory => (
            <InventoryCenterSection
              key={inventory.inventoryId}
              inventory={inventory}
              parts={inventory.visibleParts}
              isExpanded={expandedInventoryId === inventory.inventoryId}
              onToggle={() => setExpandedInventoryId(prev => prev === inventory.inventoryId ? null : inventory.inventoryId)}
              formatCurrency={formatCurrency}
            />
          ))}
          {hasFilters && totalVisibleParts === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
              Không có phụ tùng nào trùng khớp.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
