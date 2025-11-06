import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  Edit,
  X,
  Plus,
  CheckCircle,
  Search,
  Eye,
  Settings,
  List,
  BarChart2,
  Download,
  EyeOff,
  SlidersHorizontal,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ToggleLeft,
  ToggleRight,
  Circle,
  AlertCircle,
  Trash2,
  Power,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { ServiceChecklistTemplateService, ServiceChecklistTemplate, GetItemsResponse, TemplateItemDto } from '@/services/serviceChecklistTemplateService'
import { ServiceManagementService } from '@/services/serviceManagementService'
import { PartService, Part } from '@/services/partService'
import toast from 'react-hot-toast'
import TemplateFormModal from '@/components/admin/TemplateFormModal'
import './ServiceTemplateManagement.scss'

export default function ServiceTemplateManagement() {
  const [templates, setTemplates] = useState<ServiceChecklistTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // Dropdown states
  const [openStatusMenu, setOpenStatusMenu] = useState(false)
  const [isPageSizeDropdownOpen, setIsPageSizeDropdownOpen] = useState(false)
  const statusRef = useRef<HTMLDivElement | null>(null)
  const pageSizeRef = useRef<HTMLDivElement>(null)

  // Modal and operation states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceChecklistTemplate | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [activating, setActivating] = useState<number | null>(null)

  // Expanded rows for detail view
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [loadingItems, setLoadingItems] = useState<Record<number, boolean>>({})
  const [templateItemsMap, setTemplateItemsMap] = useState<Record<number, GetItemsResponse>>({})

  // Parts management states
  const [showAddPartsModal, setShowAddPartsModal] = useState(false)
  const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null)
  const [selectedPartIds, setSelectedPartIds] = useState<Record<number, Set<number>>>({})
  const [addingParts, setAddingParts] = useState(false)
  const [removingParts, setRemovingParts] = useState<Record<number, boolean>>({})
  const [availableParts, setAvailableParts] = useState<Part[]>([])
  const [loadingParts, setLoadingParts] = useState<Record<number, boolean>>({})
  const [searchPartsTerm, setSearchPartsTerm] = useState<Record<number, string>>({})

  // Inline row states
  const [showAddRowForTemplate, setShowAddRowForTemplate] = useState<number | null>(null)
  const [addingRowTemplateId, setAddingRowTemplateId] = useState<number | null>(null)
  const [availablePartsForTemplate, setAvailablePartsForTemplate] = useState<Record<number, Part[]>>({})
  const [selectedPartsForRow, setSelectedPartsForRow] = useState<Record<number, Set<number>>>({})

  useEffect(() => {
    loadTemplates()
  }, [currentPage, statusFilter, searchTerm])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusRef.current && !statusRef.current.contains(event.target as Node)) {
        setOpenStatusMenu(false)
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(event.target as Node)) {
        setIsPageSizeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await ServiceChecklistTemplateService.getAllTemplates()
      let allTemplates = response.items || []

      // Apply search filter
      if (searchTerm) {
        allTemplates = allTemplates.filter(t =>
          t.templateName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        const isActive = statusFilter === 'active'
        allTemplates = allTemplates.filter(t => t.isActive === isActive)
      }

      setTotalItems(allTemplates.length)

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedTemplates = allTemplates.slice(startIndex, endIndex)

      setTemplates(paginatedTemplates)
    } catch (err: any) {
      setError('Không thể tải danh sách mẫu checklist: ' + (err.message || 'Unknown error'))
      setTemplates([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalItems / pageSize)
  const pageSizeOptions = [5, 10, 20, 50]

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Handler for toggling row expansion
  const handleToggleRow = async (template: ServiceChecklistTemplate) => {
    const templateId = template.templateID || template.templateId
    if (!templateId) return

    const isExpanded = expandedRows.has(templateId)

    if (isExpanded) {
      // Collapse
      const newExpanded = new Set(expandedRows)
      newExpanded.delete(templateId)
      setExpandedRows(newExpanded)
    } else {
      // Expand - load items if not already loaded
      setExpandedRows(new Set([...expandedRows, templateId]))

      if (!templateItemsMap[templateId]) {
        try {
          setLoadingItems(prev => ({ ...prev, [templateId]: true }))
          const itemsResponse = await ServiceChecklistTemplateService.getTemplateItemsResponse(templateId)
          setTemplateItemsMap(prev => ({ ...prev, [templateId]: itemsResponse }))
        } catch (err: any) {
          toast.error('Không thể tải danh sách phụ tùng: ' + (err.message || 'Unknown error'))
          // Collapse on error
          const newExpanded = new Set(expandedRows)
          newExpanded.delete(templateId)
          setExpandedRows(newExpanded)
        } finally {
          setLoadingItems(prev => ({ ...prev, [templateId]: false }))
        }
      }
    }
  }

  // Handler for edit template
  const handleEdit = (template: ServiceChecklistTemplate) => {
    setSelectedTemplate(template)
    setShowEditModal(true)
  }

  // Handler for delete template
  const handleDelete = async (template: ServiceChecklistTemplate) => {
    const templateId = template.templateID || template.templateId
    if (!templateId) return

    if (!window.confirm(`Bạn có chắc chắn muốn xóa template "${template.templateName}"?`)) {
      return
    }

    try {
      setDeleting(true)
      await ServiceChecklistTemplateService.deleteTemplate(templateId)
      toast.success('Đã xóa template thành công')
      await loadTemplates()
    } catch (err: any) {
      toast.error('Không thể xóa template: ' + (err.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  // Handler for activate/deactivate template
  const handleToggleActive = async (template: ServiceChecklistTemplate) => {
    const templateId = template.templateID || template.templateId
    if (!templateId) return

    const newActiveState = !template.isActive

    try {
      setActivating(templateId)
      await ServiceChecklistTemplateService.activateTemplate(templateId, newActiveState)
      toast.success(newActiveState ? 'Đã kích hoạt template' : 'Đã vô hiệu hóa template')

      // Optimistic update
      setTemplates(prev => prev.map(t =>
        (t.templateID || t.templateId) === templateId
          ? { ...t, isActive: newActiveState }
          : t
      ))

      // Refresh to ensure consistency
      await loadTemplates()
    } catch (err: any) {
      toast.error('Không thể thay đổi trạng thái template: ' + (err.message || 'Unknown error'))
    } finally {
      setActivating(null)
    }
  }

  // Handler for toggling inline add row
  const handleToggleAddRow = async (templateId: number) => {
    const isShowing = showAddRowForTemplate === templateId

    if (isShowing) {
      // Close row
      setShowAddRowForTemplate(null)
      setSearchPartsTerm(prev => ({ ...prev, [templateId]: '' }))
      setSelectedPartsForRow(prev => ({ ...prev, [templateId]: new Set() }))
    } else {
      // Open row and load available parts
      setShowAddRowForTemplate(templateId)
      setSearchPartsTerm(prev => ({ ...prev, [templateId]: '' }))
      setSelectedPartsForRow(prev => ({ ...prev, [templateId]: new Set() }))

      // Load available parts if not already loaded
      if (!availablePartsForTemplate[templateId]) {
        try {
          setLoadingParts(prev => ({ ...prev, [templateId]: true }))
          const response = await PartService.getPartAvailability({ pageSize: 1000 })
          // Filter out parts that are already in the template
          const existingPartIds = new Set(templateItemsMap[templateId]?.items.map(i => i.partId) || [])
          const filteredParts = response.data.filter(p => !existingPartIds.has(p.partId))
          setAvailablePartsForTemplate(prev => ({ ...prev, [templateId]: filteredParts }))
        } catch (err: any) {
          toast.error('Không thể tải danh sách phụ tùng: ' + (err.message || 'Unknown error'))
        } finally {
          setLoadingParts(prev => ({ ...prev, [templateId]: false }))
        }
      }
    }
  }

  // Handler for opening add parts modal (kept for backward compatibility if needed)
  const handleOpenAddPartsModal = async (templateId: number) => {
    setCurrentTemplateId(templateId)
    setShowAddPartsModal(true)
    setSearchPartsTerm(prev => ({ ...prev, [templateId]: '' }))

    // Load available parts
    try {
      setLoadingParts(prev => ({ ...prev, [templateId]: true }))
      const response = await PartService.getPartAvailability({ pageSize: 1000 })
      // Filter out parts that are already in the template
      const existingPartIds = new Set(templateItemsMap[templateId]?.items.map(i => i.partId) || [])
      const filteredParts = response.data.filter(p => !existingPartIds.has(p.partId))
      setAvailableParts(filteredParts)
    } catch (err: any) {
      toast.error('Không thể tải danh sách phụ tùng: ' + (err.message || 'Unknown error'))
    } finally {
      setLoadingParts(prev => ({ ...prev, [templateId]: false }))
    }
  }

  // Handler for adding parts batch (inline row)
  const handleAddPartsBatchInline = async (templateId: number, partIds: number[]) => {
    if (partIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
      return
    }

    try {
      setAddingRowTemplateId(templateId)
      const response = await ServiceChecklistTemplateService.addPartsBatch(templateId, partIds)

      const successCount = response.results?.filter((r: any) => r.success).length || 0
      const errorCount = response.results?.filter((r: any) => !r.success).length || 0

      if (errorCount > 0) {
        const errorMessages = response.results
          ?.filter((r: any) => !r.success)
          .map((r: any) => r.message || 'Lỗi không xác định')
          .join(', ') || ''

        toast.error(
          `Đã thêm ${successCount}/${partIds.length} phụ tùng. ${errorCount} phụ tùng không thể thêm: ${errorMessages}`,
          { duration: 5000 }
        )
      } else {
        toast.success(`Đã thêm ${partIds.length} phụ tùng thành công`)
      }

      const itemsResponse = await ServiceChecklistTemplateService.getTemplateItemsResponse(templateId)
      setTemplateItemsMap(prev => ({ ...prev, [templateId]: itemsResponse }))

      setShowAddRowForTemplate(null)
      setSelectedPartsForRow(prev => ({ ...prev, [templateId]: new Set() }))

      const addedPartIds = new Set(partIds)
      setAvailablePartsForTemplate(prev => ({
        ...prev,
        [templateId]: (prev[templateId] || []).filter(p => !addedPartIds.has(p.partId))
      }))
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi không xác định'
      const detailedError = err.response?.data?.errors?.join(', ') || ''

      toast.error(
        `Không thể thêm phụ tùng: ${errorMessage}${detailedError ? ` (${detailedError})` : ''}`,
        { duration: 5000 }
      )
    } finally {
      setAddingRowTemplateId(null)
    }
  }

  // Handler for adding parts batch (modal - kept for backward compatibility)
  const handleAddPartsBatch = async (templateId: number, partIds: number[]) => {
    if (partIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
      return
    }

    try {
      setAddingParts(true)
      const response = await ServiceChecklistTemplateService.addPartsBatch(templateId, partIds)

      if (response.errors && response.errors.length > 0) {
        toast.error(`Đã thêm ${response.results.filter((r: any) => r.success).length}/${partIds.length} phụ tùng. Một số phụ tùng không thể thêm.`)
      } else {
        toast.success(`Đã thêm ${partIds.length} phụ tùng thành công`)
      }

      // Refresh items
      const itemsResponse = await ServiceChecklistTemplateService.getTemplateItemsResponse(templateId)
      setTemplateItemsMap(prev => ({ ...prev, [templateId]: itemsResponse }))

      setShowAddPartsModal(false)
      setCurrentTemplateId(null)
    } catch (err: any) {
      toast.error('Không thể thêm phụ tùng: ' + (err.message || 'Unknown error'))
    } finally {
      setAddingParts(false)
    }
  }

  // Handler for removing parts batch
  const handleRemovePartsBatch = async (templateId: number, partIds: number[]) => {
    if (partIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng để xóa')
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${partIds.length} phụ tùng?`)) {
      return
    }

    try {
      setRemovingParts(prev => ({ ...prev, [templateId]: true }))
      const response = await ServiceChecklistTemplateService.removePartsBatch(templateId, partIds)

      if (response.errors && response.errors.length > 0) {
        toast.error(`Đã xóa ${response.results.filter((r: any) => r.success).length}/${partIds.length} phụ tùng. Một số phụ tùng không thể xóa.`)
      } else {
        toast.success(`Đã xóa ${partIds.length} phụ tùng thành công`)
      }

      // Refresh items
      const itemsResponse = await ServiceChecklistTemplateService.getTemplateItemsResponse(templateId)
      setTemplateItemsMap(prev => ({ ...prev, [templateId]: itemsResponse }))

      // Clear selections
      setSelectedPartIds(prev => ({ ...prev, [templateId]: new Set() }))
    } catch (err: any) {
      toast.error('Không thể xóa phụ tùng: ' + (err.message || 'Unknown error'))
    } finally {
      setRemovingParts(prev => ({ ...prev, [templateId]: false }))
    }
  }

  // Handler for toggling part selection
  const handleTogglePartSelection = (templateId: number, partId: number) => {
    setSelectedPartIds(prev => {
      const current = prev[templateId] || new Set()
      const updated = new Set(current)
      if (updated.has(partId)) {
        updated.delete(partId)
      } else {
        updated.add(partId)
      }
      return { ...prev, [templateId]: updated }
    })
  }

  // Handler for selecting all parts in a template
  const handleSelectAllParts = (templateId: number) => {
    const items = templateItemsMap[templateId]
    if (!items || items.items.length === 0) return

    const allPartIds = new Set(items.items.map(i => i.partId))
    setSelectedPartIds(prev => ({ ...prev, [templateId]: allPartIds }))
  }

  // Handler for clearing part selection
  const handleClearPartSelection = (templateId: number) => {
    setSelectedPartIds(prev => ({ ...prev, [templateId]: new Set() }))
  }

  // Handler for upsert items (cập nhật toàn bộ items)
  const handleUpsertItems = async (templateId: number, items: TemplateItemDto[]) => {
    try {
      await ServiceChecklistTemplateService.upsertItems(templateId, items)
      toast.success('Đã cập nhật danh sách phụ tùng thành công')

      // Refresh items
      const itemsResponse = await ServiceChecklistTemplateService.getTemplateItemsResponse(templateId)
      setTemplateItemsMap(prev => ({ ...prev, [templateId]: itemsResponse }))
    } catch (err: any) {
      toast.error('Không thể cập nhật danh sách phụ tùng: ' + (err.message || 'Unknown error'))
      throw err
    }
  }

  return (
    <div className="service-template-management">
      {/* Toolbar */}
      <div className="users-toolbar">
        <div className="toolbar-top">
          <div className="toolbar-left">
            <button type="button" className="toolbar-chip"><List size={14}/> Bảng</button>
            <button type="button" className="toolbar-chip is-active"><BarChart2 size={14}/> Bảng điều khiển</button>
            <button type="button" className="toolbar-chip"><FileText size={14}/> Danh sách</button>
            <div className="toolbar-sep"></div>
          </div>
          <div className="toolbar-right">
            <div className="toolbar-search">
              <span className="icon"><Search size={16}/></span>
              <input
                placeholder="Tìm kiếm mẫu checklist"
                value={searchTerm}
                onChange={(e) => { setCurrentPage(1); setSearchTerm(e.target.value) }}
                onFocus={e => e.target.classList.add('search-input-focus')}
                onBlur={e => e.target.classList.remove('search-input-focus')}
              />
              <span className="search-underline"></span>
            </div>
            <div className="toolbar-actions" style={{marginLeft:'auto'}}>
              <button type="button" className="toolbar-btn"><EyeOff size={14}/> Ẩn</button>
              <button type="button" className="toolbar-btn"><SlidersHorizontal size={14}/> Tuỳ chỉnh</button>
              <button type="button" className="toolbar-btn"><Download size={14}/> Xuất</button>
              <button type="button" className="accent-button" onClick={() => setShowCreateModal(true)}><Plus size={16}/> Thêm mẫu checklist</button>
            </div>
          </div>
        </div>

        <div className="toolbar-filters">
          {/* Trạng thái */}
          <div className="pill-select" ref={statusRef}>
            <button
              type="button"
              className="pill-trigger"
              onClick={() => { setOpenStatusMenu(!openStatusMenu) }}
            >
              <CheckCircle size={14} style={{marginRight:6}}/>
              {statusOptions.find(o => o.value === statusFilter)?.label || 'Tất cả trạng thái'}
              <svg className="caret" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <ul className={`pill-menu ${openStatusMenu ? 'show' : ''}`}>
              {statusOptions.map(opt => (
                <li
                  key={opt.value}
                  className={`pill-item ${statusFilter === opt.value ? 'active' : ''}`}
                  onClick={() => { setStatusFilter(opt.value); setCurrentPage(1); setOpenStatusMenu(false); }}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          </div>

          <button type="button" className="toolbar-chip"><Plus size={14}/> Thêm bộ lọc</button>
        </div>
      </div>

      {/* Content */}
      <div className="service-template-management__content">
        {loading ? (
          <div className="service-template-management__loading">
            <div className="service-template-management__loading-spinner" />
            <p className="service-template-management__loading-text">Đang tải mẫu checklist...</p>
          </div>
        ) : error ? (
          <div className="service-template-management__error">
            <div className="service-template-management__error-icon" />
            <p className="service-template-management__error-text">{error}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="service-template-management__empty">
            <div className="service-template-management__empty-icon">
              <FileText size={32} />
            </div>
            <h4 className="service-template-management__empty-title">
              Không tìm thấy mẫu checklist nào
            </h4>
            <p className="service-template-management__empty-text">
              Thử thay đổi bộ lọc hoặc tạo mẫu checklist mới
            </p>
          </div>
        ) : (
          <div className="parts-table-wrapper" style={{ overflow: 'auto' }}>
            <table className="parts-table service-template-management__table">
              <thead className="cm-table-head">
                <tr>
                  <th className="cm-th">
                    <span className="th"><FileText size={16} /> <span>Tên mẫu</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><FileText size={15} /> <span>Mô tả</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><CheckCircle size={15} /> <span>Trạng thái</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><Calendar size={15} /> <span>Ngày tạo</span></span>
                  </th>
                  <th className="cm-th">
                    <span className="th"><Settings size={15} /> <span>Thao tác</span></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => {
                  const templateId = template.templateID || template.templateId || 0
                  const isExpanded = expandedRows.has(templateId)
                  const items = templateItemsMap[templateId]
                  const isLoading = loadingItems[templateId]

                  return (
                    <React.Fragment key={templateId}>
                      <tr
                        onClick={() => handleToggleRow(template)}
                        style={{ cursor: 'pointer' }}
                        className="service-template-management__row"
                      >
                        <td className="service-template-management__table td">
                          <div className="service-template-management__template-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isExpanded ? (
                              <ChevronUp size={16} style={{ color: '#6b7280' }} />
                            ) : (
                              <ChevronDown size={16} style={{ color: '#6b7280' }} />
                            )}
                            <span className="service-template-management__template-name" style={{ fontWeight: 400 }}>
                              {template.templateName}
                            </span>
                          </div>
                        </td>
                        <td className="service-template-management__table td service-template-management__table td--secondary">
                          <div className="service-template-management__template-description">
                            {template.description || 'Không có mô tả'}
                          </div>
                        </td>
                        <td className="service-template-management__table td service-template-management__table td--center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleActive(template)
                            }}
                            disabled={activating === templateId}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: activating === templateId ? 'wait' : 'pointer',
                              padding: 0
                            }}
                          >
                            <div className={`status-badge ${template.isActive ? 'status-badge--active' : 'status-badge--inactive'}`}>
                              <span className="dot" /> {template.isActive ? 'Hoạt động' : 'Không hoạt động'}
                            </div>
                          </button>
                        </td>
                        <td className="service-template-management__table td service-template-management__table td--secondary">
                          {formatDate(template.createdAt)}
                        </td>
                        <td className="service-template-management__table td">
                          <div className="service-template-management__actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleEdit(template)}
                              className="service-template-management__action-button"
                              title="Sửa mẫu"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleActive(template)
                              }}
                              className="service-template-management__action-button"
                              title={template.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              disabled={activating === templateId}
                            >
                              <Power size={16} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(template)
                              }}
                              className="service-template-management__action-button"
                              title="Xóa mẫu"
                              disabled={deleting}
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: '0', backgroundColor: '#f9fafb' }}>
                            <div style={{ padding: '20px' }}>
                              {isLoading ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                  <p>Đang tải danh sách phụ tùng...</p>
                                </div>
                              ) : items && items.items.length > 0 ? (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>
                                      Danh sách phụ tùng ({items.items.length})
                                    </h4>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      {selectedPartIds[templateId] && selectedPartIds[templateId].size > 0 && (
                                        <>
                                          <button
                                            onClick={() => {
                                              const partIds = Array.from(selectedPartIds[templateId])
                                              handleRemovePartsBatch(templateId, partIds)
                                            }}
                                            disabled={removingParts[templateId]}
                                            style={{
                                              padding: '6px 12px',
                                              fontSize: '13px',
                                              background: '#ef4444',
                                              color: '#fff',
                                              border: 'none',
                                              borderRadius: '6px',
                                              cursor: removingParts[templateId] ? 'wait' : 'pointer',
                                              opacity: removingParts[templateId] ? 0.6 : 1
                                            }}
                                          >
                                            {removingParts[templateId] ? 'Đang xóa...' : `Xóa đã chọn (${selectedPartIds[templateId].size})`}
                                          </button>
                                          <button
                                            onClick={() => handleClearPartSelection(templateId)}
                                            style={{
                                              padding: '6px 12px',
                                              fontSize: '13px',
                                              background: '#e5e7eb',
                                              color: '#1a1a1a',
                                              border: 'none',
                                              borderRadius: '6px',
                                              cursor: 'pointer'
                                            }}
                                          >
                                            Bỏ chọn
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => handleToggleAddRow(templateId)}
                                        style={{
                                          padding: '6px 12px',
                                          fontSize: '13px',
                                          background: showAddRowForTemplate === templateId ? '#ef4444' : '#fde68a',
                                          color: '#1a1a1a',
                                          border: 'none',
                                          borderRadius: '6px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                      >
                                        <Plus size={14} /> {showAddRowForTemplate === templateId ? 'Đóng' : 'Thêm phụ tùng'}
                                      </button>
                                    </div>
                                  </div>
                                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead style={{ background: '#f9fafb' }}>
                                        <tr>
                                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40px' }}>
                                            <input
                                              type="checkbox"
                                              checked={selectedPartIds[templateId]?.size === items.items.length && items.items.length > 0}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  handleSelectAllParts(templateId)
                                                } else {
                                                  handleClearPartSelection(templateId)
                                                }
                                              }}
                                              style={{ cursor: 'pointer' }}
                                            />
                                          </th>
                                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Mã số</th>
                                          <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Thương hiệu</th>
                                          <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Giá</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {items.items.map((item, index) => (
                                          <tr key={item.itemId} style={{ borderBottom: index < items.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                            <td style={{ padding: '12px' }}>
                                              <input
                                                type="checkbox"
                                                checked={selectedPartIds[templateId]?.has(item.partId) || false}
                                                onChange={() => handleTogglePartSelection(templateId, item.partId)}
                                                style={{ cursor: 'pointer' }}
                                              />
                                            </td>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>{item.partName || 'N/A'}</td>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>{item.partNumber || 'N/A'}</td>
                                            <td style={{ padding: '12px', fontSize: '14px' }}>{item.brand || 'N/A'}</td>
                                            <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right' }}>
                                              {item.price ? `${item.price.toLocaleString('vi-VN')} VND` : 'N/A'}
                                            </td>
                                          </tr>
                                        ))}
                                        {/* Inline Add Row */}
                                        {showAddRowForTemplate === templateId && (
                                          <InlineAddPartsRow
                                            templateId={templateId}
                                            availableParts={availablePartsForTemplate[templateId] || []}
                                            loading={loadingParts[templateId] || false}
                                            adding={addingRowTemplateId === templateId}
                                            searchTerm={searchPartsTerm[templateId] || ''}
                                            onSearchChange={(term) => setSearchPartsTerm(prev => ({ ...prev, [templateId]: term }))}
                                            selectedParts={selectedPartsForRow[templateId] || new Set()}
                                            onTogglePart={(partId) => {
                                              setSelectedPartsForRow(prev => {
                                                const current = prev[templateId] || new Set()
                                                const updated = new Set(current)
                                                if (updated.has(partId)) {
                                                  updated.delete(partId)
                                                } else {
                                                  updated.add(partId)
                                                }
                                                return { ...prev, [templateId]: updated }
                                              })
                                            }}
                                            onSelectAll={() => {
                                              const filteredParts = (availablePartsForTemplate[templateId] || []).filter(part =>
                                                (searchPartsTerm[templateId] || '').trim() === '' ||
                                                part.partName.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase()) ||
                                                part.partNumber.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase()) ||
                                                part.brand.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase())
                                              )
                                              const allPartIds = new Set(filteredParts.map(p => p.partId))
                                              setSelectedPartsForRow(prev => ({ ...prev, [templateId]: allPartIds }))
                                            }}
                                            onAdd={(partIds) => handleAddPartsBatchInline(templateId, partIds)}
                                            onDropPart={(partId) => {
                                              setSelectedPartsForRow(prev => {
                                                const current = prev[templateId] || new Set()
                                                const updated = new Set(current)
                                                updated.add(partId)
                                                return { ...prev, [templateId]: updated }
                                              })
                                              // Auto-add single part on drop
                                              handleAddPartsBatchInline(templateId, [partId])
                                            }}
                                          />
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                                      Chưa có phụ tùng nào trong mẫu này
                                    </p>
                                    <button
                                      onClick={() => handleToggleAddRow(templateId)}
                                      style={{
                                        padding: '8px 16px',
                                        fontSize: '13px',
                                        background: '#fde68a',
                                        color: '#1a1a1a',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                      }}
                                    >
                                      <Plus size={14} /> Thêm phụ tùng
                                    </button>
                                  </div>
                                  {showAddRowForTemplate === templateId && (
                                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead style={{ background: '#f9fafb' }}>
                                          <tr>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40px' }}></th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Mã số</th>
                                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Thương hiệu</th>
                                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Giá</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <InlineAddPartsRow
                                            templateId={templateId}
                                            availableParts={availablePartsForTemplate[templateId] || []}
                                            loading={loadingParts[templateId] || false}
                                            adding={addingRowTemplateId === templateId}
                                            searchTerm={searchPartsTerm[templateId] || ''}
                                            onSearchChange={(term) => setSearchPartsTerm(prev => ({ ...prev, [templateId]: term }))}
                                            selectedParts={selectedPartsForRow[templateId] || new Set()}
                                            onTogglePart={(partId) => {
                                              setSelectedPartsForRow(prev => {
                                                const current = prev[templateId] || new Set()
                                                const updated = new Set(current)
                                                if (updated.has(partId)) {
                                                  updated.delete(partId)
                                                } else {
                                                  updated.add(partId)
                                                }
                                                return { ...prev, [templateId]: updated }
                                              })
                                            }}
                                            onSelectAll={() => {
                                              const filteredParts = (availablePartsForTemplate[templateId] || []).filter(part =>
                                                (searchPartsTerm[templateId] || '').trim() === '' ||
                                                part.partName.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase()) ||
                                                part.partNumber.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase()) ||
                                                part.brand.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase())
                                              )
                                              const allPartIds = new Set(filteredParts.map(p => p.partId))
                                              setSelectedPartsForRow(prev => ({ ...prev, [templateId]: allPartIds }))
                                            }}
                                            onAdd={(partIds) => handleAddPartsBatchInline(templateId, partIds)}
                                            onDropPart={(partId) => {
                                              setSelectedPartsForRow(prev => {
                                                const current = prev[templateId] || new Set()
                                                const updated = new Set(current)
                                                updated.add(partId)
                                                return { ...prev, [templateId]: updated }
                                              })
                                              // Auto-add single part on drop
                                              handleAddPartsBatchInline(templateId, [partId])
                                            }}
                                          />
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {templates.length > 0 && (
        <div className="pagination-controls-bottom">
          <div className="pagination-info">
            <span className="pagination-label">Hàng mỗi trang</span>
            <div
              className="pill-select"
              ref={pageSizeRef}
              tabIndex={0}
              onClick={() => setIsPageSizeDropdownOpen(open => !open)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onBlur={()=>setIsPageSizeDropdownOpen(false)}
            >
              <button type="button" className="pill-trigger" style={{minWidth:32, display:'flex', alignItems:'center', justifyContent:'center', height:26}}>
                {pageSize}
                <svg className="caret" style={{marginLeft:6}} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {isPageSizeDropdownOpen && (
                <ul className="pill-menu show" style={{ position: 'absolute', zIndex: 100, left: 0, top: '100%', minWidth: '64px' }}>
                  {pageSizeOptions.map(option => (
                    <li
                      key={option}
                      className={`pill-item ${option === pageSize ? 'active' : ''}`}
                      onClick={() => { setPageSize(option); setCurrentPage(1); setIsPageSizeDropdownOpen(false) }}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span className="pagination-range">
              {`${(currentPage-1)*pageSize+1}–${Math.min(currentPage*pageSize, totalItems)} của ${totalItems} hàng`}
            </span>
          </div>
          <div className="pagination-right-controls">
            <button
              className={`pager-btn ${currentPage===1?'is-disabled':''}`}
              disabled={currentPage===1}
              onClick={()=>handlePageChange(1)}
            >
              <ChevronsLeft size={16}/>
            </button>
            <button
              className={`pager-btn ${currentPage===1?'is-disabled':''}`}
              disabled={currentPage===1}
              onClick={()=>handlePageChange(currentPage-1)}
            >
              <ChevronLeft size={16}/>
            </button>
            <div className="pager-pages">
              {getPageNumbers().map((page, index) => {
                if (page === '...') {
                  return (
                    <span key={`ellipsis-${index}`} className="pager-ellipsis">…</span>
                  )
                }
                const pageNum = page as number
                return (
                  <button
                    key={pageNum}
                    className={`pager-btn ${currentPage === pageNum ? 'is-active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              className={`pager-btn ${currentPage===totalPages?'is-disabled':''}`}
              disabled={currentPage===totalPages}
              onClick={()=>handlePageChange(currentPage+1)}
            >
              <ChevronRight size={16}/>
            </button>
            <button
              className={`pager-btn ${currentPage===totalPages?'is-disabled':''}`}
              disabled={currentPage===totalPages}
              onClick={()=>handlePageChange(totalPages)}
            >
              <ChevronsRight size={16}/>
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Template Modal */}
      <TemplateFormModal
        open={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedTemplate(null)
        }}
        onSuccess={async () => {
          setShowCreateModal(false)
          setShowEditModal(false)
          setSelectedTemplate(null)
          await loadTemplates()
        }}
        mode={showCreateModal ? 'create' : 'edit'}
        template={selectedTemplate}
      />

      {/* Add Parts Modal */}
      {showAddPartsModal && currentTemplateId && (
        <AddPartsModal
          open={showAddPartsModal}
          onClose={() => {
            setShowAddPartsModal(false)
            setCurrentTemplateId(null)
            setSearchPartsTerm(prev => ({ ...prev, [currentTemplateId]: '' }))
          }}
          onAdd={(partIds) => handleAddPartsBatch(currentTemplateId, partIds)}
          availableParts={availableParts}
          loading={loadingParts[currentTemplateId] || false}
          adding={addingParts}
          searchTerm={searchPartsTerm[currentTemplateId] || ''}
          onSearchChange={(term) => setSearchPartsTerm(prev => ({ ...prev, [currentTemplateId]: term }))}
        />
      )}
    </div>
  )
}

// Inline Add Parts Row Component
interface InlineAddPartsRowProps {
  templateId: number
  availableParts: Part[]
  loading: boolean
  adding: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
  selectedParts: Set<number>
  onTogglePart: (partId: number) => void
  onSelectAll: () => void
  onAdd: (partIds: number[]) => void
  onDropPart: (partId: number) => void
}

const InlineAddPartsRow: React.FC<InlineAddPartsRowProps> = ({
  availableParts,
  loading,
  adding,
  searchTerm,
  onSearchChange,
  selectedParts,
  onTogglePart,
  onSelectAll,
  onAdd,
  onDropPart
}) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropZoneRef = useRef<HTMLTableCellElement>(null)
  const [draggedPartId, setDraggedPartId] = useState<number | null>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)


  useEffect(() => {
    if (!showDropdown) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node

      // Don't close if clicking inside dropdown
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return
      }

      // Don't close if clicking button
      if (buttonRef.current && buttonRef.current.contains(target)) {
        return
      }

      // Don't close if clicking container
      if (dropdownContainerRef.current && dropdownContainerRef.current.contains(target)) {
        return
      }

      setShowDropdown(false)
      setDropdownPosition(null)
    }

    function updateDropdownPosition() {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        const dropdownWidth = 600
        const padding = 8

        // Luôn đặt dropdown bên dưới button
        const top = rect.bottom + padding

        // Căn chỉnh dropdown với cạnh phải của button, mở rộng về bên trái
        let left = rect.right - dropdownWidth

        // Nếu không đủ chỗ về bên trái, điều chỉnh để không vượt ra ngoài màn hình
        if (left < padding) {
          left = padding
        }

        // Nếu dropdown vẫn quá rộng, đặt sao cho cạnh phải của dropdown align với cạnh phải của button
        if (rect.right < dropdownWidth) {
          left = rect.right - dropdownWidth
          if (left < padding) {
            left = padding
          }
        }

        setDropdownPosition({
          top: top,
          left: left
        })
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 300)

    // Update position on scroll/resize
    window.addEventListener('scroll', updateDropdownPosition, true)
    window.addEventListener('resize', updateDropdownPosition)
    updateDropdownPosition()

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside, true)
      window.removeEventListener('scroll', updateDropdownPosition, true)
      window.removeEventListener('resize', updateDropdownPosition)
    }
  }, [showDropdown])

  const filteredParts = availableParts.filter(part =>
    searchTerm.trim() === '' ||
    part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDragStart = (e: React.DragEvent, partId: number) => {
    setDraggedPartId(partId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', partId.toString())
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.cursor = 'grabbing'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    const partId = parseInt(e.dataTransfer.getData('text/plain'))
    if (partId && draggedPartId === partId) {
      onDropPart(partId)
      setDraggedPartId(null)
    }
  }

  const handleDragEnd = () => {
    setDraggedPartId(null)
  }

  const handleSelectAllClick = () => {
    onSelectAll()
    // Auto-add after select all
    const allPartIds = new Set(filteredParts.map(p => p.partId))
    if (allPartIds.size > 0) {
      setTimeout(() => {
        onAdd(Array.from(allPartIds))
      }, 300)
    }
  }

  const handleTogglePartWithAutoAdd = (partId: number) => {
    const isCurrentlySelected = selectedParts.has(partId)
    onTogglePart(partId)

    // Auto-add single part immediately when selected (not when unselected)
    if (!isCurrentlySelected) {
      // Part is being selected, auto-add it after a small delay
      setTimeout(() => {
        onAdd([partId])
      }, 150)
    }
  }

  const handleAddClick = () => {
    if (selectedParts.size > 0) {
      onAdd(Array.from(selectedParts))
    } else {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
    }
  }

  return (
    <tr style={{
      backgroundColor: isDraggingOver ? '#fef3c7' : adding ? '#f3f4f6' : '#fef9e7',
      borderBottom: '2px dashed #fde68a'
    }}>
      <td style={{ padding: '12px', textAlign: 'center' }}>
        {adding ? (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Đang thêm...</div>
        ) : (
          <div style={{ fontSize: '12px', color: '#6b7280' }}>⬇️</div>
        )}
      </td>
      <td colSpan={3}
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: '12px',
          textAlign: 'center',
          color: isDraggingOver ? '#92400e' : '#6b7280',
          fontSize: '14px',
          border: isDraggingOver ? '2px dashed #fde68a' : 'none',
          borderRadius: '4px'
        }}
      >
        {isDraggingOver ? 'Thả phụ tùng vào đây' : 'Kéo thả phụ tùng vào đây hoặc chọn từ dropdown'}
      </td>
      <td style={{ padding: '12px', position: 'relative', overflow: 'visible' }}>
        <div ref={dropdownContainerRef} style={{ position: 'relative', zIndex: 1001 }}>
          <button
            ref={buttonRef}
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()

              if (e.nativeEvent) {
                e.nativeEvent.stopImmediatePropagation()
              }

              if (!showDropdown) {
                if (buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect()
                  const dropdownWidth = 600
                  const padding = 8

                  // Luôn đặt dropdown bên dưới button (tính từ cạnh trên của màn hình)
                  const top = rect.bottom + padding

                  // Căn chỉnh dropdown với cạnh phải của button, mở rộng về bên trái
                  // Bắt đầu từ cạnh phải của button
                  let left = rect.right - dropdownWidth

                  // Nếu không đủ chỗ về bên trái, điều chỉnh để không vượt ra ngoài màn hình
                  if (left < padding) {
                    left = padding
                  }

                  // Nếu dropdown vẫn quá rộng, đặt sao cho cạnh phải của dropdown align với cạnh phải của button
                  if (rect.right < dropdownWidth) {
                    left = rect.right - dropdownWidth
                    if (left < padding) {
                      left = padding
                    }
                  }

                  const newPosition = {
                    top: top,
                    left: left
                  }

                  setDropdownPosition(newPosition)
                  setTimeout(() => {
                    setShowDropdown(true)
                  }, 10)
                }
              } else {
                setShowDropdown(false)
                setDropdownPosition(null)
              }
            }}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '13px',
              background: '#fde68a',
              color: '#1a1a1a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <Settings size={14} />
            Chọn phụ tùng
            <ChevronDown size={14} />
          </button>

          {showDropdown && dropdownPosition && typeof document !== 'undefined' && createPortal(
            <div
              ref={(el) => {
                dropdownRef.current = el
              }}
              className="inline-parts-dropdown"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{
                position: 'fixed',
                left: `${dropdownPosition.left}px`,
                top: `${dropdownPosition.top}px`,
                width: '600px',
                maxHeight: '500px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
                zIndex: 10050,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, #fde68a 0%, #fef3c7 100%)', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>Chọn phụ tùng</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(false)
                      setDropdownPosition(null)
                    }}
                    style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      borderRadius: '6px',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#1a1a1a'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={18} style={{ position: 'absolute', left: '14px', color: '#9ca3af', zIndex: 1 }} />
                  <input
                    type="text"
                    placeholder="Tìm kiếm phụ tùng..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 42px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                      background: '#fff',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#fde68a'
                      e.target.style.boxShadow = '0 0 0 3px rgba(253, 230, 138, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                background: '#fff'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectAllClick()
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e5e7eb'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f3f4f6'
                  }}
                >
                  Chọn hết ({filteredParts.length})
                </button>
                <span style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  fontWeight: '500',
                  flex: 1,
                  textAlign: 'right'
                }}>
                  Đã chọn: <strong style={{ color: '#fde68a' }}>{selectedParts.size}</strong>
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddClick()
                  }}
                  disabled={adding || selectedParts.size === 0}
                  style={{
                    padding: '8px 20px',
                    fontSize: '13px',
                    fontWeight: '600',
                    background: '#fde68a',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (adding || selectedParts.size === 0) ? 'not-allowed' : 'pointer',
                    opacity: (adding || selectedParts.size === 0) ? 0.5 : 1,
                    transition: 'all 0.2s',
                    boxShadow: (adding || selectedParts.size === 0) ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!adding && selectedParts.size > 0) {
                      e.currentTarget.style.background = '#fef3c7'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!adding && selectedParts.size > 0) {
                      e.currentTarget.style.background = '#fde68a'
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {adding ? 'Đang thêm...' : 'Thêm'}
                </button>
              </div>

              <div style={{ flex: 1, overflow: 'auto', maxHeight: '320px', background: '#fff' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Đang tải...</p>
                  </div>
                ) : filteredParts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>Không tìm thấy phụ tùng nào</p>
                  </div>
                ) : (
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}>
                    <thead style={{
                      background: '#f9fafb',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      borderBottom: '2px solid #e5e7eb'
                    }}>
                      <tr>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          width: '40px',
                          fontWeight: '600',
                          color: '#374151'
                        }}></th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Tên</th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Mã số</th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'left',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Thương hiệu</th>
                        <th style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#374151'
                        }}>Giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParts.map((part, index) => (
                        <tr
                          key={part.partId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, part.partId)}
                          onDragEnd={handleDragEnd}
                          style={{
                            cursor: draggedPartId === part.partId ? 'grabbing' : 'grab',
                            borderBottom: '1px solid #f3f4f6',
                            backgroundColor: selectedParts.has(part.partId) ? '#fef3c7' : 'transparent',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedParts.has(part.partId)) {
                              e.currentTarget.style.backgroundColor = '#f9fafb'
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedParts.has(part.partId)) {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }
                          }}
                        >
                          <td style={{ padding: '12px' }}>
                            <input
                              type="checkbox"
                              checked={selectedParts.has(part.partId)}
                              onChange={() => handleTogglePartWithAutoAdd(part.partId)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                cursor: 'pointer',
                                width: '18px',
                                height: '18px',
                                accentColor: '#fde68a'
                              }}
                            />
                          </td>
                          <td style={{ padding: '12px', fontWeight: '500', color: '#1f2937' }}>
                            {part.partName}
                          </td>
                          <td style={{ padding: '12px', color: '#6b7280', fontFamily: 'monospace', fontSize: '12px' }}>
                            {part.partNumber}
                          </td>
                          <td style={{ padding: '12px', color: '#6b7280' }}>
                            {part.brand}
                          </td>
                          <td style={{
                            padding: '12px',
                            textAlign: 'right',
                            fontWeight: '600',
                            color: '#059669'
                          }}>
                            {part.unitPrice ? `${part.unitPrice.toLocaleString('vi-VN')} VND` : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>,
            document.body
          )}
        </div>
      </td>
    </tr>
  )
}

// Add Parts Modal Component
interface AddPartsModalProps {
  open: boolean
  onClose: () => void
  onAdd: (partIds: number[]) => void
  availableParts: Part[]
  loading: boolean
  adding: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
}

const AddPartsModal: React.FC<AddPartsModalProps> = ({
  open,
  onClose,
  onAdd,
  availableParts,
  loading,
  adding,
  searchTerm,
  onSearchChange
}) => {
  const [selectedParts, setSelectedParts] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      setSelectedParts(new Set())
    }
  }, [open])

  const filteredParts = availableParts.filter(part =>
    part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.brand.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleTogglePart = (partId: number) => {
    setSelectedParts(prev => {
      const updated = new Set(prev)
      if (updated.has(partId)) {
        updated.delete(partId)
      } else {
        updated.add(partId)
      }
      return updated
    })
  }

  const handleSelectAll = () => {
    if (selectedParts.size === filteredParts.length) {
      setSelectedParts(new Set())
    } else {
      setSelectedParts(new Set(filteredParts.map(p => p.partId)))
    }
  }

  const handleSubmit = () => {
    if (selectedParts.size === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng')
      return
    }
    onAdd(Array.from(selectedParts))
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            Chọn phụ tùng để thêm
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#6b7280' }} />
            <input
              type="text"
              placeholder="Tìm kiếm phụ tùng..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', marginBottom: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Đang tải danh sách phụ tùng...</p>
            </div>
          ) : filteredParts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#6b7280' }}>Không tìm thấy phụ tùng nào</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedParts.size === filteredParts.length && filteredParts.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Tên phụ tùng</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Mã số</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Thương hiệu</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Giá</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part, index) => (
                  <tr key={part.partId} style={{ borderBottom: index < filteredParts.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedParts.has(part.partId)}
                        onChange={() => handleTogglePart(part.partId)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{part.partName}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{part.partNumber}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{part.brand}</td>
                    <td style={{ padding: '12px', fontSize: '14px', textAlign: 'right' }}>
                      {part.unitPrice ? `${part.unitPrice.toLocaleString('vi-VN')} VND` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Đã chọn: {selectedParts.size} phụ tùng
          </span>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              disabled={adding}
              style={{
                padding: '10px 20px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: '#fff',
                cursor: adding ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: adding ? 0.6 : 1
              }}
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              disabled={adding || selectedParts.size === 0}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: '#fde68a',
                color: '#1a1a1a',
                cursor: (adding || selectedParts.size === 0) ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: (adding || selectedParts.size === 0) ? 0.6 : 1
              }}
            >
              {adding ? 'Đang thêm...' : `Thêm ${selectedParts.size} phụ tùng`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

