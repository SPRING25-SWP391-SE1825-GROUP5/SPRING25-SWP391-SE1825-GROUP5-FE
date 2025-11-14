import React from 'react'
import { Edit, Power, Trash2, ChevronDown, ChevronUp, CheckCircle, Calendar, Settings } from 'lucide-react'
import { ServiceChecklistTemplate, GetItemsResponse } from '@/services/serviceChecklistTemplateService'
import { TemplateExpandedContent } from './TemplateExpandedContent'

interface TemplateRowProps {
  template: ServiceChecklistTemplate
  templateId: number
  isExpanded: boolean
  items: GetItemsResponse | null
  isLoading: boolean
  activating: number | null
  deleting: boolean
  selectedPartIds: Set<number>
  removingParts: boolean
  showAddRowForTemplate: number | null
  availablePartsForTemplate: any[]
  loadingParts: boolean
  addingRowTemplateId: number | null
  searchPartsTerm: string
  selectedPartsForRow: Set<number>
  onToggleRow: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
  onRemoveParts: (partIds: number[]) => void
  onClearSelection: () => void
  onToggleAddRow: () => void
  onTogglePartSelection: (partId: number) => void
  onSelectAllParts: () => void
  onSearchChange: (term: string) => void
  onTogglePart: (partId: number) => void
  onSelectAll: () => void
  onAdd: (partIds: number[]) => void
  onDropPart: (partId: number) => void
  formatDate: (dateString: string) => string
}

export const TemplateRow: React.FC<TemplateRowProps> = ({
  template,
  templateId,
  isExpanded,
  items,
  isLoading,
  activating,
  deleting,
  selectedPartIds,
  removingParts,
  showAddRowForTemplate,
  availablePartsForTemplate,
  loadingParts,
  addingRowTemplateId,
  searchPartsTerm,
  selectedPartsForRow,
  onToggleRow,
  onEdit,
  onDelete,
  onToggleActive,
  onRemoveParts,
  onClearSelection,
  onToggleAddRow,
  onTogglePartSelection,
  onSelectAllParts,
  onSearchChange,
  onTogglePart,
  onSelectAll,
  onAdd,
  onDropPart,
  formatDate
}) => {
  return (
    <React.Fragment>
      <tr
        onClick={onToggleRow}
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
              onToggleActive()
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
              onClick={onEdit}
              className="service-template-management__action-button"
              title="Sửa mẫu"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleActive()
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
                onDelete()
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
              <TemplateExpandedContent
                templateId={templateId}
                isLoading={isLoading}
                items={items}
                selectedPartIds={selectedPartIds}
                removingParts={removingParts}
                showAddRowForTemplate={showAddRowForTemplate}
                availablePartsForTemplate={availablePartsForTemplate}
                loadingParts={loadingParts}
                addingRowTemplateId={addingRowTemplateId}
                searchPartsTerm={searchPartsTerm}
                selectedPartsForRow={selectedPartsForRow}
                onRemoveParts={onRemoveParts}
                onClearSelection={onClearSelection}
                onToggleAddRow={onToggleAddRow}
                onTogglePartSelection={onTogglePartSelection}
                onSelectAllParts={onSelectAllParts}
                onSearchChange={onSearchChange}
                onTogglePart={onTogglePart}
                onSelectAll={onSelectAll}
                onAdd={onAdd}
                onDropPart={onDropPart}
              />
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  )
}

