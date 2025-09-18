/**
 * Validation Utilities
 * Centralized validation functions for forms and inputs
 * 
 * @description This file contains reusable validation functions
 * that can be used across different forms in the application
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface FieldValidation {
  isValid: boolean
  error?: string
}

/**
 * Email validation
 * 
 * @param email - Email string to validate
 * @returns Validation result
 */
export const validateEmail = (email: string): FieldValidation => {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  return { isValid: true }
}

/**
 * Password validation
 * 
 * @param password - Password string to validate
 * @returns Validation result
 */
export const validatePassword = (password: string): FieldValidation => {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }
  
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUpperCase) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' }
  }
  
  if (!hasLowerCase) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' }
  }
  
  if (!hasNumbers) {
    return { isValid: false, error: 'Password must contain at least one number' }
  }
  
  if (!hasSpecialChar) {
    return { isValid: false, error: 'Password must contain at least one special character' }
  }
  
  return { isValid: true }
}

/**
 * Confirm password validation
 * 
 * @param password - Original password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export const validateConfirmPassword = (password: string, confirmPassword: string): FieldValidation => {
  if (!confirmPassword) {
    return { isValid: false, error: 'Please confirm your password' }
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }
  
  return { isValid: true }
}

/**
 * Name validation
 * 
 * @param name - Name string to validate
 * @param fieldName - Field name for error message
 * @returns Validation result
 */
export const validateName = (name: string, fieldName: string = 'Name'): FieldValidation => {
  if (!name) {
    return { isValid: false, error: `${fieldName} is required` }
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long` }
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} must be less than 50 characters` }
  }
  
  const nameRegex = /^[a-zA-Z\s'-]+$/
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` }
  }
  
  return { isValid: true }
}

/**
 * Phone number validation
 * 
 * @param phone - Phone number string to validate
 * @returns Validation result
 */
export const validatePhone = (phone: string): FieldValidation => {
  if (!phone) {
    return { isValid: true } // Phone is optional
  }
  
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return { isValid: false, error: 'Please enter a valid phone number' }
  }
  
  return { isValid: true }
}

/**
 * Login form validation
 * 
 * @param data - Login form data
 * @returns Validation result
 */
export const validateLoginForm = (data: { email: string; password: string }): ValidationResult => {
  const errors: Record<string, string> = {}
  
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }
  
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Registration form validation
 * 
 * @param data - Registration form data
 * @returns Validation result
 */
export const validateRegisterForm = (data: {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phone?: string
}): ValidationResult => {
  const errors: Record<string, string> = {}
  
  // Email validation
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }
  
  // Password validation
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.error!
  }
  
  // Confirm password validation
  const confirmPasswordValidation = validateConfirmPassword(data.password, data.confirmPassword)
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.error!
  }
  
  // First name validation
  const firstNameValidation = validateName(data.firstName, 'First name')
  if (!firstNameValidation.isValid) {
    errors.firstName = firstNameValidation.error!
  }
  
  // Last name validation
  const lastNameValidation = validateName(data.lastName, 'Last name')
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.error!
  }
  
  // Phone validation (optional)
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone)
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.error!
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Change password form validation
 * 
 * @param data - Change password form data
 * @returns Validation result
 */
export const validateChangePasswordForm = (data: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): ValidationResult => {
  const errors: Record<string, string> = {}
  
  // Current password validation
  if (!data.currentPassword) {
    errors.currentPassword = 'Current password is required'
  }
  
  // New password validation
  const newPasswordValidation = validatePassword(data.newPassword)
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.error!
  }
  
  // Confirm password validation
  const confirmPasswordValidation = validateConfirmPassword(data.newPassword, data.confirmPassword)
  if (!confirmPasswordValidation.isValid) {
    errors.confirmPassword = confirmPasswordValidation.error!
  }
  
  // Check if new password is different from current
  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    errors.newPassword = 'New password must be different from current password'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Reset password form validation
 * 
 * @param data - Reset password form data
 * @returns Validation result
 */
export const validateResetPasswordForm = (data: {
  email: string
}): ValidationResult => {
  const errors: Record<string, string> = {}
  
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    errors.email = emailValidation.error!
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
