# Color Scheme Guidelines

## Brand Colors

### Primary Palette
```scss
// Brand Primary (current web scheme)
$primary-50: #e6f2f0;
$primary-100: #cce5e0;
$primary-200: #99ccc1;
$primary-300: #66b2a1;
$primary-400: #4A9782;
$primary-500: #004030;  // Main brand color
$primary-600: #003629;
$primary-700: #002d22;
$primary-800: #00241b;
$primary-900: #001a14;

// Brand Secondary (current web scheme)
$secondary-50: #FFF9E5;
$secondary-100: #fff6d6;
$secondary-200: #ffedac;
$secondary-300: #ffe483;
$secondary-400: #4A9782;
$secondary-500: #4A9782;  // Secondary accent
$secondary-600: #3d7a6a;
$secondary-700: #305c52;
$secondary-800: #44444E;
$secondary-900: #44444E;
```

### Semantic Colors
```scss
// Success
$success-50: #ecfdf5;
$success-500: #10b981;
$success-600: #059669;
$success-700: #047857;

// Warning
$warning-50: #fffbeb;
$warning-500: #f59e0b;
$warning-600: #d97706;
$warning-700: #b45309;

// Error
$error-50: #fef2f2;
$error-500: #ef4444;
$error-600: #dc2626;
$error-700: #b91c1c;

// Info (mapped to primary scheme)
$info-50: #e6f2f0;
$info-500: #004030;
$info-600: #003629;
$info-700: #002d22;
```

## CSS Custom Properties
### Color Primitives (CSS Variables)
```css
:root {
  /* Primary */
  --primary-50: #e6f2f0;
  --primary-100: #cce5e0;
  --primary-200: #99ccc1;
  --primary-300: #66b2a1;
  --primary-400: #4A9782;
  --primary-500: #004030;
  --primary-600: #003629;
  --primary-700: #002d22;
  --primary-800: #00241b;
  --primary-900: #001a14;

  /* Secondary */
  --secondary-50: #FFF9E5;
  --secondary-100: #fff6d6;
  --secondary-200: #ffedac;
  --secondary-300: #ffe483;
  --secondary-400: #4A9782;
  --secondary-500: #4A9782;
  --secondary-600: #3d7a6a;
  --secondary-700: #305c52;
  --secondary-800: #44444E;
  --secondary-900: #44444E;
}
```

### Light Theme (current web)
```css
:root {
  /* Text Colors */
  --text-primary: #44444E;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --text-inverse: #FFF9E5;
  --text-link: #4A9782;
  --text-link-hover: #004030;

  /* Background Colors */
  --bg-primary: #FFF9E5;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f3f4f6;
  --bg-overlay: rgba(0, 64, 48, 0.5);
  --bg-card: #ffffff;
  --bg-input: #ffffff;

  /* Border Colors */
  --border-primary: #e5e7eb;
  --border-secondary: #d1d5db;
  --border-focus: #4A9782;
  --border-error: #ef4444;

  /* Shadow */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### Dark Theme
```css
[data-theme="dark"] {
  /* Text Colors */
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --text-tertiary: #9ca3af;
  --text-inverse: #111827;
  --text-link: #60a5fa;
  --text-link-hover: #93c5fd;

  /* Background Colors */
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --bg-tertiary: #374151;
  --bg-overlay: rgba(0, 0, 0, 0.7);
  --bg-card: #1f2937;
  --bg-input: #374151;

  /* Border Colors */
  --border-primary: #374151;
  --border-secondary: #4b5563;
  --border-focus: #60a5fa;
  --border-error: #f87171;
}
```

## Component Color Usage

### Buttons (match current components)
```scss
// Primary Button
.btn--primary {
  background-color: var(--primary-500);
  color: var(--text-inverse);
  border: 1px solid var(--primary-500);

  &:hover {
    background-color: var(--primary-600);
    border-color: var(--primary-600);
  }
}

// Outline Button (used in Booking flow for Back button)
.btn--outline {
  background-color: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-primary);

  &:hover {
    background-color: var(--primary-50);
    border-color: var(--primary-300);
    color: var(--text-primary);
  }
}
```

### Interactive Cards and Selectable Items (hover like Booking)
```scss
// Generic selectable card
.selectable {
  border: 2px solid var(--border-primary);
  border-radius: 8px;
  background: var(--bg-card);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary-300);
    background: var(--primary-50);
  }

  &.selected {
    border-color: var(--primary-500);
    background: var(--primary-50);
  }
}

// Time slot button
.time-slot {
  border: 1px solid var(--border-primary);
  background: #fff;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: var(--primary-300);
    background: var(--primary-50);
  }

  &.selected {
    background: var(--primary-500);
    color: var(--text-inverse);
    border-color: var(--primary-500);
  }

  &:disabled {
    background: var(--bg-secondary);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
}
```

### Form Elements
```scss
// Input Fields
.form-input {
  background-color: var(--bg-input);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);

  &:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &.error {
    border-color: var(--border-error);
  }
}

// Labels
.form-label {
  color: var(--text-secondary);
  font-weight: 500;
}
```

### Status Indicators
```scss
// Success State
.status-success {
  color: var(--success-700);
  background-color: var(--success-50);
  border: 1px solid var(--success-200);
}

// Warning State
.status-warning {
  color: var(--warning-700);
  background-color: var(--warning-50);
  border: 1px solid var(--warning-200);
}

// Error State
.status-error {
  color: var(--error-700);
  background-color: var(--error-50);
  border: 1px solid var(--error-200);
}
```

## Accessibility Guidelines

### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

### Color Blind Friendly
- Never rely on color alone to convey information
- Use icons, patterns, or text labels alongside colors
- Test with color blindness simulators

### Focus States
```scss
// Focus outline for keyboard navigation
.focusable:focus {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

// Skip focus outline for mouse users
.focusable:focus:not(:focus-visible) {
  outline: none;
}
```

## Implementation Examples

### Vue Component with Theme Support
```vue
<template>
  <div class="card" :class="{ 'card--dark': isDark }">
    <h2 class="card__title">{{ title }}</h2>
    <p class="card__content">{{ content }}</p>
  </div>
</template>

<script>
export default {
  name: 'ThemeCard',
  props: {
    title: String,
    content: String
  },
  computed: {
    isDark() {
      return this.$store.state.theme === 'dark'
    }
  }
}
</script>

<style scoped>
.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}

.card__title {
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.card__content {
  color: var(--text-secondary);
}
</style>
```

### SCSS Mixins for Consistent Styling
```scss
// Button mixin
@mixin button-variant($bg-color, $text-color, $border-color) {
  background-color: $bg-color;
  color: $text-color;
  border: 1px solid $border-color;

  &:hover {
    background-color: darken($bg-color, 5%);
    border-color: darken($border-color, 5%);
  }
}

// Usage
.btn-primary {
  @include button-variant($primary-500, white, $primary-500);
}
```
