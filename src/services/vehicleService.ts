import api from './api'

// Types based on backend API documentation
export interface Vehicle {
  vehicleId: number
  customerId: number
  vin: string
  licensePlate: string
  color: string
  currentMileage: number
  lastServiceDate?: string | null
  purchaseDate?: string | null
  nextServiceDue?: string | null
  createdAt: string
  customerName?: string
  customerPhone?: string
  modelId?: number | null
}

export interface CreateVehicleRequest {
  customerId: number
  vin: string
  licensePlate: string
  color: string
  currentMileage: number
  lastServiceDate?: string
  purchaseDate?: string
}

export interface UpdateVehicleRequest {
  color: string
  currentMileage: number
  lastServiceDate?: string
  purchaseDate?: string
}

export interface VehicleListResponse {
  success: boolean
  message: string
  data: {
    vehicles: Vehicle[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface VehicleResponse {
  success: boolean
  message: string
  data: Vehicle
}

export interface UpdateMileageRequest {
  currentMileage: number
}

export interface NextServiceDueResponse {
  success: boolean
  message: string
  data: {
    nextServiceDue: string
    serviceId?: number
    policy?: string
  }
}

/**
 * Vehicle Service
 * Handles vehicle management operations
 * 
 * @class VehicleService
 * @description Service responsible for vehicle CRUD operations,
 * mileage updates, and service scheduling
 */
export const VehicleService = {
  /**
   * Get paginated list of vehicles with optional filtering
   * 
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with vehicle list and pagination info
   * @throws {Error} When request fails
   */
  async getVehicles(params: {
    pageNumber?: number
    pageSize?: number
    customerId?: number
    searchTerm?: string
  } = {}): Promise<VehicleListResponse> {
    const defaultParams = { pageNumber: 1, pageSize: 10, ...params }
    const { data } = await api.get<VehicleListResponse>('/vehicle', { params: defaultParams })
    return data
  },

  /**
   * Get vehicle by ID
   * 
   * @param id - Vehicle ID
   * @returns Promise with vehicle data
   * @throws {Error} When vehicle not found or request fails
   */
  async getVehicleById(id: number): Promise<VehicleResponse> {
    const { data } = await api.get<VehicleResponse>(`/vehicle/${id}`)
    return data
  },

  /**
   * Create new vehicle
   * 
   * @param vehicleData - Vehicle creation data
   * @returns Promise with created vehicle
   * @throws {Error} When creation fails
   */
  async createVehicle(vehicleData: CreateVehicleRequest): Promise<VehicleResponse> {
    const { data } = await api.post<VehicleResponse>('/vehicle', vehicleData)
    return data
  },

  /**
   * Update vehicle by ID
   * 
   * @param id - Vehicle ID
   * @param vehicleData - Vehicle data to update
   * @returns Promise with updated vehicle
   * @throws {Error} When update fails
   */
  async updateVehicle(id: number, vehicleData: UpdateVehicleRequest): Promise<VehicleResponse> {
    const { data } = await api.put<VehicleResponse>(`/vehicle/${id}`, vehicleData)
    return data
  },

  /**
   * Get customer information by vehicle ID
   * 
   * @param id - Vehicle ID
   * @returns Promise with customer data
   * @throws {Error} When request fails
   */
  async getVehicleCustomer(id: number): Promise<{ success: boolean; message: string; data: any }> {
    const { data } = await api.get(`/vehicle/${id}/customer`)
    return data
  },

  /**
   * Search vehicle by VIN or license plate
   * 
   * @param vinOrLicensePlate - VIN or license plate to search
   * @returns Promise with vehicle data
   * @throws {Error} When vehicle not found or request fails
   */
  async searchVehicle(vinOrLicensePlate: string): Promise<VehicleResponse> {
    const { data } = await api.get<VehicleResponse>(`/vehicle/search/${encodeURIComponent(vinOrLicensePlate)}`)
    return data
  },

  /**
   * Update vehicle mileage
   * 
   * @param vehicleId - Vehicle ID
   * @param mileageData - Mileage data
   * @returns Promise with updated vehicle
   * @throws {Error} When update fails
   */
  async updateMileage(vehicleId: number, mileageData: UpdateMileageRequest): Promise<VehicleResponse> {
    const { data } = await api.post<VehicleResponse>(`/vehicle/${vehicleId}/mileage`, mileageData)
    return data
  },

  /**
   * Get next service due date for vehicle
   * 
   * @param vehicleId - Vehicle ID
   * @param serviceId - Optional service ID
   * @returns Promise with next service due information
   * @throws {Error} When request fails
   */
  async getNextServiceDue(vehicleId: number, serviceId?: number): Promise<NextServiceDueResponse> {
    const params = serviceId ? { serviceId } : {}
    const { data } = await api.get<NextServiceDueResponse>(`/vehicle/${vehicleId}/next-service-due`, { params })
    return data
  },

  /**
   * Get vehicles for current customer
   * 
   * @param customerId - Customer ID (optional, defaults to current user)
   * @returns Promise with customer's vehicles
   * @throws {Error} When request fails
   */
  async getCustomerVehicles(customerId?: number): Promise<VehicleListResponse> {
    const params = customerId ? { customerId } : {}
    const { data } = await api.get<VehicleListResponse>('/vehicle', { params })
    return data
  }
}
