import { ref, reactive } from 'vue'
import type { ApiError } from '../types/api'

// Composable for handling API state
export function useApi<T>() {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<ApiError | null>(null)

  const execute = async (apiCall: () => Promise<T>): Promise<T | null> => {
    try {
      loading.value = true
      error.value = null
      
      const result = await apiCall()
      data.value = result
      return result
    } catch (err: any) {
      error.value = {
        message: err.response?.data?.message || err.message || 'An error occurred',
        code: err.response?.status?.toString(),
        details: err.response?.data
      }
      return null
    } finally {
      loading.value = false
    }
  }

  const reset = () => {
    data.value = null
    error.value = null
    loading.value = false
  }

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}

// Composable for handling paginated API calls
export function usePaginatedApi<T>() {
  const items = ref<T[]>([])
  const loading = ref(false)
  const error = ref<ApiError | null>(null)
  
  const pagination = reactive({
    totalCount: 0,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  const execute = async (
    apiCall: (params: any) => Promise<any>
  ): Promise<T[] | null> => {
    try {
      loading.value = true
      error.value = null
      
      const params = {
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize
      }
      
      const response = await apiCall(params)
      
      if (response.data) {
        items.value = response.data.data || []
        pagination.totalCount = response.data.totalCount || 0
        pagination.totalPages = response.data.totalPages || 0
        pagination.hasNextPage = response.data.hasNextPage || false
        pagination.hasPreviousPage = response.data.hasPreviousPage || false
      }
      
      return items.value
    } catch (err: any) {
      error.value = {
        message: err.response?.data?.message || err.message || 'An error occurred',
        code: err.response?.status?.toString(),
        details: err.response?.data
      }
      return null
    } finally {
      loading.value = false
    }
  }

  const nextPage = () => {
    if (pagination.hasNextPage) {
      pagination.pageNumber++
    }
  }

  const prevPage = () => {
    if (pagination.hasPreviousPage) {
      pagination.pageNumber--
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      pagination.pageNumber = page
    }
  }

  const reset = () => {
    items.value = []
    error.value = null
    loading.value = false
    pagination.totalCount = 0
    pagination.pageNumber = 1
    pagination.totalPages = 0
    pagination.hasNextPage = false
    pagination.hasPreviousPage = false
  }

  return {
    items,
    loading,
    error,
    pagination,
    execute,
    nextPage,
    prevPage,
    goToPage,
    reset
  }
}
