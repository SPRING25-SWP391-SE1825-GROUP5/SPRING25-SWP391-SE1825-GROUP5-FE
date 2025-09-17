export interface Part {
  id: string
  name: string
  category: string
  stock: number
  price: number
  supplier: string
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng'
  lastUpdated: string
}

export interface PartFormData {
  name: string
  category: string
  stock: number
  price: number
  supplier: string
}

export interface PartsFilters {
  search: string
  category: string
  status: string
  supplier: string
}

