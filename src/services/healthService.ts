import api from './api'

export interface HealthCheckResponse {
  success: boolean
  message: string
  data?: {
    status: 'healthy' | 'unhealthy'
    timestamp: string
    version?: string
  }
}

export const HealthService = {
  /**
   * Check if backend is ready to accept requests
   * @param timeout Timeout in milliseconds (default: 3000ms)
   * @returns Promise<HealthCheckResponse>
   */
  async checkHealth(timeout: number = 3000): Promise<HealthCheckResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Note: api client baseURL already includes /api
      const response = await api.get('/health', {
        signal: controller.signal,
        timeout: timeout
      })

      clearTimeout(timeoutId)

      if (response.data) {
        return response.data
      }

      return {
        success: true,
        message: 'Backend is healthy',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      // If health check fails, backend is not ready
      return {
        success: false,
        message: 'Backend is not ready',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      }
    }
  },

  /**
   * Wait for backend to be ready with retry logic
   * @param maxRetries Maximum number of retries (default: 5)
   * @param retryDelay Delay between retries in milliseconds (default: 2000ms)
   * @param timeout Timeout for each health check (default: 3000ms)
   * @returns Promise<boolean> - true if backend is ready, false otherwise
   */
  async waitForBackendReady(
    maxRetries: number = 5,
    retryDelay: number = 2000,
    timeout: number = 3000
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      const healthCheck = await this.checkHealth(timeout)
      
      if (healthCheck.success && healthCheck.data?.status === 'healthy') {
        return true
      }

      // Wait before next retry (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = retryDelay * Math.pow(1.5, i)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return false
  }
}

