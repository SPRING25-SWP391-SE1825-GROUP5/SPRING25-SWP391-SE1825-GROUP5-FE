import React, { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Plus,
  CheckCircle,
  Search,
  List,
  BarChart2,
  Download,
  EyeOff,
  SlidersHorizontal,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
} from 'lucide-react'
import { ServiceChecklistTemplateService, ServiceChecklistTemplate, GetItemsResponse, TemplateItemDto } from '@/services/serviceChecklistTemplateService'
import { PartService, type Part } from '@/services/partService'
import toast from 'react-hot-toast'
import TemplateFormModal from '@/components/admin/TemplateFormModal'
import ConfirmModal from '@/components/chat/ConfirmModal'
import { TemplateRow, AddPartsModal } from '@/components/admin/ServiceTemplate'
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeletePartsModal, setShowDeletePartsModal] = useState(false)
  const [partsToDelete, setPartsToDelete] = useState<number[]>([])
  const [templateIdForDeleteParts, setTemplateIdForDeleteParts] = useState<number | null>(null)

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
  const handleDelete = (template: ServiceChecklistTemplate) => {
    setSelectedTemplate(template)
    setShowDeleteModal(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!selectedTemplate) return
    const templateId = selectedTemplate.templateID || selectedTemplate.templateId
    if (!templateId) return

    try {
      setDeleting(true)
      await ServiceChecklistTemplateService.deleteTemplate(templateId)
      toast.success('Đã xóa template thành công')
      setShowDeleteModal(false)
      setSelectedTemplate(null)
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
          const existingPartIds = new Set(templateItemsMap[templateId]?.items?.map(i => i.partId) || [])
          const partsData = Array.isArray(response.data) ? response.data : []
          const filteredParts = partsData.filter(p => !existingPartIds.has(p.partId))
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
      const existingPartIds = new Set(templateItemsMap[templateId]?.items?.map(i => i.partId) || [])
      const partsData = Array.isArray(response.data) ? response.data : []
      const filteredParts = partsData.filter(p => !existingPartIds.has(p.partId))
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
  const handleRemovePartsBatch = (templateId: number, partIds: number[]) => {
    if (partIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một phụ tùng để xóa')
      return
    }

    setTemplateIdForDeleteParts(templateId)
    setPartsToDelete(partIds)
    setShowDeletePartsModal(true)
    }

  const confirmDeleteParts = async () => {
    if (!templateIdForDeleteParts || partsToDelete.length === 0) return

    try {
      setRemovingParts(prev => ({ ...prev, [templateIdForDeleteParts]: true }))
      const response = await ServiceChecklistTemplateService.removePartsBatch(templateIdForDeleteParts, partsToDelete)

      if (response.errors && response.errors.length > 0) {
        toast.error(`Đã xóa ${response.results.filter((r: any) => r.success).length}/${partsToDelete.length} phụ tùng. Một số phụ tùng không thể xóa.`)
      } else {
        toast.success(`Đã xóa ${partsToDelete.length} phụ tùng thành công`)
      }

      // Refresh items
      const itemsResponse = await ServiceChecklistTemplateService.getTemplateItemsResponse(templateIdForDeleteParts)
      setTemplateItemsMap(prev => ({ ...prev, [templateIdForDeleteParts]: itemsResponse }))

      // Clear selections
      setSelectedPartIds(prev => ({ ...prev, [templateIdForDeleteParts]: new Set() }))

      setShowDeletePartsModal(false)
      setTemplateIdForDeleteParts(null)
      setPartsToDelete([])
    } catch (err: any) {
      toast.error('Không thể xóa phụ tùng: ' + (err.message || 'Unknown error'))
    } finally {
      setRemovingParts(prev => ({ ...prev, [templateIdForDeleteParts]: false }))
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
    if (!items || !items.items || items.items.length === 0) return

    const allPartIds = new Set((items.items || []).map(i => i.partId))
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
                    <TemplateRow
                      key={templateId}
                      template={template}
                                            templateId={templateId}
                      isExpanded={isExpanded}
                      items={items}
                      isLoading={isLoading}
                      activating={activating}
                      deleting={deleting}
                      selectedPartIds={selectedPartIds[templateId] || new Set()}
                      removingParts={removingParts[templateId] || false}
                      showAddRowForTemplate={showAddRowForTemplate}
                      availablePartsForTemplate={availablePartsForTemplate[templateId] || []}
                      loadingParts={loadingParts[templateId] || false}
                      addingRowTemplateId={addingRowTemplateId}
                      searchPartsTerm={searchPartsTerm[templateId] || ''}
                      selectedPartsForRow={selectedPartsForRow[templateId] || new Set()}
                      onToggleRow={() => handleToggleRow(template)}
                      onEdit={() => handleEdit(template)}
                      onDelete={() => handleDelete(template)}
                      onToggleActive={() => handleToggleActive(template)}
                      onRemoveParts={(partIds) => handleRemovePartsBatch(templateId, partIds)}
                      onClearSelection={() => handleClearPartSelection(templateId)}
                      onToggleAddRow={() => handleToggleAddRow(templateId)}
                      onTogglePartSelection={(partId) => handleTogglePartSelection(templateId, partId)}
                      onSelectAllParts={() => handleSelectAllParts(templateId)}
                                            onSearchChange={(term) => setSearchPartsTerm(prev => ({ ...prev, [templateId]: term }))}
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
                          part.partName?.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase()) ||
                          part.partNumber?.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase()) ||
                          part.brand?.toLowerCase().includes((searchPartsTerm[templateId] || '').toLowerCase())
                        )
                        const allPartIds = new Set((filteredParts || []).map(p => p.partId))
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
                                              handleAddPartsBatchInline(templateId, [partId])
                                            }}
                      formatDate={formatDate}
                    />
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

      {/* Delete Template Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        message={selectedTemplate ? `Bạn có chắc chắn muốn xóa template "${selectedTemplate.templateName}"? Hành động này không thể hoàn tác.` : ''}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDeleteTemplate}
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedTemplate(null)
        }}
        type="delete"
      />

      {/* Delete Parts Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeletePartsModal}
        message={`Bạn có chắc chắn muốn xóa ${partsToDelete.length} phụ tùng? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={confirmDeleteParts}
        onCancel={() => {
          setShowDeletePartsModal(false)
          setTemplateIdForDeleteParts(null)
          setPartsToDelete([])
        }}
        type="delete"
      />
              </div>
  )
}
