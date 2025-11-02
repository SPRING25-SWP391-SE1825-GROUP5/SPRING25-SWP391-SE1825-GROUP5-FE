import api from './api'

export interface ServiceChecklistTemplateItem {
    itemId: number
    templateId: number
    partId: number
    partName?: string
    partNumber?: string
    partBrand?: string
    partPrice?: number
    description?: string
    createdAt?: string
}

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
    items?: ServiceChecklistTemplateItem[] // Parts trong template
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
            console.log('Fetching templates for service:', { serviceId, activeOnly })
            
            // Thử endpoint 1: /service-templates/templates/{serviceId} (đúng route từ controller)
            try {
                const response = await api.get(`/service-templates/templates/${serviceId}`, {
                    params: { activeOnly }
                })
                console.log('Templates API response (templates/{serviceId}):', response.data)

                // Backend trả về: { success: true, data: [...] }
                if (response.data?.success) {
                    if (Array.isArray(response.data.data)) {
                        console.log('Parsed templates from templates/{serviceId}:', response.data.data)
                        return response.data.data
                    } else if (response.data.data === null || response.data.data === undefined) {
                        console.log('No templates found for service:', serviceId)
                        return []
                    }
                }
                
                // Fallback: kiểm tra các format khác
                if (Array.isArray(response.data)) {
                    return response.data
                }
                if (Array.isArray(response.data?.items)) {
                    return response.data.items
                }
                
                return []
            } catch (endpoint1Error: any) {
                console.log('Endpoint 1 failed, trying alternative:', endpoint1Error.message)
                
                // Thử endpoint 2: /service-templates/active?serviceId={serviceId} (alternative endpoint)
                try {
                    const response = await api.get(`/service-templates/active`, {
                        params: { serviceId, activeOnly }
                    })
                    console.log('Templates API response (active):', response.data)

                    // Backend trả về: { success: true, data: [...] }
                    if (response.data?.success && Array.isArray(response.data.data)) {
                        console.log('Parsed templates from active endpoint:', response.data.data)
                        return response.data.data
                    }
                } catch (endpoint2Error: any) {
                    console.log('Endpoint 2 also failed:', endpoint2Error.message)
                    throw endpoint1Error // Throw original error
                }
            }

            // Fallback: Handle different response formats
            return []
        } catch (error: any) {
            console.error('Error getting templates by service:', {
                error,
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            
            // Nếu là 404 hoặc không tìm thấy, trả về mảng rỗng thay vì throw error
            if (error.response?.status === 404 || error.response?.status === 400) {
                console.log('Service không có checklist templates. Trả về mảng rỗng.')
                return []
            }
            
            // Với các lỗi khác, cũng trả về mảng rỗng để không block UI
            console.warn('Error fetching templates, returning empty array:', error.message)
            return []
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

    /**
     * Lấy items (parts) của template theo template ID
     */
    static async getTemplateItems(templateId: number): Promise<ServiceChecklistTemplateItem[]> {
        try {
            console.log('Fetching template items for template:', templateId)
            const response = await api.get(`/service-templates/${templateId}/items`)
            console.log('Template items API response:', response.data)

            // Backend trả về: { success: true, data: [...] }
            if (response.data?.success && Array.isArray(response.data.data)) {
                console.log('Parsed template items:', response.data.data)
                return response.data.data
            }

            // Fallback: kiểm tra các format khác
            if (Array.isArray(response.data)) {
                return response.data
            }
            if (Array.isArray(response.data?.items)) {
                return response.data.items
            }
            if (Array.isArray(response.data?.data)) {
                return response.data.data
            }

            return []
        } catch (error: any) {
            console.error('Error getting template items:', {
                error,
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            
            // Nếu là 404, trả về mảng rỗng (template không có items)
            if (error.response?.status === 404) {
                console.log('Template không có items. Trả về mảng rỗng.')
                return []
            }
            
            // Với các lỗi khác, cũng trả về mảng rỗng để không block UI
            console.warn('Error fetching template items, returning empty array:', error.message)
            return []
        }
    }

    /**
     * Lấy templates theo service ID kèm items (parts) của mỗi template
     */
    static async getTemplatesByServiceWithItems(serviceId: number, activeOnly: boolean = true): Promise<ServiceChecklistTemplate[]> {
        try {
            // Lấy templates trước
            const templates = await this.getTemplatesByService(serviceId, activeOnly)
            
            if (templates.length === 0) {
                return []
            }

            // Lấy items cho từng template (parallel requests)
            const templatesWithItems = await Promise.all(
                templates.map(async (template) => {
                    try {
                        const items = await this.getTemplateItems(template.templateId)
                        return {
                            ...template,
                            items: items || []
                        }
                    } catch (error: any) {
                        console.warn(`Failed to load items for template ${template.templateId}:`, error.message)
                        return {
                            ...template,
                            items: []
                        }
                    }
                })
            )

            console.log('Templates with items:', templatesWithItems)
            return templatesWithItems
        } catch (error: any) {
            console.error('Error getting templates with items:', error)
            // Fallback: trả về templates không có items
            return await this.getTemplatesByService(serviceId, activeOnly)
        }
    }
}

export default ServiceChecklistTemplateService
