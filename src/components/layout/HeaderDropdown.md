# HeaderDropdown Component

A flexible, accessible header component with customizable dropdown menus.

## Features

- 🎨 **Customizable**: Props for styling, colors, transitions
- 📱 **Responsive**: Automatic mobile/desktop layouts
- ♿ **Accessible**: ARIA attributes, keyboard navigation
- 🎯 **Flexible Dropdowns**: Simple, mega, or custom content
- ⚡ **Smooth Animations**: Configurable transition effects
- 🧩 **Icon Support**: Lucide React icons integration

## Basic Usage

```tsx
import HeaderDropdown, { MenuItem } from './HeaderDropdown'
import { ShoppingCart, User } from 'lucide-react'

const menuItems: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/'
  },
  {
    id: 'services',
    label: 'Services',
    dropdown: {
      type: 'simple',
      width: 'sm',
      sections: [{
        id: 'main',
        title: 'Services',
        items: [
          { id: 'repair', label: 'Repair', href: '/repair' },
          { id: 'maintenance', label: 'Maintenance', href: '/maintenance' }
        ]
      }]
    }
  }
]

<HeaderDropdown
  menuItems={menuItems}
  logo={{
    src: '/logo.png',
    alt: 'Company Logo',
    href: '/'
  }}
  rightItems={
    <>
      <ShoppingCart size={20} />
      <User size={20} />
    </>
  }
/>
```

## Dropdown Types

### Simple Dropdown
```tsx
{
  dropdown: {
    type: 'simple',
    width: 'sm', // sm, md, lg, xl, full, auto
    align: 'left', // left, center, right
    sections: [{
      id: 'section1',
      title: 'Section Title',
      items: [
        {
          id: 'item1',
          label: 'Item 1',
          href: '/item1',
          icon: <Icon size={16} />,
          description: 'Optional description'
        }
      ]
    }]
  }
}
```

### Mega Dropdown
```tsx
{
  dropdown: {
    type: 'mega',
    width: 'lg',
    align: 'center',
    sections: [
      {
        id: 'section1',
        title: 'Category 1',
        items: [...]
      },
      {
        id: 'section2',
        title: 'Category 2',
        items: [...]
      }
    ]
  }
}
```

### Custom Dropdown
```tsx
{
  dropdown: {
    type: 'custom',
    width: 'md',
    customContent: (
      <div style={{ padding: '1rem' }}>
        <h3>Custom Content</h3>
        <p>Any React content here</p>
      </div>
    )
  }
}
```

## Props

### HeaderDropdown Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `menuItems` | `MenuItem[]` | Required | Array of menu items |
| `logo` | `LogoConfig` | Optional | Logo configuration |
| `rightItems` | `React.ReactNode` | Optional | Right side content |
| `className` | `string` | `''` | Additional CSS class |
| `transitionDuration` | `number` | `300` | Animation duration in ms |
| `mobileBreakpoint` | `number` | `1024` | Mobile breakpoint in px |
| `headerHeight` | `string` | `'80px'` | Header height |
| `dropdownShadow` | `string` | CSS shadow | Dropdown shadow |
| `hoverColor` | `string` | `'#e3f2fd'` | Hover background color |
| `activeColor` | `string` | `'#1976d2'` | Active text color |

### MenuItem Interface

```tsx
interface MenuItem {
  id: string
  label: string
  href?: string // NavLink destination
  dropdown?: DropdownContent
  icon?: React.ReactNode
  badge?: string | number
}
```

### DropdownContent Interface

```tsx
interface DropdownContent {
  type: 'simple' | 'mega' | 'custom'
  sections?: DropdownSection[]
  customContent?: React.ReactNode
  width?: 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  align?: 'left' | 'center' | 'right'
}
```

## Styling

The component uses CSS custom properties for easy theming:

```scss
.header-dropdown {
  --header-height: 80px;
  --transition-duration: 300ms;
  --dropdown-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  --hover-color: #e3f2fd;
  --active-color: #1976d2;
}
```

## Accessibility Features

- ARIA attributes for screen readers
- Keyboard navigation support
- Focus management
- High contrast mode support
- Reduced motion support
- Semantic HTML structure

## Mobile Behavior

- Automatic mobile menu toggle
- Touch-friendly interactions
- Responsive breakpoints
- Collapsible navigation

## Examples

### E-commerce Header
```tsx
const ecommerceItems: MenuItem[] = [
  {
    id: 'shop',
    label: 'Shop',
    dropdown: {
      type: 'mega',
      width: 'xl',
      sections: [
        {
          id: 'categories',
          title: 'Categories',
          items: [
            { id: 'electronics', label: 'Electronics', href: '/electronics' },
            { id: 'clothing', label: 'Clothing', href: '/clothing' }
          ]
        },
        {
          id: 'brands',
          title: 'Brands',
          items: [
            { id: 'apple', label: 'Apple', href: '/apple' },
            { id: 'samsung', label: 'Samsung', href: '/samsung' }
          ]
        }
      ]
    }
  }
]
```

### Service Website Header
```tsx
const serviceItems: MenuItem[] = [
  {
    id: 'services',
    label: 'Services',
    dropdown: {
      type: 'simple',
      width: 'md',
      sections: [{
        id: 'services',
        title: 'Our Services',
        items: [
          { 
            id: 'consulting', 
            label: 'Consulting', 
            href: '/consulting',
            description: 'Expert business consulting'
          },
          { 
            id: 'development', 
            label: 'Development', 
            href: '/development',
            description: 'Custom software development'
          }
        ]
      }]
    }
  }
]
```

