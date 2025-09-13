# Code Convention - Vue.js Project

## Table of Contents
1. [Color Scheme Standards](#color-scheme-standards)
2. [Folder Structure](#folder-structure)
3. [API Conventions](#api-conventions)
4. [Vue.js Coding Standards](#vuejs-coding-standards)
5. [Naming Conventions](#naming-conventions)

---

## Color Scheme Standards

### Primary Color Palette
```css
/* Primary Colors */
--primary-blue: #3B82F6;      /* Main brand color */
--primary-blue-dark: #1E40AF; /* Hover states */
--primary-blue-light: #DBEAFE; /* Backgrounds */

/* Secondary Colors */
--secondary-gray: #6B7280;    /* Text secondary */
--secondary-gray-dark: #374151; /* Text primary */
--secondary-gray-light: #F3F4F6; /* Backgrounds */

/* Status Colors */
--success-green: #10B981;     /* Success messages */
--warning-yellow: #F59E0B;    /* Warning messages */
--error-red: #EF4444;         /* Error messages */
--info-blue: #3B82F6;         /* Info messages */
```

### Color Usage Guidelines
- **Primary Blue**: Buttons, links, active states
- **Gray Variants**: Text, borders, backgrounds
- **Status Colors**: Alerts, notifications, form validation

### CSS Custom Properties
```css
:root {
  /* Text Colors */
  --text-primary: #111827;
  --text-secondary: #6B7280;
  --text-muted: #9CA3AF;
  
  /* Background Colors */
  --bg-primary: #FFFFFF;
  --bg-secondary: #F9FAFB;
  --bg-tertiary: #F3F4F6;
  
  /* Border Colors */
  --border-primary: #E5E7EB;
  --border-secondary: #D1D5DB;
}
```

---

## Folder Structure

```
src/
├── assets/                 # Static assets
│   ├── images/            # Images, icons
│   ├── styles/            # Global CSS/SCSS
│   └── fonts/             # Font files
├── components/            # Reusable components
│   ├── common/           # Common UI components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── views/                # Page components
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard pages
│   └── user/             # User management pages
├── router/               # Vue Router configuration
├── store/                # Vuex/Pinia store
│   ├── modules/          # Store modules
│   └── index.js          # Store entry point
├── services/             # API services
│   ├── api/              # API endpoints
│   ├── auth.js           # Authentication service
│   └── http.js           # HTTP client configuration
├── utils/                # Utility functions
├── composables/          # Vue 3 composables
├── plugins/              # Vue plugins
├── constants/            # Application constants
└── types/                # TypeScript type definitions
```

### Component Organization Rules
1. **One component per file**
2. **PascalCase for component names**
3. **Group related components in folders**
4. **Use index.js for barrel exports**

---

## API Conventions

### Endpoint Naming
```javascript
// RESTful API endpoints
GET    /api/users          // Get all users
GET    /api/users/:id      // Get user by ID
POST   /api/users          // Create user
PUT    /api/users/:id      // Update user
DELETE /api/users/:id      // Delete user

// Nested resources
GET    /api/users/:id/posts     // Get user's posts
POST   /api/users/:id/posts     // Create post for user
```

### Request/Response Format
```javascript
// Request format
{
  "data": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

// Success response format
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

// Error response format
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": ["Email is required"]
    }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## Vue.js Coding Standards

### Component Structure
```vue
<template>
  <!-- Template content -->
</template>

<script>
// Imports
import { ref, computed, onMounted } from 'vue'

// Component definition
export default {
  name: 'ComponentName',
  props: {
    // Props definition
  },
  emits: ['event-name'],
  setup(props, { emit }) {
    // Composition API logic
    return {
      // Exposed properties
    }
  }
}
</script>

<style scoped>
/* Component styles */
</style>
```

### Props Definition
```javascript
props: {
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  },
  isVisible: {
    type: Boolean,
    default: false
  }
}
```

---

## Naming Conventions

### Files and Folders
- **Components**: PascalCase (`UserProfile.vue`)
- **Views**: PascalCase (`UserDashboard.vue`)
- **Utilities**: camelCase (`formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Folders**: kebab-case (`user-management/`)

### Variables and Functions
- **Variables**: camelCase (`userName`, `isLoading`)
- **Functions**: camelCase (`getUserData`, `handleSubmit`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Events**: kebab-case (`user-updated`, `form-submitted`)

### CSS Classes
- **BEM Methodology**: 
  ```css
  .button { }                    /* Block */
  .button__icon { }              /* Element */
  .button--primary { }           /* Modifier */
  .button--primary__icon { }     /* Element in modified block */
  ```

### Git Commit Messages
```
feat: add user authentication
fix: resolve login validation issue
docs: update API documentation
style: format code according to eslint
refactor: restructure user service
test: add unit tests for user component
chore: update dependencies
```
