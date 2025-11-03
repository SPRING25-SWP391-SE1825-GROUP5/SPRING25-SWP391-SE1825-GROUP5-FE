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
    return { isValid: false, error: 'Vui lòng nhập email' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Email không hợp lệ' }
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
    return { isValid: false, error: 'Vui lòng nhập mật khẩu' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasUpperCase) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 chữ in hoa' }
  }

  if (!hasLowerCase) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 chữ thường' }
  }

  if (!hasNumbers) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 chữ số' }
  }

  if (!hasSpecialChar) {
    return { isValid: false, error: 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt' }
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
    return { isValid: false, error: 'Vui lòng xác nhận mật khẩu' }
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Mật khẩu xác nhận không khớp' }
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
export const validateName = (name: string, fieldName: string = 'Tên'): FieldValidation => {
  if (!name) {
    return { isValid: false, error: `${fieldName} là bắt buộc` }
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: `${fieldName} phải có ít nhất 2 ký tự` }
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: `${fieldName} tối đa 50 ký tự` }
  }

  const nameRegex = /^[a-zA-Z\s'-]+$/
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: `${fieldName} chỉ được chứa chữ cái, khoảng trắng, dấu gạch ngang và dấu nháy đơn` }
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
    return { isValid: false, error: 'Vui lòng nhập số điện thoại hợp lệ' }
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
    errors.currentPassword = 'Mật khẩu hiện tại là bắt buộc'
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
    errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại'
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

export const validateResetConfirmForm = (data: {
  otpCode: string
  newPassword: string
  confirmPassword: string
}): ValidationResult => {
  const errors: Record<string, string> = {}
  if (!/^\d{6}$/.test(data.otpCode)) {
    errors.otpCode = 'OTP phải gồm 6 chữ số'
  }
  const passV = validatePassword(data.newPassword)
  if (!passV.isValid) errors.newPassword = passV.error!
  if (data.newPassword !== data.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
  return { isValid: Object.keys(errors).length === 0, errors }
}


// Additional validators aligned with backend rules
export const validateGmail = (email: string): FieldValidation => {
  const base = validateEmail(email)
  if (!base.isValid) return base
  if (!email.toLowerCase().endsWith('@gmail.com')) {
    return { isValid: false, error: 'Email phải có đuôi @gmail.com' }
  }
  return { isValid: true }
}

// Full name: 2-100 chars
export const validateFullName = (fullName: string): FieldValidation => {
  if (!fullName || !fullName.trim()) return { isValid: false, error: 'Họ tên là bắt buộc' }
  const len = fullName.trim().length
  if (len < 2) return { isValid: false, error: 'Họ tên phải từ 2 ký tự' }
  if (len > 100) return { isValid: false, error: 'Họ tên tối đa 100 ký tự' }
  return { isValid: true }
}

// VN phone: starts with 0 and 10 digits
export const validateVNPhone10 = (phone: string): FieldValidation => {
  if (!phone) return { isValid: false, error: 'Số điện thoại là bắt buộc' }
  const cleaned = phone.replace(/\s/g, '')
  if (!/^0\d{9}$/.test(cleaned)) {
    return { isValid: false, error: 'SĐT phải bắt đầu bằng 0 và có đúng 10 số' }
  }
  return { isValid: true }
}

// DOB: at least 16 years old, maximum 120 years old
export const validateDOB16 = (dateStr: string): FieldValidation => {
  if (!dateStr) return { isValid: false, error: 'Ngày sinh là bắt buộc' }
  const dob = new Date(dateStr)
  if (isNaN(dob.getTime())) return { isValid: false, error: 'Ngày sinh không hợp lệ' }
  const today = new Date()
  const sixteen = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate())
  const oneHundredTwenty = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate())
  
  if (dob > sixteen) return { isValid: false, error: 'Bạn phải đủ 16 tuổi' }
  if (dob < oneHundredTwenty) return { isValid: false, error: 'Ngày sinh không hợp lệ' }
  
  return { isValid: true }
}

export const validateGender = (gender: string): FieldValidation => {
  if (!gender) return { isValid: false, error: 'Giới tính là bắt buộc' }
  if (gender !== 'MALE' && gender !== 'FEMALE') return { isValid: false, error: 'Giới tính phải là MALE hoặc FEMALE' }
  return { isValid: true }
}

export const validateAddress255 = (address?: string): FieldValidation => {
  if (!address) return { isValid: true }
  if (address.length > 255) return { isValid: false, error: 'Địa chỉ tối đa 255 ký tự' }
  return { isValid: true }
}

// Duplicate validation functions
export const validateEmailNotExists = async (email: string, checkEmailExists: (email: string) => Promise<any>): Promise<FieldValidation> => {
  if (!email || !email.trim()) {
    return { isValid: true } // Let required validation handle empty values
  }

  // First check format - allow all email domains
  const formatValidation = validateEmail(email)
  if (!formatValidation.isValid) {
    return formatValidation
  }

  try {
    const result = await checkEmailExists(email)
    if (result.success && result.exists) {
      return { isValid: false, error: 'Email này đã được sử dụng' }
    }
    return { isValid: true }
  } catch (error) {
    console.error('Email validation error:', error)
    return { isValid: true } // Don't block on API errors
  }
}

export const validatePhoneNotExists = async (phone: string, checkPhoneExists: (phone: string) => Promise<any>): Promise<FieldValidation> => {
  if (!phone || !phone.trim()) {
    return { isValid: true } // Let required validation handle empty values
  }

  // First check format
  const formatValidation = validateVNPhone10(phone)
  if (!formatValidation.isValid) {
    return formatValidation
  }

  try {
    const result = await checkPhoneExists(phone)
    if (result.success && result.exists) {
      return { isValid: false, error: 'Số điện thoại này đã được sử dụng' }
    }
    return { isValid: true }
  } catch (error) {
    console.error('Phone validation error:', error)
    return { isValid: true } // Don't block on API errors
  }
}

// Server error mapping utility
export const mapServerErrorsToFields = (serverErrors: any): Record<string, string> => {
  const fieldErrors: Record<string, string> = {}
  
  if (!serverErrors) return fieldErrors
  
  console.log('Mapping server errors:', serverErrors)
  
  // Common server error patterns
  const errorMappings: Record<string, string> = {
    'email': 'Email này đã được sử dụng',
    'phoneNumber': 'Số điện thoại này đã được sử dụng',
    'phone': 'Số điện thoại này đã được sử dụng',
    'fullName': 'Họ tên không hợp lệ',
    'password': 'Mật khẩu không hợp lệ',
    'confirmPassword': 'Xác nhận mật khẩu không khớp',
    'dateOfBirth': 'Ngày sinh không hợp lệ',
    'gender': 'Giới tính không hợp lệ',
    'address': 'Địa chỉ không hợp lệ'
  }
  
  // Handle different server error formats
  if (Array.isArray(serverErrors)) {
    // Handle array format: ["Email already exists", "Phone already exists"]
    serverErrors.forEach((error: string) => {
      const lowerError = error.toLowerCase()
      if (lowerError.includes('email') || lowerError.includes('mail')) {
        fieldErrors.email = 'Email này đã được sử dụng'
      } else if (lowerError.includes('phone') || lowerError.includes('số điện thoại') || lowerError.includes('phone number')) {
        fieldErrors.phoneNumber = 'Số điện thoại này đã được sử dụng'
      } else if (lowerError.includes('password')) {
        fieldErrors.password = 'Mật khẩu không hợp lệ'
      }
    })
  } else if (typeof serverErrors === 'object') {
    // Handle object format: { email: "Email already exists", phoneNumber: "Phone already exists" }
    Object.keys(serverErrors).forEach(key => {
      const errorMessage = serverErrors[key]
      if (errorMessage) {
        const lowerKey = key.toLowerCase()
        const lowerMessage = errorMessage.toLowerCase()
        
        // Check for duplicate errors
        if (lowerMessage.includes('already exists') || 
            lowerMessage.includes('already registered') ||
            lowerMessage.includes('đã tồn tại') ||
            lowerMessage.includes('đã được sử dụng') ||
            lowerMessage.includes('already in use')) {
          
          if (lowerKey.includes('email') || lowerKey.includes('mail')) {
            fieldErrors.email = 'Email này đã được sử dụng'
          } else if (lowerKey.includes('phone') || lowerKey.includes('phoneNumber') || lowerKey.includes('phone_number')) {
            fieldErrors.phoneNumber = 'Số điện thoại này đã được sử dụng'
          } else {
            fieldErrors[key] = errorMappings[key] || errorMessage
          }
        } else {
          // Use predefined mapping or fallback to server message
          fieldErrors[key] = errorMappings[key] || errorMessage
        }
      }
    })
  } else if (typeof serverErrors === 'string') {
    // Handle string format: "Email already exists"
    const lowerError = serverErrors.toLowerCase()
    if (lowerError.includes('email') || lowerError.includes('mail')) {
      fieldErrors.email = 'Email này đã được sử dụng'
    } else if (lowerError.includes('phone') || lowerError.includes('số điện thoại') || lowerError.includes('phone number')) {
      fieldErrors.phoneNumber = 'Số điện thoại này đã được sử dụng'
    }
  }
  
  console.log('Mapped field errors:', fieldErrors)
  return fieldErrors
}

// Login V2: email or phone allowed
export const validateLoginFormV2 = (data: { emailOrPhone: string; password: string }): ValidationResult => {
  const errors: Record<string, string> = {}
  if (!data.emailOrPhone?.trim()) errors.emailOrPhone = 'Vui lòng nhập email hoặc số điện thoại'
  const pass = validatePassword(data.password)
  if (!pass.isValid) errors.password = pass.error!
  return { isValid: Object.keys(errors).length === 0, errors }
}

// Register strict per backend
export const validateRegisterFormStrict = (data: {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  address?: string
  avatarUrl?: string
}): ValidationResult => {
  const errors: Record<string, string> = {}
  const nameV = validateFullName(data.fullName); if (!nameV.isValid) errors.fullName = nameV.error!
  const emailV = validateEmail(data.email); if (!emailV.isValid) errors.email = emailV.error!
  const passV = validatePassword(data.password); if (!passV.isValid) errors.password = passV.error!
  const cpassV = validateConfirmPassword(data.password, data.confirmPassword); if (!cpassV.isValid) errors.confirmPassword = cpassV.error!
  const phoneV = validateVNPhone10(data.phoneNumber); if (!phoneV.isValid) errors.phoneNumber = phoneV.error!
  const dobV = validateDOB16(data.dateOfBirth); if (!dobV.isValid) errors.dateOfBirth = dobV.error!
  const genderV = validateGender(data.gender); if (!genderV.isValid) errors.gender = genderV.error!
  const addrV = validateAddress255(data.address); if (!addrV.isValid) errors.address = addrV.error!
  const avatarUrlV = validateAddress255(data.avatarUrl); if (!avatarUrlV.isValid) errors.avatarUrl = avatarUrlV.error!
  return { isValid: Object.keys(errors).length === 0, errors }
}

// Async version with duplicate validation
export const validateRegisterFormStrictAsync = async (data: {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE'
  address?: string
  avatarUrl?: string
}, checkEmailExists: (email: string) => Promise<any>, checkPhoneExists: (phone: string) => Promise<any>): Promise<ValidationResult> => {
  const errors: Record<string, string> = {}
  
  // Basic validations
  const nameV = validateFullName(data.fullName); if (!nameV.isValid) errors.fullName = nameV.error!
  const passV = validatePassword(data.password); if (!passV.isValid) errors.password = passV.error!
  const cpassV = validateConfirmPassword(data.password, data.confirmPassword); if (!cpassV.isValid) errors.confirmPassword = cpassV.error!
  const dobV = validateDOB16(data.dateOfBirth); if (!dobV.isValid) errors.dateOfBirth = dobV.error!
  const genderV = validateGender(data.gender); if (!genderV.isValid) errors.gender = genderV.error!
  const addrV = validateAddress255(data.address); if (!addrV.isValid) errors.address = addrV.error!
  const avatarUrlV = validateAddress255(data.avatarUrl); if (!avatarUrlV.isValid) errors.avatarUrl = avatarUrlV.error!
  
  // Async duplicate validations
  const emailV = await validateEmailNotExists(data.email, checkEmailExists)
  if (!emailV.isValid) errors.email = emailV.error!
  
  const phoneV = await validatePhoneNotExists(data.phoneNumber, checkPhoneExists)
  if (!phoneV.isValid) errors.phoneNumber = phoneV.error!
  
  return { isValid: Object.keys(errors).length === 0, errors }
}
