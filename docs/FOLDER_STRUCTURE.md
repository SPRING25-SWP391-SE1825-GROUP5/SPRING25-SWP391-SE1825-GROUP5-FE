# Folder Structure Guidelines

## Project Root Structure

```
vue-frontend/
├── public/                 # Static files served directly
│   ├── index.html         # Main HTML template
│   ├── favicon.ico        # Favicon
│   └── robots.txt         # SEO robots file
├── src/                   # Source code
├── tests/                 # Test files
├── docs/                  # Documentation
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── README.md             # Project documentation
```

## Source Code Structure (`src/`)

```
src/
├── assets/               # Static assets
│   ├── images/          # Images and graphics
│   │   ├── icons/       # SVG icons
│   │   ├── logos/       # Brand logos
│   │   └── backgrounds/ # Background images
│   ├── styles/          # Global styles
│   │   ├── main.scss    # Main stylesheet
│   │   ├── variables.scss # SCSS variables
│   │   ├── mixins.scss  # SCSS mixins
│   │   └── components.scss # Component styles
│   └── fonts/           # Custom fonts
├── components/          # Reusable Vue components
│   ├── common/          # Common UI components
│   │   ├── BaseButton.vue
│   │   ├── BaseInput.vue
│   │   ├── BaseModal.vue
│   │   └── index.js     # Barrel export
│   ├── forms/           # Form-specific components
│   │   ├── LoginForm.vue
│   │   ├── RegisterForm.vue
│   │   └── ContactForm.vue
│   ├── layout/          # Layout components
│   │   ├── AppHeader.vue
│   │   ├── AppSidebar.vue
│   │   ├── AppFooter.vue
│   │   └── AppLayout.vue
│   └── ui/              # UI-specific components
│       ├── Card.vue
│       ├── Badge.vue
│       └── Tooltip.vue
├── views/               # Page components (routes)
│   ├── auth/            # Authentication pages
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   └── ForgotPasswordView.vue
│   ├── dashboard/       # Dashboard pages
│   │   ├── DashboardView.vue
│   │   ├── AnalyticsView.vue
│   │   └── SettingsView.vue
│   ├── user/            # User management
│   │   ├── UserListView.vue
│   │   ├── UserDetailView.vue
│   │   └── UserEditView.vue
│   └── HomeView.vue     # Home page
├── router/              # Vue Router configuration
│   ├── index.js         # Main router file
│   ├── guards.js        # Route guards
│   └── routes/          # Route definitions
│       ├── auth.js      # Auth routes
│       ├── dashboard.js # Dashboard routes
│       └── user.js      # User routes
├── store/               # State management (Pinia/Vuex)
│   ├── index.js         # Store configuration
│   ├── modules/         # Store modules
│   │   ├── auth.js      # Authentication store
│   │   ├── user.js      # User store
│   │   └── app.js       # App-wide store
│   └── types.js         # Store type definitions
├── services/            # API and external services
│   ├── api/             # API endpoints
│   │   ├── auth.js      # Authentication API
│   │   ├── user.js      # User API
│   │   └── dashboard.js # Dashboard API
│   ├── http.js          # HTTP client (Axios)
│   ├── storage.js       # Local/Session storage
│   └── websocket.js     # WebSocket service
├── utils/               # Utility functions
│   ├── helpers.js       # General helpers
│   ├── validators.js    # Form validators
│   ├── formatters.js    # Data formatters
│   └── constants.js     # App constants
├── composables/         # Vue 3 composables
│   ├── useAuth.js       # Authentication composable
│   ├── useApi.js        # API composable
│   └── useLocalStorage.js # Storage composable
├── plugins/             # Vue plugins
│   ├── i18n.js          # Internationalization
│   ├── toast.js         # Toast notifications
│   └── validation.js    # Form validation
├── directives/          # Custom Vue directives
│   ├── clickOutside.js  # Click outside directive
│   └── tooltip.js       # Tooltip directive
├── types/               # TypeScript definitions
│   ├── api.ts           # API types
│   ├── user.ts          # User types
│   └── common.ts        # Common types
├── App.vue              # Root component
└── main.js              # Application entry point
```

## Component Organization Rules

### 1. Component Naming
```
// ✅ Good - PascalCase
UserProfile.vue
ProductCard.vue
NavigationMenu.vue

// ❌ Bad
userProfile.vue
product-card.vue
navigation_menu.vue
```

### 2. Component Structure
```vue
<!-- UserProfile.vue -->
<template>
  <div class="user-profile">
    <!-- Template content -->
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'UserProfile',
  // Component logic
})
</script>

<style scoped>
.user-profile {
  /* Component styles */
}
</style>
```

### 3. Barrel Exports
```javascript
// components/common/index.js
export { default as BaseButton } from './BaseButton.vue'
export { default as BaseInput } from './BaseInput.vue'
export { default as BaseModal } from './BaseModal.vue'

// Usage in other files
import { BaseButton, BaseInput } from '@/components/common'
```

## File Naming Conventions

### Components
- **Vue Components**: PascalCase (`UserProfile.vue`)
- **Component folders**: kebab-case (`user-profile/`)
- **Index files**: `index.js` or `index.vue`

### JavaScript/TypeScript Files
- **Services**: camelCase (`authService.js`)
- **Utils**: camelCase (`formatDate.js`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS.js`)
- **Types**: camelCase (`userTypes.ts`)

### Styles
- **SCSS files**: kebab-case (`main-layout.scss`)
- **CSS modules**: camelCase (`Button.module.css`)

## Asset Organization

### Images
```
assets/images/
├── icons/              # SVG icons
│   ├── user.svg
│   ├── settings.svg
│   └── logout.svg
├── logos/              # Brand assets
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── favicon.png
├── avatars/            # User avatars
│   └── default-avatar.png
└── backgrounds/        # Background images
    ├── hero-bg.jpg
    └── pattern-bg.svg
```

### Styles
```
assets/styles/
├── main.scss           # Main entry point
├── variables.scss      # SCSS variables
├── mixins.scss         # SCSS mixins
├── base/               # Base styles
│   ├── reset.scss      # CSS reset
│   ├── typography.scss # Typography
│   └── utilities.scss  # Utility classes
├── components/         # Component styles
│   ├── buttons.scss    # Button styles
│   ├── forms.scss      # Form styles
│   └── cards.scss      # Card styles
└── pages/              # Page-specific styles
    ├── home.scss       # Home page
    └── dashboard.scss  # Dashboard page
```

## Import Path Aliases

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@store': resolve(__dirname, 'src/store'),
      '@router': resolve(__dirname, 'src/router')
    }
  }
})
```

### Usage Examples
```javascript
// ✅ Good - Using aliases
import UserProfile from '@components/user/UserProfile.vue'
import { authService } from '@services/api/auth'
import { formatDate } from '@utils/formatters'

// ❌ Avoid - Relative paths
import UserProfile from '../../../components/user/UserProfile.vue'
import { authService } from '../../services/api/auth'
```

## Testing Structure

```
tests/
├── unit/               # Unit tests
│   ├── components/     # Component tests
│   ├── utils/          # Utility tests
│   └── services/       # Service tests
├── integration/        # Integration tests
├── e2e/               # End-to-end tests
├── fixtures/          # Test data
└── helpers/           # Test helpers
```

## Environment Configuration

```
# Development
.env.development

# Production
.env.production

# Local (git-ignored)
.env.local

# Example template
.env.example
```

## Best Practices

### 1. Keep Components Small
- Max 200 lines per component
- Split large components into smaller ones
- Use composition over inheritance

### 2. Consistent Naming
- Use descriptive names
- Follow established patterns
- Avoid abbreviations

### 3. Logical Grouping
- Group related functionality
- Separate concerns
- Use clear folder hierarchy

### 4. Documentation
- Add README files for complex modules
- Document component props and events
- Include usage examples
