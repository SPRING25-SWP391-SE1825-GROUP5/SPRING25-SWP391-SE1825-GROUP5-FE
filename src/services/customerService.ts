import api from './api'

// Types based on backend API documentation
export interface Customer {
  customerId: number
  userId?: number | null
  isGuest: boolean
  userFullName?: string
  userEmail?: string
  userPhoneNumber?: string
  vehicleCount?: number
}

export interface CreateCustomerRequest {
  phoneNumber: string
  isGuest?: boolean
}

export interface UpdateCustomerRequest {
  phoneNumber: string
  isGuest: boolean
}

export interface QuickCreateCustomerRequest {
  fullName: string
  phoneNumber: string
  email: string
}

export interface CustomerResponse {
  success: boolean
  message: string
  data: Customer
}

export interface VehicleListResponse {
  success: boolean
  message: string
  data: {
    vehicles: any[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface CustomerServicePackage {
  creditId: number
  packageId: number
  packageName: string
  packageDescription: string
  originalPrice: number
  discountPercent: number
  finalPrice: number
  totalCredits: number
  usedCredits: number
  remainingCredits: number
  status: string
  purchaseDate: string
  expiryDate: string
  serviceName: string
  serviceDescription: string
}

export interface CustomerServicePackagesResponse {
  success: boolean
  message: string
  data: CustomerServicePackage[]
}

export interface CustomerBookingsResponse {
  success: boolean
  message: string
  data: {
    bookings: any[]
    pagination?: {
      pageNumber: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  } | any[]
}

/**
 * Customer Service
 * Handles customer management operations
 *
 * @class CustomerService
 * @description Service responsible for customer CRUD operations
 */
export const CustomerService = {
  /**
   * Get current customer information (map from User)
   *
   * @returns Promise with current customer data
   * @throws {Error} When request fails
   */
  async getCurrentCustomer(): Promise<CustomerResponse> {
    const { data } = await api.get<CustomerResponse>('/Customer/me')
    return data
  },

  /**
   * Create new customer profile
   *
   * @param customerData - Customer creation data
   * @returns Promise with created customer
   * @throws {Error} When creation fails
   */
  async createCustomer(customerData: CreateCustomerRequest): Promise<CustomerResponse> {
    const { data } = await api.post<CustomerResponse>('/Customer', customerData)
    return data
  },

  /**
   * Get customer vehicles
   *
   * @param customerId - Customer ID
   * @param params - Query parameters for pagination and search
   * @returns Promise with customer's vehicles
   * @throws {Error} When request fails
   */
  async getCustomerVehicles(customerId: number, params: {
    pageNumber?: number
    pageSize?: number
    searchTerm?: string
  } = {}): Promise<VehicleListResponse> {
    const defaultParams = { pageNumber: 1, pageSize: 10, ...params }
    const { data } = await api.get<VehicleListResponse>(`/Customer/${customerId}/vehicles`, { params: defaultParams })
    return data
  },

  /**
   * Update customer information
   *
   * @param customerId - Customer ID
   * @param customerData - Customer data to update
   * @returns Promise with updated customer
   * @throws {Error} When update fails
   */
  async updateCustomer(customerId: number, customerData: UpdateCustomerRequest): Promise<CustomerResponse> {
    const { data } = await api.put<CustomerResponse>(`/Customer/${customerId}`, customerData)
    return data
  },

  /**
   * Quick create customer (for staff/technician/admin)
   *
   * @param customerData - Customer creation data
   * @returns Promise with created customer
   * @throws {Error} When creation fails
   */
  async quickCreateCustomer(customerData: QuickCreateCustomerRequest): Promise<CustomerResponse> {
    const { data } = await api.post<CustomerResponse>('/Customer/quick-create', customerData)
    return data
  },

  /**
   * Get customer service packages
   *
   * @returns Promise with customer's service packages
   * @throws {Error} When request fails
   */
  async getCustomerServicePackages(): Promise<CustomerServicePackagesResponse> {
    const { data } = await api.get<CustomerServicePackagesResponse>('/Customer/service-packages')
    return data
  },

  async getCustomerBookings(customerId: number, params: { pageNumber?: number; pageSize?: number } = {}): Promise<CustomerBookingsResponse> {
    const defaultParams = { pageNumber: 1, pageSize: 10, ...params }
    const { data } = await api.get<CustomerBookingsResponse>(`/Customer/${customerId}/bookings`, { params: defaultParams })
    return data
  },

  /**
   * Get customer service credits
   *
   * @param customerId - Customer ID
   * @returns Promise with customer's service credits
   * @throws {Error} When request fails
   */
  async getCustomerCredits(customerId: number): Promise<CustomerServicePackagesResponse> {
    const { data } = await api.get<CustomerServicePackagesResponse>(`/Customer/${customerId}/credits`)
    return data
  }
}
