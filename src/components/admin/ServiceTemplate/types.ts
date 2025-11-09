import { Part } from '@/services/partService'
import { GetItemsResponse } from '@/services/serviceChecklistTemplateService'

export interface InlineAddPartsRowProps {
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

export interface AddPartsModalProps {
  open: boolean
  onClose: () => void
  onAdd: (partIds: number[]) => void
  availableParts: Part[]
  loading: boolean
  adding: boolean
  searchTerm: string
  onSearchChange: (term: string) => void
}

export interface TemplateItemsTableProps {
  templateId: number
  items: GetItemsResponse | null
  isLoading: boolean
  selectedPartIds: Set<number>
  showAddRow: boolean
  availablePartsForTemplate: Part[]
  loadingParts: boolean
  addingRow: boolean
  searchPartsTerm: string
  selectedPartsForRow: Set<number>
  onTogglePartSelection: (templateId: number, partId: number) => void
  onSelectAllParts: (templateId: number) => void
  onClearPartSelection: (templateId: number) => void
  onRemovePartsBatch: (templateId: number, partIds: number[]) => void
  onToggleAddRow: (templateId: number) => void
  onSearchChange: (templateId: number, term: string) => void
  onTogglePartForRow: (templateId: number, partId: number) => void
  onSelectAllForRow: (templateId: number) => void
  onAddPartsBatchInline: (templateId: number, partIds: number[]) => void
  onDropPart: (templateId: number, partId: number) => void
}

