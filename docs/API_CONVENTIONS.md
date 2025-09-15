# API Conventions

## RESTful API Design

### Endpoint Structure
```
https://api.example.com/v1/{resource}
```

### Resource Naming
- Use **plural nouns** for resources: `/users`, `/products`, `/orders`
- Use **kebab-case** for multi-word resources: `/user-profiles`, `/order-items`
- Avoid verbs in URLs: Use HTTP methods instead

### HTTP Methods
```javascript
// Users Resource
GET    /api/v1/users           // Get all users
GET    /api/v1/users/:id       // Get specific user
POST   /api/v1/users           // Create new user
PUT    /api/v1/users/:id       // Update entire user
PATCH  /api/v1/users/:id       // Partial update user
DELETE /api/v1/users/:id       // Delete user

// Nested Resources
GET    /api/v1/users/:id/posts      // Get user's posts
POST   /api/v1/users/:id/posts      // Create post for user
GET    /api/v1/users/:id/posts/:postId  // Get specific post
```

### Query Parameters
```javascript
// Pagination
GET /api/v1/users?page=1&limit=20

// Filtering
GET /api/v1/users?status=active&role=admin

// Sorting
GET /api/v1/users?sort=created_at&order=desc

// Search
GET /api/v1/users?search=john&fields=name,email

// Include related data
GET /api/v1/users?include=profile,posts
```

## Request/Response Format

### Standard Request Format
```javascript
// POST/PUT/PATCH requests
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "meta": {
    "client_version": "1.0.0",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Success Response Format
```javascript
// Single resource
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}

// Collection response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  ],
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 100,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Error Response Format
```javascript
// Validation Error (422)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The given data was invalid",
    "details": {
      "email": [
        "The email field is required",
        "The email must be a valid email address"
      ],
      "password": [
        "The password must be at least 8 characters"
      ]
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

// Authentication Error (401)
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "details": null
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

// Not Found Error (404)
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User not found",
    "details": {
      "resource": "user",
      "id": 123
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## HTTP Status Codes

### Success Codes
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE

### Client Error Codes
- `400 Bad Request` - Invalid request format
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded

### Server Error Codes
- `500 Internal Server Error` - Server error
- `502 Bad Gateway` - Gateway error
- `503 Service Unavailable` - Service down

## Authentication & Authorization

### JWT Token Format
```javascript
// Request Header
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Token Payload
{
  "sub": "1234567890",
  "name": "John Doe",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

### Auth Endpoints
```javascript
// Authentication
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

// Profile
GET  /api/v1/auth/profile
PUT  /api/v1/auth/profile
```

## API Service Implementation

### HTTP Client Configuration
```javascript
// services/http.js
import axios from 'axios'
import { useAuthStore } from '@/store/auth'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
httpClient.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default httpClient
```

### API Service Structure
```javascript
// services/api/users.js
import httpClient from '../http'

export const userService = {
  // Get all users
  async getUsers(params = {}) {
    return httpClient.get('/users', { params })
  },

  // Get user by ID
  async getUser(id) {
    return httpClient.get(`/users/${id}`)
  },

  // Create user
  async createUser(userData) {
    return httpClient.post('/users', { data: userData })
  },

  // Update user
  async updateUser(id, userData) {
    return httpClient.put(`/users/${id}`, { data: userData })
  },

  // Delete user
  async deleteUser(id) {
    return httpClient.delete(`/users/${id}`)
  },

  // Get user posts
  async getUserPosts(userId, params = {}) {
    return httpClient.get(`/users/${userId}/posts`, { params })
  }
}
```

### Error Handling
```javascript
// utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.error) {
    const { code, message, details } = error.error
    
    switch (code) {
      case 'VALIDATION_ERROR':
        return {
          type: 'validation',
          message,
          fields: details
        }
      case 'UNAUTHORIZED':
        return {
          type: 'auth',
          message: 'Please log in to continue'
        }
      case 'RESOURCE_NOT_FOUND':
        return {
          type: 'notFound',
          message: 'The requested resource was not found'
        }
      default:
        return {
          type: 'general',
          message: message || 'An error occurred'
        }
    }
  }
  
  return {
    type: 'network',
    message: 'Lỗi kết nối. Thử lại.'
  }
}
```

## Vue Composable for API

### useApi Composable
```javascript
// composables/useApi.js
import { ref, reactive } from 'vue'
import { handleApiError } from '@/utils/errorHandler'

export function useApi(apiFunction) {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

  const execute = async (...args) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await apiFunction(...args)
      data.value = response.data
      return response
    } catch (err) {
      error.value = handleApiError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    data,
    execute
  }
}

// Usage in component
import { userService } from '@/services/api/users'
import { useApi } from '@/composables/useApi'

export default {
  setup() {
    const { loading, error, data, execute } = useApi(userService.getUsers)
    
    const loadUsers = () => execute({ page: 1, limit: 20 })
    
    return {
      loading,
      error,
      users: data,
      loadUsers
    }
  }
}
```

## API Documentation

### Endpoint Documentation Template
```javascript
/**
 * Get Users
 * 
 * @route GET /api/v1/users
 * @param {Object} query - Query parameters
 * @param {number} query.page - Page number (default: 1)
 * @param {number} query.limit - Items per page (default: 20)
 * @param {string} query.search - Search term
 * @param {string} query.sort - Sort field
 * @param {string} query.order - Sort order (asc|desc)
 * 
 * @returns {Object} Response
 * @returns {boolean} response.success - Success status
 * @returns {Array} response.data - User array
 * @returns {Object} response.meta - Metadata with pagination
 * 
 * @example
 * // Request
 * GET /api/v1/users?page=1&limit=10&search=john
 * 
 * // Response
 * {
 *   "success": true,
 *   "data": [...],
 *   "meta": {
 *     "pagination": {...}
 *   }
 * }
 */
```

## Rate Limiting

### Implementation
```javascript
// Rate limit headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200

// Rate limit exceeded response
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "details": {
      "retry_after": 60
    }
  }
}
```
