import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Edit, Trash2, Package, Search } from 'lucide-react'
import { InventoryService, InventoryListItem, InventoryPart, AddPartToInventoryRequest, UpdateInventoryPartRequest, AvailablePart } from '@/services/inventoryService'
import toast from 'react-hot-toast'
import './_inventory-parts-modal.scss'

interface InventoryPartsModalProps {
  isOpen: boolean
  inventory: InventoryListItem | null
  onClose: () => void
}

const InventoryPartsModal: React.FC<InventoryPartsModalProps> = ({
  isOpen,
  inventory,
  onClose
}) => {
  const [parts, setParts] = useState<InventoryPart[]>([])
  const [availableParts, setAvailableParts] = useState<AvailablePart[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingParts, setLoadingParts] = useState(false)
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPart, setEditingPart] = useState<InventoryPart | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const [addFormData, setAddFormData] = useState({
    partId: '',
    currentStock: '',
    minimumStock: ''
  })
  
  const [editFormData, setEditFormData] = useState({
    currentStock: '',
    minimumStock: ''
  })
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && inventory) {
      fetchParts()
      if (showAddForm) {
        fetchAvailableParts()
      }
    }
  }, [isOpen, inventory, showAddForm])

  const fetchParts = async () => {
    if (!inventory) return
    
    try {
      setLoadingParts(true)
      setError(null)
      
      const response = await InventoryService.getInventoryParts(inventory.inventoryId)
      if (response.success) {
        setParts(response.data || [])
      } else {
        setError(response.message || 'Không thể tải danh sách phụ tùng')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể tải danh sách phụ tùng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoadingParts(false)
    }
  }

  const fetchAvailableParts = async () => {
    try {
      setLoadingAvailable(true)
      const response = await InventoryService.getAvailableParts()
      if (response.success) {
        setAvailableParts(response.data.parts || [])
      }
    } catch (err) {

    } finally {
      setLoadingAvailable(false)
    }
  }

  const handleAddPart = async () => {
    if (!inventory) return
    
    // Validate
    const errors: Record<string, string> = {}
    if (!addFormData.partId) {
      errors.partId = 'Vui lòng chọn phụ tùng'
    }
    if (!addFormData.currentStock || parseInt(addFormData.currentStock) <= 0) {
      errors.currentStock = 'Số lượng tồn kho phải lớn hơn 0'
    }
    if (!addFormData.minimumStock || parseInt(addFormData.minimumStock) <= 0) {
      errors.minimumStock = 'Số lượng tối thiểu phải lớn hơn 0'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setFormErrors({})
      
      const request: AddPartToInventoryRequest = {
        partId: parseInt(addFormData.partId),
        currentStock: parseInt(addFormData.currentStock),
        minimumStock: parseInt(addFormData.minimumStock)
      }
      
      const response = await InventoryService.addPartToInventory(inventory.inventoryId, request)
      
      if (response.success) {
        toast.success('Thêm phụ tùng vào kho thành công')
        setAddFormData({ partId: '', currentStock: '', minimumStock: '' })
        setShowAddForm(false)
        await fetchParts()
      } else {
        setError(response.message || 'Không thể thêm phụ tùng')
        toast.error(response.message || 'Không thể thêm phụ tùng')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể thêm phụ tùng'
      setError(errorMessage)
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        err.response.data.errors.forEach((errorMsg: string) => {
          if (errorMsg.includes('PartId')) backendErrors.partId = errorMsg
          if (errorMsg.includes('CurrentStock')) backendErrors.currentStock = errorMsg
          if (errorMsg.includes('MinimumStock')) backendErrors.minimumStock = errorMsg
        })
        if (Object.keys(backendErrors).length > 0) {
          setFormErrors(backendErrors)
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleEditPart = (part: InventoryPart) => {
    setEditingPart(part)
    setEditFormData({
      currentStock: part.currentStock.toString(),
      minimumStock: part.minimumStock.toString()
    })
    setFormErrors({})
  }

  const handleUpdatePart = async () => {
    if (!inventory || !editingPart) return
    
    // Validate
    const errors: Record<string, string> = {}
    if (!editFormData.currentStock || parseInt(editFormData.currentStock) <= 0) {
      errors.currentStock = 'Số lượng tồn kho phải lớn hơn 0'
    }
    if (!editFormData.minimumStock || parseInt(editFormData.minimumStock) <= 0) {
      errors.minimumStock = 'Số lượng tối thiểu phải lớn hơn 0'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setLoading(true)
      setError(null)
      setFormErrors({})
      
      const request: UpdateInventoryPartRequest = {
        currentStock: parseInt(editFormData.currentStock),
        minimumStock: parseInt(editFormData.minimumStock)
      }
      
      const response = await InventoryService.updateInventoryPart(
        inventory.inventoryId,
        editingPart.partId,
        request
      )
      
      if (response.success) {
        toast.success('Cập nhật phụ tùng thành công')
        setEditingPart(null)
        setEditFormData({ currentStock: '', minimumStock: '' })
        await fetchParts()
      } else {
        setError(response.message || 'Không thể cập nhật phụ tùng')
        toast.error(response.message || 'Không thể cập nhật phụ tùng')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật phụ tùng'
      setError(errorMessage)
      
      // Handle validation errors from backend
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        err.response.data.errors.forEach((errorMsg: string) => {
          if (errorMsg.includes('CurrentStock')) backendErrors.currentStock = errorMsg
          if (errorMsg.includes('MinimumStock')) backendErrors.minimumStock = errorMsg
        })
        if (Object.keys(backendErrors).length > 0) {
          setFormErrors(backendErrors)
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePart = async (part: InventoryPart) => {
    if (!inventory) return
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phụ tùng "${part.partName}" khỏi kho?`)) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await InventoryService.removePartFromInventory(
        inventory.inventoryId,
        part.partId
      )
      
      if (response.success) {
        toast.success('Xóa phụ tùng khỏi kho thành công')
        await fetchParts()
      } else {
        setError(response.message || 'Không thể xóa phụ tùng')
        toast.error(response.message || 'Không thể xóa phụ tùng')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa phụ tùng'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
  }

  const filteredParts = parts.filter(part =>
    part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredAvailableParts = availableParts.filter(part =>
    part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen || !inventory) return null

  return createPortal(
    <div className="inventory-parts-modal-overlay" onClick={onClose}>
      <div className="inventory-parts-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="inventory-parts-modal__header">
          <div>
            <h2 className="inventory-parts-modal__title">
              Quản lý phụ tùng - {inventory.centerName}
            </h2>
            <p className="inventory-parts-modal__subtitle">
              Kho ID: #{inventory.inventoryId} • Tổng số phụ tùng: {inventory.partsCount}
            </p>
          </div>
          <button className="inventory-parts-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="inventory-parts-modal__search">
          <div className="search-wrap">
            <Search size={14} className="icon" />
            <input
              type="text"
              placeholder="Tìm kiếm phụ tùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!showAddForm && !editingPart && (
            <button
              className="inventory-parts-modal__add-btn"
              onClick={() => {
                setShowAddForm(true)
                fetchAvailableParts()
              }}
            >
              <Plus size={16} /> Thêm phụ tùng
            </button>
          )}
        </div>

        {/* Add Form */}
        {showAddForm && !editingPart && (
          <div className="inventory-parts-modal__form">
            <h3 className="form-title">Thêm phụ tùng mới</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Phụ tùng *</label>
                <select
                  value={addFormData.partId}
                  onChange={(e) => {
                    setAddFormData(prev => ({ ...prev, partId: e.target.value }))
                    if (formErrors.partId) setFormErrors(prev => ({ ...prev, partId: '' }))
                  }}
                  className={formErrors.partId ? 'error' : ''}
                  disabled={loadingAvailable}
                >
                  <option value="">Chọn phụ tùng</option>
                  {filteredAvailableParts.map(part => (
                    <option key={part.partId} value={part.partId}>
                      {part.partNumber} - {part.partName} ({part.brand})
                    </option>
                  ))}
                </select>
                {formErrors.partId && <span className="form-error">{formErrors.partId}</span>}
              </div>
              <div className="form-group">
                <label>Số lượng tồn kho *</label>
                <input
                  type="number"
                  min="1"
                  value={addFormData.currentStock}
                  onChange={(e) => {
                    setAddFormData(prev => ({ ...prev, currentStock: e.target.value }))
                    if (formErrors.currentStock) setFormErrors(prev => ({ ...prev, currentStock: '' }))
                  }}
                  className={formErrors.currentStock ? 'error' : ''}
                />
                {formErrors.currentStock && <span className="form-error">{formErrors.currentStock}</span>}
              </div>
              <div className="form-group">
                <label>Số lượng tối thiểu *</label>
                <input
                  type="number"
                  min="1"
                  value={addFormData.minimumStock}
                  onChange={(e) => {
                    setAddFormData(prev => ({ ...prev, minimumStock: e.target.value }))
                    if (formErrors.minimumStock) setFormErrors(prev => ({ ...prev, minimumStock: '' }))
                  }}
                  className={formErrors.minimumStock ? 'error' : ''}
                />
                {formErrors.minimumStock && <span className="form-error">{formErrors.minimumStock}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowAddForm(false); setAddFormData({ partId: '', currentStock: '', minimumStock: '' }); setFormErrors({}) }}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleAddPart} disabled={loading}>
                {loading ? 'Đang thêm...' : 'Thêm'}
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {editingPart && (
          <div className="inventory-parts-modal__form">
            <h3 className="form-title">Sửa phụ tùng: {editingPart.partName}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Số lượng tồn kho *</label>
                <input
                  type="number"
                  min="1"
                  value={editFormData.currentStock}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, currentStock: e.target.value }))
                    if (formErrors.currentStock) setFormErrors(prev => ({ ...prev, currentStock: '' }))
                  }}
                  className={formErrors.currentStock ? 'error' : ''}
                />
                {formErrors.currentStock && <span className="form-error">{formErrors.currentStock}</span>}
              </div>
              <div className="form-group">
                <label>Số lượng tối thiểu *</label>
                <input
                  type="number"
                  min="1"
                  value={editFormData.minimumStock}
                  onChange={(e) => {
                    setEditFormData(prev => ({ ...prev, minimumStock: e.target.value }))
                    if (formErrors.minimumStock) setFormErrors(prev => ({ ...prev, minimumStock: '' }))
                  }}
                  className={formErrors.minimumStock ? 'error' : ''}
                />
                {formErrors.minimumStock && <span className="form-error">{formErrors.minimumStock}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setEditingPart(null); setEditFormData({ currentStock: '', minimumStock: '' }); setFormErrors({}) }}>
                Hủy
              </button>
              <button className="btn-primary" onClick={handleUpdatePart} disabled={loading}>
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="inventory-parts-modal__error">
            {error}
          </div>
        )}

        {/* Parts List */}
        <div className="inventory-parts-modal__content">
          {loadingParts ? (
            <div className="loading-state">Đang tải...</div>
          ) : filteredParts.length === 0 ? (
            <div className="empty-state">
              <Package size={32} />
              <p>Không có phụ tùng nào trong kho này</p>
            </div>
          ) : (
            <table className="inventory-parts-table">
              <thead>
                <tr>
                  <th>Mã phụ tùng</th>
                  <th>Tên phụ tùng</th>
                  <th>Thương hiệu</th>
                  <th>Giá</th>
                  <th>Tồn kho</th>
                  <th>Tối thiểu</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map(part => (
                  <tr key={part.inventoryPartId}>
                    <td>{part.partNumber}</td>
                    <td>{part.partName}</td>
                    <td>{part.brand}</td>
                    <td>{formatCurrency(part.unitPrice)}</td>
                    <td className={part.isOutOfStock ? 'out-of-stock' : part.isLowStock ? 'low-stock' : ''}>
                      {part.currentStock}
                    </td>
                    <td>{part.minimumStock}</td>
                    <td>
                      <span className={`stock-badge ${part.isOutOfStock ? 'out' : part.isLowStock ? 'low' : 'normal'}`}>
                        {part.isOutOfStock ? 'Hết hàng' : part.isLowStock ? 'Sắp hết' : 'Đủ'}
                      </span>
                    </td>
                    <td>
                      <div className="parts-actions">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEditPart(part)}
                          disabled={editingPart !== null}
                          title="Sửa"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeletePart(part)}
                          disabled={loading || editingPart !== null}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default InventoryPartsModal

