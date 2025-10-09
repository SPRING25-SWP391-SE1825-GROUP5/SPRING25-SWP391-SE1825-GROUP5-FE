# Profile Component Documentation

## Overview

The `Profile.tsx` component is a comprehensive user profile management interface for the Savart electric vehicle service platform. It provides a multi-tabbed interface for users to manage their personal information, preferences, vehicles, notifications, shopping cart, and service history.

## File Structure

- **Component**: `src/views/Profile.tsx`
- **Styles**: `src/views/profile.scss`
- **Dependencies**: React, Redux Toolkit, Heroicons, custom components

## TypeScript Interfaces

### UserProfile Interface
```typescript
interface UserProfile {
  fullName: string
  email: string
  phoneNumber: string
  address: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | ''
  avatarUrl: string
}
```

**Purpose**: Defines the structure for user profile data including personal information and avatar.

### ChangePasswordData Interface
```typescript
interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
```

**Purpose**: Manages password change form data with validation requirements.

### Vehicle Interface
```typescript
interface Vehicle {
  id: string
  brand: string
  model: string
  year: string
  licensePlate: string
  color: string
  image?: string
  status: 'active' | 'maintenance'
  nextMaintenance: string
}
```

**Purpose**: Represents vehicle information for the user's registered vehicles.

## Component State Management

### Primary State Variables

#### Tab Management
```typescript
const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'maintenance-history' | 'purchase-history' | 'saved-promotions' | 'notifications' | 'cart' | 'my-vehicle'>('profile')
```
- Controls which tab is currently active in the profile interface
- Defaults to 'profile' tab on component mount

#### Profile Data
```typescript
const [profileData, setProfileData] = useState<UserProfile>({
  fullName: '',
  email: '',
  phoneNumber: '',
  address: '',
  dateOfBirth: '',
  gender: '',
  avatarUrl: '👤'
})
```
- Stores current user profile information
- Initialized with empty values and default avatar emoji

#### Edit Mode
```typescript
const [isEditing, setIsEditing] = useState(false)
const [isSaving, setIsSaving] = useState(false)
```
- `isEditing`: Controls whether profile form is in edit mode
- `isSaving`: Shows loading state during save operations

#### Modal States
```typescript
const [showPasswordModal, setShowPasswordModal] = useState(false)
const [showAddVehicleModal, setShowAddVehicleModal] = useState(false)
```
- Controls visibility of password change and add vehicle modals

#### Vehicle Management
```typescript
const [vehicles, setVehicles] = useState<Vehicle[]>([...])
const [newVehicle, setNewVehicle] = useState<Omit<Vehicle, 'id'>>({...})
```
- `vehicles`: Array of user's registered vehicles
- `newVehicle`: Form data for adding new vehicles

#### Password Management
```typescript
const [passwordData, setPasswordData] = useState<ChangePasswordData>({...})
const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('')
const [passwordRequirements, setPasswordRequirements] = useState({...})
```
- Manages password change form data and validation states

## Redux Integration

### Auth State
```typescript
const dispatch = useAppDispatch()
const auth = useAppSelector((s) => s.auth)
```

**Actions Used**:
- `getCurrentUser()`: Fetches current user data from API
- `AuthService.updateProfile()`: Updates user profile information
- `AuthService.changePassword()`: Changes user password
- `AuthService.uploadAvatar()`: Uploads user avatar image

## Event Handlers

### Profile Management

#### handleEdit()
```typescript
const handleEdit = () => {
  setOriginalData(profileData)
  setIsEditing(true)
}
```
- Saves current profile data as backup
- Enables edit mode for profile form

#### handleCancel()
```typescript
const handleCancel = () => {
  setProfileData(originalData)
  setIsEditing(false)
}
```
- Restores original profile data
- Exits edit mode

#### handleSave()
```typescript
const handleSave = async () => {
  // Validation logic
  // API call to update profile
  // Error handling
}
```
- Validates profile data
- Calls API to update profile
- Handles success/error states

### File Upload Handlers

#### handleFileChange()
```typescript
const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  // File validation
  // Upload to server
  // Update avatar URL
}
```
- Handles avatar image upload
- Validates file type
- Updates profile with new avatar URL

#### handleVehicleImageChange()
```typescript
const handleVehicleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  // File validation
  // Convert to base64 for preview
}
```
- Handles vehicle image upload
- Converts to base64 for local preview

### Vehicle Management

#### handleAddVehicle()
```typescript
const handleAddVehicle = () => {
  // Validation
  // Add to vehicles array
  // Reset form
}
```
- Validates vehicle data
- Adds new vehicle to list
- Resets form and closes modal

#### handleRemoveVehicle()
```typescript
const handleRemoveVehicle = (vehicleId: string) => {
  setVehicles(prev => prev.filter(vehicle => vehicle.id !== vehicleId))
}
```
- Removes vehicle from list by ID

### Password Management

#### handleChangePassword()
```typescript
const handleChangePassword = async () => {
  // Validation
  // API call
  // Reset form
}
```
- Validates password requirements
- Calls API to change password
- Handles success/error states

#### checkPasswordStrength()
```typescript
const checkPasswordStrength = (password: string) => {
  // Check requirements
  // Return strength level
}
```
- Analyzes password strength
- Updates requirements checklist
- Returns strength level

## UI Sections

### 1. Profile Sidebar
- **User Avatar**: Clickable avatar with edit button
- **User Info**: Name, email, and status display
- **Navigation**: Tab-based navigation with icons

### 2. Tab Content Areas

#### Personal Information Tab
- **Form Fields**: Full name, email, phone, gender, date of birth, address
- **Edit Controls**: Edit/Save/Cancel buttons
- **Validation**: Required field validation and format checking

#### Preferences Tab
- **Security Settings**: Password change option
- **Notification Settings**: Notification preferences
- **Privacy Settings**: Data sharing controls

#### My Vehicle Tab
- **Vehicle Grid**: Display of registered vehicles
- **Add Vehicle**: Modal form for adding new vehicles
- **Vehicle Cards**: Individual vehicle information with actions

#### Notifications Tab
- **Notification List**: Unread and read notifications
- **Actions**: Mark as read, schedule services
- **Status Indicators**: Visual indicators for notification types

#### Shopping Cart Tab
- **Cart Items**: List of items in cart
- **Quantity Controls**: Increase/decrease item quantities
- **Summary**: Subtotal, shipping, and total calculations

#### Maintenance History Tab
- **Service Records**: Historical maintenance records
- **Details**: Service dates, costs, and status
- **Actions**: View detailed service information

#### Purchase History Tab
- **Order History**: Past purchase records
- **Order Details**: Items, dates, and delivery status
- **Actions**: View order details

#### Saved Promotions Tab
- **Active Promotions**: Currently available promotions
- **Expired Promotions**: Past promotions
- **Usage Actions**: Apply promotions to services

## Modal Components

### Password Change Modal
- **Form Fields**: Current password, new password, confirm password
- **Password Strength**: Visual strength indicator
- **Requirements**: Checklist of password requirements
- **Validation**: Real-time validation feedback

### Add Vehicle Modal
- **Form Fields**: Brand, model, year, color, license plate, maintenance info
- **Image Upload**: Vehicle image upload with preview
- **Validation**: Required field validation

## Styling and Theming

### Color Scheme
- **Primary**: Green theme (#22c55e, #16a34a)
- **Background**: Light gradients (#f8fafc, #f1f5f9)
- **Cards**: White backgrounds with subtle shadows
- **Accents**: Green gradients for active states

### Responsive Design
- **Desktop**: Two-column layout (sidebar + content)
- **Mobile**: Single column with stacked layout
- **Breakpoints**: 768px and 480px media queries

### Animations
- **Hover Effects**: Scale and shadow transitions
- **Loading States**: Spinner animations
- **Transitions**: Smooth 0.3s ease transitions

## API Integration

### AuthService Methods
- `updateProfile(payload)`: Updates user profile
- `changePassword(data)`: Changes user password
- `uploadAvatar(file)`: Uploads avatar image

### Error Handling
- **Validation Errors**: Client-side validation with user feedback
- **API Errors**: Server error messages displayed to user
- **Loading States**: Visual feedback during API calls

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through form elements
- **Focus Management**: Visible focus indicators
- **Modal Trapping**: Focus contained within modals

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for form elements
- **Status Announcements**: Loading and error state announcements
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Performance Considerations

### State Optimization
- **Selective Updates**: Only update changed form fields
- **Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Load tab content on demand

### Image Handling
- **File Validation**: Check file types and sizes
- **Base64 Conversion**: Local preview for vehicle images
- **URL Caching**: Cache avatar URLs with timestamps

## Security Features

### Password Security
- **Strength Validation**: Multiple password requirements
- **Confirmation**: Password confirmation matching
- **Secure Transmission**: HTTPS for all API calls

### File Upload Security
- **Type Validation**: Only allow image files
- **Size Limits**: Prevent large file uploads
- **Server Validation**: Backend validation of uploaded files

## Testing Considerations

### Unit Tests
- **State Management**: Test state updates and transitions
- **Form Validation**: Test validation logic
- **Event Handlers**: Test user interactions

### Integration Tests
- **API Integration**: Test API calls and responses
- **Modal Behavior**: Test modal open/close functionality
- **Tab Navigation**: Test tab switching

### E2E Tests
- **User Flows**: Complete user profile management flows
- **File Uploads**: Test avatar and vehicle image uploads
- **Form Submissions**: Test form validation and submission

## Future Enhancements

### Planned Features
- **Two-Factor Authentication**: Additional security options
- **Profile Export**: Export profile data
- **Bulk Vehicle Import**: Import multiple vehicles
- **Advanced Notifications**: Push notification preferences

### Technical Improvements
- **Offline Support**: Cache profile data for offline access
- **Real-time Updates**: WebSocket integration for live updates
- **Progressive Web App**: PWA features for mobile experience

## Dependencies

### External Libraries
- **React**: Core framework
- **Redux Toolkit**: State management
- **Heroicons**: Icon library
- **TypeScript**: Type safety

### Internal Dependencies
- **BaseButton**: Custom button component
- **BaseCard**: Custom card component
- **BaseInput**: Custom input component
- **AuthService**: Authentication service
- **Redux Store**: Global state management

## Code Quality

### Best Practices
- **TypeScript**: Full type safety
- **Error Boundaries**: Graceful error handling
- **Code Splitting**: Lazy loading of components
- **Performance**: Optimized re-renders

### Code Organization
- **Separation of Concerns**: Clear separation of UI and logic
- **Reusable Components**: Modular component design
- **Consistent Naming**: Clear and descriptive variable names
- **Documentation**: Comprehensive inline comments
