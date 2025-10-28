import api from './api'

export interface ServiceChecklistTemplate {
    templateId: number
    serviceId: number
    templateName: string
    description?: string
    serviceName?: string
    categoryId?: number
    categoryName?: string
    minKm?: number
    maxDate?: number
    intervalKm?: number
    intervalDays?: number
    maxOverdueDays?: number
    createdAt: string
    updatedAt?: string
    recommendationRank?: number
    recommendationReason?: string
    warnings?: string[]
}

export interface RecommendationRequest {
    currentKm: number
    lastMaintenanceDate?: string
    categoryId?: number
}

export interface RecommendationResponse {
    success: boolean
    data: ServiceChecklistTemplate[]
    total: number
    message: string
}

export class ServiceChecklistTemplateService {
    /**
     * Lấy danh sách dịch vụ được recommend dựa trên km và ngày bảo dưỡng
     */
    static async getRecommendedServices(params: RecommendationRequest): Promise<RecommendationResponse> {
        try {
            const queryParams = new URLSearchParams()
            queryParams.append('currentKm', params.currentKm.toString())

            if (params.lastMaintenanceDate) {
                queryParams.append('lastMaintenanceDate', params.lastMaintenanceDate)
            }

            if (params.categoryId) {
                queryParams.append('categoryId', params.categoryId.toString())
            }

            const response = await api.get(`/service-templates/recommend?${queryParams.toString()}`)
            return response.data
        } catch (error: any) {
            console.error('Error getting recommended services:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách dịch vụ phù hợp')
        }
    }

    /**
     * Lấy tất cả templates (cho admin)
     */
    static async getAllTemplates(): Promise<ServiceChecklistTemplate[]> {
        try {
            const response = await api.get('/service-templates/all')
            return response.data.items || []
        } catch (error: any) {
            console.error('Error getting all templates:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách templates')
        }
    }

    /**
     * Lấy templates theo service ID
     */
    static async getTemplatesByService(serviceId: number, activeOnly: boolean = true): Promise<ServiceChecklistTemplate[]> {
        try {
            const response = await api.get(`/service-templates?serviceId=${serviceId}&activeOnly=${activeOnly}`)
            return response.data.items || []
        } catch (error: any) {
            console.error('Error getting templates by service:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy templates theo service')
        }
    }

    /**
     * Lấy template theo ID
     */
    static async getTemplateById(templateId: number): Promise<ServiceChecklistTemplate> {
        try {
            const response = await api.get(`/service-templates/${templateId}`)
            return response.data
        } catch (error: any) {
            console.error('Error getting template by ID:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy template')
        }
    }

    /**
     * Tạo template mới (admin only)
     */
    static async createTemplate(templateData: {
        serviceId: number
        templateName: string
        description?: string
        isActive?: boolean
        minKm?: number
        maxDate?: number
        intervalKm?: number
        intervalDays?: number
        maxOverdueDays?: number
    }): Promise<{ templateId: number }> {
        try {
            const response = await api.post('/service-templates', templateData)
            return response.data
        } catch (error: any) {
            console.error('Error creating template:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi tạo template')
        }
    }

    /**
     * Cập nhật template (admin only)
     */
    static async updateTemplate(templateId: number, updateData: {
        templateName?: string
        description?: string
        minKm?: number
        maxDate?: number
        intervalKm?: number
        intervalDays?: number
        maxOverdueDays?: number
    }): Promise<{ templateId: number }> {
        try {
            const response = await api.put(`/service-templates/${templateId}`, updateData)
            return response.data
        } catch (error: any) {
            console.error('Error updating template:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật template')
        }
    }

    /**
     * Xóa template (admin only)
     */
    static async deleteTemplate(templateId: number): Promise<void> {
        try {
            await api.delete(`/service-templates/${templateId}`)
        } catch (error: any) {
            console.error('Error deleting template:', error)
            throw new Error(error.response?.data?.message || 'Lỗi khi xóa template')
        }
    }
}

export default ServiceChecklistTemplateService
