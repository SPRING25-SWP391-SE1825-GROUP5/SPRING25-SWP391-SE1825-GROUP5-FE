import api from './api'

export interface InventoryPart {
  inventoryPartId: number
  partId: number
  partNumber: string
  partName: string
  brand: string
  unitPrice: number
  currentStock: number
  minimumStock: number
  lastUpdated: string
  isLowStock: boolean
  isOutOfStock: boolean
}

export interface InventoryData {
  inventoryId: number
  centerId: number
  centerName: string
  lastUpdated: string
  partsCount: number
  parts: InventoryPart[]
}

export interface InventoryResponse {
  success: boolean
  message: string
  data: InventoryData
}

export interface AvailablePart {
  partId: number
  partNumber: string
  partName: string
  brand: string
  price: number
  imageUrl: string
  isActive: boolean
  createdAt: string
  rating: number | null
}

export interface AvailablePartsResponse {
  success: boolean
  message: string
  data: {
    parts: AvailablePart[]
    pageNumber: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

export interface AddPartToInventoryRequest {
  partId: number
  currentStock: number
  minimumStock: number
}

export interface UpdatePartRequest {
  partName: string
  brand: string
  unitPrice: number
  imageUrl: string
  isActive: boolean
}

export interface UpdatePartResponse {
  success: boolean
  message: string
  data?: any
}

export const InventoryService = {
  async getInventoryByCenter(centerId: number): Promise<InventoryResponse> {
    const response = await api.get(`/Inventory/center/${centerId}`)
    return response.data
  },

  async getAvailableParts(): Promise<AvailablePartsResponse> {
    const response = await api.get('/Part/not-in-any-inventory')
    return response.data
  },

  async addPartToInventory(inventoryId: number, partData: AddPartToInventoryRequest): Promise<AddPartToInventoryResponse> {
    const response = await api.post(`/Inventory/${inventoryId}/parts`, partData)
    return response.data
  },

  async updatePart(partId: number, partData: UpdatePartRequest): Promise<UpdatePartResponse> {
    const response = await api.put(`/Part/${partId}`, partData)
    return response.data
  }
}
