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
  imageUrl?: string
  isActive?: boolean
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

export interface AddPartToInventoryResponse {
  success: boolean
  message: string
  data?: any
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

export interface InventoryListItem {
  inventoryId: number
  centerId: number
  centerName: string
  lastUpdated: string
  partsCount: number
  inventoryParts?: InventoryPart[]
}

export interface GetInventoriesResponse {
  success: boolean
  message: string
  data: {
    inventories: InventoryListItem[]
    pageNumber: number
    pageSize: number
    totalPages: number
    totalCount: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
}

export interface UpdateInventoryPartRequest {
  currentStock: number
  minimumStock: number
}

export interface UpdateInventoryPartResponse {
  success: boolean
  message: string
  data?: any
}

export interface GetInventoryPartsResponse {
  success: boolean
  message: string
  data: InventoryPart[]
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

  async addPartToInventory(inventoryId: number, partData: AddPartToInventoryRequest): Promise<any> {
    const response = await api.post(`/Inventory/${inventoryId}/parts`, partData)
    return response.data
  },

  async updatePart(partId: number, partData: UpdatePartRequest): Promise<UpdatePartResponse> {
    const response = await api.put(`/Part/${partId}`, partData)
    return response.data
  },

  // Admin APIs
  async getInventories(
    pageNumber: number = 1,
    pageSize: number = 10,
    centerId?: number | null,
    searchTerm?: string | null
  ): Promise<GetInventoriesResponse> {
    const params = new URLSearchParams()
    params.append('pageNumber', pageNumber.toString())
    params.append('pageSize', pageSize.toString())
    if (centerId) params.append('centerId', centerId.toString())
    if (searchTerm) params.append('searchTerm', searchTerm)
    
    const response = await api.get(`/Inventory?${params.toString()}`)
    return response.data
  },

  async getInventoryById(id: number): Promise<InventoryResponse> {
    const response = await api.get(`/Inventory/${id}`)
    return response.data
  },

  async getInventoryParts(inventoryId: number): Promise<GetInventoryPartsResponse> {
    const response = await api.get(`/Inventory/${inventoryId}/parts`)
    return response.data
  },

  async updateInventoryPart(
    inventoryId: number,
    partId: number,
    partData: UpdateInventoryPartRequest
  ): Promise<UpdateInventoryPartResponse> {
    const response = await api.put(`/Inventory/${inventoryId}/parts/${partId}`, partData)
    return response.data
  },

  async removePartFromInventory(
    inventoryId: number,
    partId: number
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/Inventory/${inventoryId}/parts/${partId}`)
    return response.data
  }
}
