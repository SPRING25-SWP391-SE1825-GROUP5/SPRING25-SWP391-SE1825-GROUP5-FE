import { useState, useEffect } from 'react'
import { useAppSelector } from '@/store/hooks'
import { Plus, Truck, Search } from 'lucide-react'
import { InventoryService, InventoryPart, AvailablePart, AddPartToInventoryRequest, UpdatePartRequest } from '@/services/inventoryService'
import InventoryStats from './InventoryStats'
import InventoryTable from './InventoryTable'
import AddProductModal from './AddProductModal'
import EditProductModal from './EditProductModal'
import ItemDetailModal from './ItemDetailModal'
import Pagination from './Pagination'
import AdvancedFilter from './AdvancedFilter'
import './InventoryManagement.scss'

export default function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [stockStatus, setStockStatus] = useState('all')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })
  const [selectedItem, setSelectedItem] = useState<InventoryPart | null>(null)
  const [showItemModal, setShowItemModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [inventoryData, setInventoryData] = useState<InventoryPart[]>([])
  const [inventoryStats, setInventoryStats] = useState({
    totalParts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)
  
  // Add product modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [availableParts, setAvailableParts] = useState<AvailablePart[]>([])
  const [loadingAvailableParts, setLoadingAvailableParts] = useState(false)
  
  // Edit product modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null)
  const [updatingPart, setUpdatingPart] = useState(false)
  
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    loadInventory()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterCategory])

  const loadInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const centerId = user?.centerId || 2
      const response = await InventoryService.getInventoryByCenter(centerId)
      
      if (response.success) {
        setInventoryData(response.data.parts)
        
        const totalValue = response.data.parts.reduce((sum, part) => sum + (part.unitPrice * part.currentStock), 0)
        const lowStockCount = response.data.parts.filter(part => part.isLowStock).length
        const outOfStockCount = response.data.parts.filter(part => part.isOutOfStock).length
        
        setInventoryStats({
          totalParts: response.data.partsCount,
          totalValue,
          lowStockCount,
          outOfStockCount
        })
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải dữ liệu')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = async () => {
    setShowAddModal(true)
    await loadAvailableParts()
  }

  const closeAddModal = () => {
    setShowAddModal(false)
  }

  const loadAvailableParts = async () => {
    try {
      setLoadingAvailableParts(true)
      const response = await InventoryService.getAvailableParts()
      
      if (response.success) {
        setAvailableParts(response.data.parts)
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Không thể tải danh sách phụ tùng')
    } finally {
      setLoadingAvailableParts(false)
    }
  }

  const handleAddPart = async (partData: AddPartToInventoryRequest) => {
    try {
      setError(null)
      
      const centerId = user?.centerId || 2
      const response = await InventoryService.addPartToInventory(centerId, partData)
      
      if (response.success) {
        setSuccess('Thêm sản phẩm vào kho thành công')
        closeAddModal()
        await loadInventory()
      } else {
        setError(response.message)
      }
    } catch (err) {
      setError('Không thể thêm sản phẩm vào kho')
    }
  }

  const categories = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'Pin', label: 'Pin' },
    { value: 'Động cơ', label: 'Động cơ' },
    { value: 'Phanh', label: 'Phanh' },
    { value: 'Lốp', label: 'Lốp' },
    { value: 'Khác', label: 'Khác' }
  ]

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.partName.toLowerCase().includes(filterCategory.toLowerCase())
    
    // Stock status filter
    let matchesStockStatus = true
    if (stockStatus !== 'all') {
      if (stockStatus === 'in_stock') {
        matchesStockStatus = !item.isOutOfStock && !item.isLowStock
      } else if (stockStatus === 'low_stock') {
        matchesStockStatus = item.isLowStock
      } else if (stockStatus === 'out_of_stock') {
        matchesStockStatus = item.isOutOfStock
      }
    }
    
    // Price range filter
    const matchesPriceRange = (!priceRange.min || item.unitPrice >= priceRange.min) &&
                               (!priceRange.max || item.unitPrice <= priceRange.max)
    
    return matchesSearch && matchesCategory && matchesStockStatus && matchesPriceRange
  })

  const handleReset = () => {
    setSearchTerm('')
    setFilterCategory('all')
    setStockStatus('all')
    setPriceRange({ min: 0, max: 0 })
  }

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  const handleViewItem = (item: InventoryPart) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  const handleEditItem = (item: InventoryPart) => {
    setEditingPart(item)
    setShowEditModal(true)
  }

  const handleUpdatePart = async (partData: UpdatePartRequest) => {
    if (!editingPart) return

    try {
      setUpdatingPart(true)
      setError(null)
      
      const response = await InventoryService.updatePart(editingPart.partId, partData)
      
      if (response.success) {
        setSuccess('Cập nhật thông tin phụ tùng thành công')
        setShowEditModal(false)
        setEditingPart(null)
        await loadInventory()
      } else {
        setError(response.message || 'Không thể cập nhật thông tin phụ tùng')
      }
    } catch (err) {
      setError('Không thể cập nhật thông tin phụ tùng')
    } finally {
      setUpdatingPart(false)
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingPart(null)
  }

  const handleDeleteItem = (item: InventoryPart) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm ${item.partName}?`)) {
      setSuccess(`Đã xóa sản phẩm ${item.partName} thành công`)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="inventory-management">
      {/* Success/Error Messages */}
      {success && (
        <div className="success-message">
          {success}
        </div>
      )}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div className="title-section">
          <h1>Quản lý Kho</h1>
          <p>Quản lý và theo dõi tồn kho sản phẩm</p>
        </div>
        <div className="action-buttons">
          <button className="btn btn-secondary">
            <Truck size={18} />
            Nhập kho
          </button>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Stats */}
      <InventoryStats
        totalParts={inventoryStats.totalParts}
        totalValue={inventoryStats.totalValue}
        lowStockCount={inventoryStats.lowStockCount}
        outOfStockCount={inventoryStats.outOfStockCount}
      />

      {/* Advanced Filters */}
      <AdvancedFilter
        searchTerm={searchTerm}
        filterCategory={filterCategory}
        stockStatus={stockStatus}
        priceRange={priceRange}
        onSearchChange={setSearchTerm}
        onCategoryChange={setFilterCategory}
        onStockStatusChange={setStockStatus}
        onPriceRangeChange={setPriceRange}
        onReset={handleReset}
      />

      {/* Table */}
      <InventoryTable
        data={paginatedData}
        loading={loading}
        error={error}
        onViewItem={handleViewItem}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onRetry={loadInventory}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        isOpen={showItemModal}
        item={selectedItem}
        onClose={() => setShowItemModal(false)}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        part={editingPart}
        onClose={closeEditModal}
        onUpdatePart={handleUpdatePart}
        error={error}
        success={success}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={closeAddModal}
        availableParts={availableParts}
        loadingAvailableParts={loadingAvailableParts}
        onAddPart={handleAddPart}
        error={error}
        success={success}
      />
    </div>
  )
}
