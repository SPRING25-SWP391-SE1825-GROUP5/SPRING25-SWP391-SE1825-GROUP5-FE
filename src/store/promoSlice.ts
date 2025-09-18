import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface Promotion {
  id: string
  code: string
  title: string
  description: string
  type: 'percentage' | 'fixed' | 'shipping'
  value: number // percentage (1-100) or fixed amount
  minOrder?: number // minimum order amount to apply
  maxDiscount?: number // maximum discount for percentage promos
  validFrom: string
  validTo: string
  isActive: boolean
  usageLimit?: number
  usedCount: number
  category?: string[]
  image?: string
}

interface PromoState {
  savedPromotions: Promotion[]
  appliedPromo: Promotion | null
  availablePromotions: Promotion[]
}

// Mock saved promotions for user
const mockSavedPromotions: Promotion[] = [
  {
    id: 'promo1',
    code: 'NEWUSER20',
    title: 'Giảm 20% cho khách hàng mới',
    description: 'Dành cho đơn hàng đầu tiên từ 1 triệu VNĐ',
    type: 'percentage',
    value: 20,
    minOrder: 1000000,
    maxDiscount: 500000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 1,
    usedCount: 0,
    category: ['parts', 'accessories'],
    image: 'https://via.placeholder.com/60x40/22c55e/ffffff?text=20%25'
  },
  {
    id: 'promo2',
    code: 'FREESHIP',
    title: 'Miễn phí vận chuyển',
    description: 'Áp dụng cho tất cả đơn hàng',
    type: 'shipping',
    value: 200000,
    minOrder: 500000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 999,
    usedCount: 45,
    image: 'https://via.placeholder.com/60x40/3b82f6/ffffff?text=SHIP'
  },
  {
    id: 'promo3',
    code: 'SAVE500K',
    title: 'Giảm 500K',
    description: 'Cho đơn hàng từ 5 triệu VNĐ',
    type: 'fixed',
    value: 500000,
    minOrder: 5000000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 100,
    usedCount: 23,
    category: ['equipment'],
    image: 'https://via.placeholder.com/60x40/ef4444/ffffff?text=500K'
  },
  {
    id: 'promo4',
    code: 'BIRTHDAY15',
    title: 'Sinh nhật 15%',
    description: 'Khuyến mãi sinh nhật tháng này',
    type: 'percentage',
    value: 15,
    minOrder: 2000000,
    maxDiscount: 1000000,
    validFrom: '2024-01-01',
    validTo: '2024-01-31',
    isActive: true,
    usageLimit: 1,
    usedCount: 0,
    image: 'https://via.placeholder.com/60x40/f59e0b/ffffff?text=15%25'
  },
  {
    id: 'promo5',
    code: 'MEMBER10',
    title: 'Thành viên VIP 10%',
    description: 'Dành cho thành viên VIP',
    type: 'percentage',
    value: 10,
    minOrder: 1500000,
    maxDiscount: 300000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    isActive: true,
    usageLimit: 5,
    usedCount: 2,
    image: 'https://via.placeholder.com/60x40/8b5cf6/ffffff?text=VIP'
  }
]

const initialState: PromoState = {
  savedPromotions: mockSavedPromotions,
  appliedPromo: null,
  availablePromotions: mockSavedPromotions.filter(p => p.isActive)
}

const promoSlice = createSlice({
  name: 'promo',
  initialState,
  reducers: {
    applyPromotion: (state, action: PayloadAction<Promotion>) => {
      state.appliedPromo = action.payload
    },
    
    removePromotion: (state) => {
      state.appliedPromo = null
    },
    
    savePromotion: (state, action: PayloadAction<Promotion>) => {
      const existing = state.savedPromotions.find(p => p.id === action.payload.id)
      if (!existing) {
        state.savedPromotions.push(action.payload)
      }
    },
    
    unsavePromotion: (state, action: PayloadAction<string>) => {
      state.savedPromotions = state.savedPromotions.filter(p => p.id !== action.payload)
    },
    
    setAvailablePromotions: (state, action: PayloadAction<Promotion[]>) => {
      state.availablePromotions = action.payload
    }
  }
})

export const {
  applyPromotion,
  removePromotion,
  savePromotion,
  unsavePromotion,
  setAvailablePromotions
} = promoSlice.actions

export default promoSlice.reducer
