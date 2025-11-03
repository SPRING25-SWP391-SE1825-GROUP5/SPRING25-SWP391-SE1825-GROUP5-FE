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
   * Check if authentication/authorization system is ready
   * This requires a valid JWT token, so if it passes, auth system is initialized
   * @param timeout Timeout in milliseconds (default: 3000ms)
   * @returns Promise<HealthCheckResponse>
   */
  async checkAuthHealth(timeout: number = 3000): Promise<HealthCheckResponse> {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Note: api client baseURL already includes /api
      // This endpoint requires authentication
      const response = await api.get('/health/auth', {
        signal: controller.signal,
        timeout: timeout
      })

      clearTimeout(timeoutId)

      if (response.data) {
        return response.data
      }

      return {
        success: true,
        message: 'Authentication system is ready',
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString()
        }
      }
    } catch (error: any) {
      // If auth health check fails, auth system is not ready yet
      return {
        success: false,
        message: 'Authentication system is not ready',
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString()
        }
      }
    }
  },

  /**
   * Wait for backend to be ready with retry logic
   * Checks both basic health and auth health if token is available
   * @param maxRetries Maximum number of retries (default: 5)
   * @param retryDelay Delay between retries in milliseconds (default: 2000ms)
   * @param timeout Timeout for each health check (default: 3000ms)
   * @param checkAuth Whether to also check auth health (default: true if token exists)
   * @returns Promise<boolean> - true if backend is ready, false otherwise
   */
  async waitForBackendReady(
    maxRetries: number = 5,
    retryDelay: number = 2000,
    timeout: number = 3000,
    checkAuth: boolean = true
  ): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        // First, check basic health
        const healthCheck = await this.checkHealth(timeout)

        if (!healthCheck.success || healthCheck.data?.status !== 'healthy') {
          // Basic health failed, wait and retry
          if (i < maxRetries - 1) {
            const delay = retryDelay * Math.pow(1.5, i)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
          continue
        }

        // Basic health passed, now check auth health if needed
        if (checkAuth) {
          try {
            const authHealthCheck = await this.checkAuthHealth(timeout)

            if (authHealthCheck.success && authHealthCheck.data?.status === 'healthy') {
              // Both health checks passed - backend is fully ready
              console.log('[HEALTH_CHECK] Both basic and auth health checks passed')
              return true
            } else {
              // Auth health failed, but basic health passed - auth system not ready yet
              console.log(`[HEALTH_CHECK] Basic health OK, but auth not ready yet. Retry ${i + 1}/${maxRetries}`)

              // Wait before next retry (longer delay for auth initialization)
              if (i < maxRetries - 1) {
                const delay = retryDelay * Math.pow(1.5, i) * 1.5 // Longer delay for auth
                await new Promise(resolve => setTimeout(resolve, delay))
              }
              continue
            }
          } catch (authError: any) {
            // Auth health check failed (likely 401/403) - auth system not ready
            // But if it's a real auth error (not restart), we should handle it differently
            const status = authError?.response?.status
            if (status === 401 || status === 403) {
              // Might be auth not ready yet (during restart) or real auth error
              // Check error message to determine
              const errorMessage = (authError?.response?.data?.message || '').toLowerCase()
              const isRealAuthError = errorMessage.includes('token expired') ||
                                     errorMessage.includes('token invalid') ||
                                     errorMessage.includes('phiên đăng nhập')

              if (isRealAuthError) {
                // Real auth error, don't retry
                console.warn('[HEALTH_CHECK] Real auth error detected, not a restart issue')
                return false
              }

              // Likely auth system not ready yet
              console.log(`[HEALTH_CHECK] Auth system not ready yet. Retry ${i + 1}/${maxRetries}`)
              if (i < maxRetries - 1) {
                const delay = retryDelay * Math.pow(1.5, i) * 1.5
                await new Promise(resolve => setTimeout(resolve, delay))
              }
              continue
            }

            // Other error, wait and retry
            console.warn(`[HEALTH_CHECK] Auth health check error:`, authError)
            if (i < maxRetries - 1) {
              const delay = retryDelay * Math.pow(1.5, i)
              await new Promise(resolve => setTimeout(resolve, delay))
            }
            continue
          }
        } else {
          // Only basic health check needed
          return true
        }
      } catch (error) {
        console.warn(`[HEALTH_CHECK] Attempt ${i + 1}/${maxRetries} failed:`, error)
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

