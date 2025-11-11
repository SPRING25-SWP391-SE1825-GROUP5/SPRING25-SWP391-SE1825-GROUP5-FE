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
    templateID?: number
    templateId?: number
    serviceID?: number
    serviceId?: number
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
    isActive?: boolean
    createdAt: string
    updatedAt?: string
    recommendationRank?: number
    recommendationReason?: string
    warnings?: string[]
    items?: ServiceChecklistTemplateItem[] // Parts trong template
}

export interface TemplateItemDto {
    itemId?: number
    partId: number
    defaultQuantity?: number
}

export interface TemplateCreateRequest {
    serviceId: number
    templateName: string
    description?: string
    isActive?: boolean
    items?: TemplateItemDto[]
}

export interface TemplateUpdateRequest {
    templateName?: string
    description?: string
}

export interface UpsertItemsRequest {
    items: TemplateItemDto[]
}

export interface ActivateRequest {
    isActive: boolean
}

export interface BatchPartsRequest {
    partIds: number[]
}

export interface TemplateItemResponse {
    itemId: number
    partId: number
    partName?: string
    partNumber?: string
    brand?: string
    price?: number
    createdAt: string
}

export interface GetItemsResponse {
    templateId: number
    templateName: string
    items: TemplateItemResponse[]
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

            throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách dịch vụ phù hợp')
        }
    }

    /**
     * Lấy tất cả templates (cho admin)
     */
    static async getAllTemplates(): Promise<{ items: ServiceChecklistTemplate[], total: number }> {
        try {
            const response = await api.get('/service-templates/all')
            // Backend trả về: { success: true, data: templates[] }
            if (response.data && typeof response.data === 'object') {
                // Xử lý response từ backend: { success: true, data: [...] }
                if (response.data.success && Array.isArray(response.data.data)) {
                    return {
                        items: response.data.data,
                        total: response.data.data.length
                    }
                }
                // Xử lý trường hợp response.data là array trực tiếp
                if (Array.isArray(response.data)) {
                    return {
                        items: response.data,
                        total: response.data.length
                    }
                }
                // Xử lý trường hợp có items property
                if (Array.isArray(response.data.items)) {
                    return {
                        items: response.data.items,
                        total: response.data.total ?? response.data.items.length
                    }
                }
            }
            return { items: [], total: 0 }
        } catch (error: any) {
            console.error('Error fetching templates:', error)
            return { items: [], total: 0 }
        }
    }

    /**
     * Lấy templates theo service ID
     */
    static async getTemplatesByService(serviceId: number, activeOnly: boolean = true): Promise<ServiceChecklistTemplate[]> {
        try {

            // Thử endpoint 1: /service-templates/templates/{serviceId} (đúng route từ controller)
            try {
                const response = await api.get(`/service-templates/templates/${serviceId}`, {
                    params: { activeOnly }
                })

                // Backend trả về: { success: true, data: [...] }
                if (response.data?.success) {
                    if (Array.isArray(response.data.data)) {

                        return response.data.data
                    } else if (response.data.data === null || response.data.data === undefined) {

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

                // Thử endpoint 2: /service-templates/active?serviceId={serviceId} (alternative endpoint)
                try {
                    const response = await api.get(`/service-templates/active`, {
                        params: { serviceId, activeOnly }
                    })

                    // Backend trả về: { success: true, data: [...] }
                    if (response.data?.success && Array.isArray(response.data.data)) {

                        return response.data.data
                    }
                } catch (endpoint2Error: any) {

                    throw endpoint1Error // Throw original error
                }
            }

            // Fallback: Handle different response formats
            return []
        } catch (error: any) {

            // Nếu là 404 hoặc không tìm thấy, trả về mảng rỗng thay vì throw error
            if (error.response?.status === 404 || error.response?.status === 400) {

                return []
            }

            // Với các lỗi khác, cũng trả về mảng rỗng để không block UI

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

            throw new Error(error.response?.data?.message || 'Lỗi khi lấy template')
        }
    }

    /**
     * Lấy danh sách templates active (public)
     */
    static async getActiveTemplates(serviceId?: number): Promise<{ items: ServiceChecklistTemplate[], total: number }> {
        try {
            const url = serviceId
                ? `/service-templates/active?serviceId=${serviceId}`
                : '/service-templates/active'
            const response = await api.get(url)
            return {
                items: response.data.items || [],
                total: response.data.total || 0
            }
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách templates active')
        }
    }

    /**
     * Tạo template mới (admin only)
     */
    static async createTemplate(templateData: TemplateCreateRequest): Promise<{ templateId: number }> {
        try {
            const response = await api.post('/service-templates', templateData)
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi tạo template')
        }
    }

    /**
     * Cập nhật template (admin only)
     */
    static async updateTemplate(templateId: number, updateData: TemplateUpdateRequest): Promise<{ templateId: number }> {
        try {
            const response = await api.put(`/service-templates/${templateId}`, updateData)
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật template')
        }
    }

    /**
     * Upsert items cho template (admin only)
     */
    static async upsertItems(templateId: number, items: TemplateItemDto[]): Promise<{ updated: boolean }> {
        try {
            const response = await api.put(`/service-templates/${templateId}/items`, { items })
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật items')
        }
    }

    /**
     * Activate/Deactivate template (admin only)
     */
    static async activateTemplate(templateId: number, isActive: boolean): Promise<{ templateId: number, isActive: boolean }> {
        try {
            const response = await api.put(`/service-templates/${templateId}/activate`, { isActive })
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi kích hoạt/vô hiệu hóa template')
        }
    }

    /**
     * Lấy items của template (public) – trả về raw response
     */
    static async getTemplateItemsResponse(templateId: number): Promise<GetItemsResponse> {
        try {
            const response = await api.get(`/service-templates/${templateId}/items`)
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi lấy items của template')
        }
    }

    /**
     * Thêm part vào template (admin only)
     */
    static async addPartToTemplate(templateId: number, partId: number): Promise<{ message: string, templateId: number, partId: number }> {
        try {
            const response = await api.post(`/service-templates/${templateId}/parts/${partId}`)
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi thêm part vào template')
        }
    }

    /**
     * Xóa part khỏi template (admin only)
     */
    static async removePartFromTemplate(templateId: number, partId: number): Promise<{ message: string, templateId: number, partId: number }> {
        try {
            const response = await api.delete(`/service-templates/${templateId}/parts/${partId}`)
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi xóa part khỏi template')
        }
    }

    /**
     * Thêm nhiều part vào template cùng lúc (admin only)
     */
    static async addPartsBatch(templateId: number, partIds: number[]): Promise<{
        message: string
        templateId: number
        results: Array<{ partId: number, success: boolean, message: string }>
        errors?: string[]
    }> {
        try {
            const response = await api.post(`/service-templates/${templateId}/parts/batch`, { partIds })
            return response.data
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi thêm nhiều part vào template'
            const innerException = error.response?.data?.innerException || error.response?.data?.innerExceptionMessage
            throw new Error(innerException ? `${errorMessage}: ${innerException}` : errorMessage)
        }
    }

    /**
     * Xóa nhiều part khỏi template cùng lúc (admin only)
     */
    static async removePartsBatch(templateId: number, partIds: number[]): Promise<{
        message: string
        templateId: number
        results: Array<{ partId: number, success: boolean, message: string }>
        errors?: string[]
    }> {
        try {
            const response = await api.delete(`/service-templates/${templateId}/parts/batch`, { data: { partIds } })
            return response.data
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi xóa nhiều part khỏi template')
        }
    }

    /**
     * Xóa template (admin only)
     */
    static async deleteTemplate(templateId: number): Promise<void> {
        try {
            await api.delete(`/service-templates/${templateId}`)
        } catch (error: any) {

            throw new Error(error.response?.data?.message || 'Lỗi khi xóa template')
        }
    }

    /**
     * Lấy items (parts) của template theo template ID
     */
    static async getTemplateItems(templateId: number): Promise<ServiceChecklistTemplateItem[]> {
        try {

            const response = await api.get(`/service-templates/${templateId}/items`)

            // Backend trả về: { success: true, data: [...] }
            if (response.data?.success && Array.isArray(response.data.data)) {

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

            // Nếu là 404, trả về mảng rỗng (template không có items)
            if (error.response?.status === 404) {

                return []
            }

            // Với các lỗi khác, cũng trả về mảng rỗng để không block UI

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
                    const rawTemplateId =
                        template.templateId ??
                        (template as any).templateID ??
                        (template as any).TemplateID ??
                        (template as any).TemplateId ??
                        (template as any).templateID
                    const templateId = rawTemplateId !== undefined && rawTemplateId !== null ? Number(rawTemplateId) : undefined
                    if (!templateId || Number.isNaN(templateId)) {
                        return {
                            ...template,
                            items: []
                        }
                    }
                    try {
                        const items = await this.getTemplateItems(templateId)
                        return {
                            ...template,
                            items: items || []
                        }
                    } catch (error: any) {

                        return {
                            ...template,
                            items: []
                        }
                    }
                })
            )

            return templatesWithItems
        } catch (error: any) {

            // Fallback: trả về templates không có items
            return await this.getTemplatesByService(serviceId, activeOnly)
        }
    }
}

export default ServiceChecklistTemplateService