import api from './api'

// Service Category Types
export type ServiceCategory = {
    categoryId: number
    categoryName: string
    description?: string
    isActive: boolean
    createdAt: string
}

export type ServiceCategoryListResponse = {
    categories: ServiceCategory[]
    totalCount: number
    pageNumber: number
    pageSize: number
    totalPages: number
}

export const ServiceCategoryService = {
    // Get all active service categories (Public API)
    async getActiveCategories(): Promise<ServiceCategory[]> {
        try {
            console.log('🌐 Calling ServiceCategory API: /ServiceCategory/active')
            const response = await api.get('/ServiceCategory/active')
            console.log('✅ ServiceCategory API response:', response)
            console.log('✅ Response data:', response.data)

            const data = response.data

            // Handle different response formats
            if (data && typeof data === 'object') {
                // Format 1: { success: true, data: [...], message: "..." }
                if (data.success && data.data && Array.isArray(data.data)) {
                    console.log('✅ Found categories in data.data:', data.data)
                    return data.data
                }
                // Format 2: Direct array [...]
                if (Array.isArray(data)) {
                    console.log('✅ Found categories as direct array:', data)
                    return data
                }
                // Format 3: { data: [...] }
                if (data.data && Array.isArray(data.data)) {
                    console.log('✅ Found categories in data.data:', data.data)
                    return data.data
                }
            }

            console.warn('❌ Unexpected response format:', data)
            return []
        } catch (error: any) {
            console.error('❌ Error fetching service categories:', error)
            console.error('❌ Error response:', error.response)
            console.error('❌ Error details:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            })
            return []
        }
    },

    // Get all service categories (Admin/Staff only)
    async getAllCategories(): Promise<ServiceCategory[]> {
        try {
            const { data } = await api.get('/ServiceCategory')
            console.log('ServiceCategory API response:', data)

            // Handle different response formats
            if (data && typeof data === 'object') {
                if (data.data && Array.isArray(data.data)) {
                    return data.data
                } else if (Array.isArray(data)) {
                    return data
                } else if (data.success && data.data && Array.isArray(data.data)) {
                    return data.data
                }
            }

            console.warn('Unexpected response format:', data)
            return []
        } catch (error: any) {
            console.error('Error fetching service categories:', error)
            return []
        }
    },

    // Get category by ID
    async getCategoryById(id: number): Promise<ServiceCategory | null> {
        try {
            const { data } = await api.get(`/ServiceCategory/${id}`)

            if (data && typeof data === 'object') {
                if (data.data) {
                    return data.data
                } else if (data.categoryId) {
                    return data
                }
            }

            return null
        } catch (error: any) {
            console.error('Error fetching service category by ID:', error)
            return null
        }
    }
}

export default ServiceCategoryService

