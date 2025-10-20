// Promotion Types - Định nghĩa interfaces cho Promotion Management
export interface Promotion {
  promotionId: number
  code: string
  description: string
  discountValue: number
  discountType: 'PERCENTAGE' | 'FIXED'
  minOrderAmount?: number
  startDate: string
  endDate?: string
  maxDiscount?: number
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  createdAt: string
  updatedAt: string
  usageLimit?: number
  usageCount: number
  isActive: boolean
  isExpired: boolean
  isUsageLimitReached: boolean
  remainingUsage: number
}

export interface CreatePromotionRequest {
  code: string
  description: string
  discountValue: number
  discountType: 'PERCENTAGE' | 'FIXED'
  minOrderAmount?: number
  startDate: string
  endDate?: string
  maxDiscount?: number
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  usageLimit?: number
}

export interface UpdatePromotionRequest {
  code?: string
  description?: string
  discountValue?: number
  discountType?: 'PERCENTAGE' | 'FIXED'
  minOrderAmount?: number
  startDate?: string
  endDate?: string
  maxDiscount?: number
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  usageLimit?: number
}

export interface PromotionFilters {
  pageNumber?: number
  pageSize?: number
  searchTerm?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED'
  promotionType?: string
}

export interface PromotionResponse {
  data: Promotion[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

export interface ApplyPromotionRequest {
  code: string
}

export interface PromotionUsage {
  promotionId: number
  code: string
  description: string
  usedAt: string
  bookingId?: number
  orderId?: number
  discountAmount: number
}
