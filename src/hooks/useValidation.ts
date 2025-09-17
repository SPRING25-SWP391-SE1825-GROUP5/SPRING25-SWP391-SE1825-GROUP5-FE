import { useState, useCallback } from 'react'
import type { ValidationResult, FieldValidation } from '@/utils/validation'

/**
 * Custom hook for form validation
 * 
 * @description This hook provides a convenient way to handle form validation
 * with real-time feedback and error management
 */
export const useValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  /**
   * Clear specific field error
   * 
   * @param field - Field name to clear error for
   */
  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  /**
   * Set field as touched
   * 
   * @param field - Field name to mark as touched
   */
  const setFieldTouched = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  /**
   * Set field error
   * 
   * @param field - Field name
   * @param error - Error message
   */
  const setFieldError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  /**
   * Set multiple field errors
   * 
   * @param errors - Object of field errors
   */
  const setFieldErrors = useCallback((errors: Record<string, string>) => {
    setErrors(errors)
  }, [])

  /**
   * Check if field has error
   * 
   * @param field - Field name
   * @returns True if field has error
   */
  const hasError = useCallback((field: string): boolean => {
    return !!errors[field]
  }, [errors])

  /**
   * Get field error message
   * 
   * @param field - Field name
   * @returns Error message or undefined
   */
  const getFieldError = useCallback((field: string): string | undefined => {
    return errors[field]
  }, [errors])

  /**
   * Check if field has been touched
   * 
   * @param field - Field name
   * @returns True if field has been touched
   */
  const isFieldTouched = useCallback((field: string): boolean => {
    return !!touched[field]
  }, [touched])

  /**
   * Check if field should show error (touched and has error)
   * 
   * @param field - Field name
   * @returns True if field should show error
   */
  const shouldShowError = useCallback((field: string): boolean => {
    return isFieldTouched(field) && hasError(field)
  }, [isFieldTouched, hasError])

  /**
   * Validate single field and set error if invalid
   * 
   * @param field - Field name
   * @param value - Field value
   * @param validator - Validation function
   * @returns True if field is valid
   */
  const validateField = useCallback((
    field: string,
    value: any,
    validator: (value: any) => FieldValidation
  ): boolean => {
    const result = validator(value)
    
    if (result.isValid) {
      clearFieldError(field)
      return true
    } else {
      setFieldError(field, result.error!)
      return false
    }
  }, [clearFieldError, setFieldError])

  /**
   * Validate entire form
   * 
   * @param data - Form data
   * @param validator - Form validation function
   * @returns Validation result
   */
  const validateForm = useCallback((
    data: any,
    validator: (data: any) => ValidationResult
  ): ValidationResult => {
    const result = validator(data)
    setFieldErrors(result.errors)
    return result
  }, [setFieldErrors])

  /**
   * Reset validation state
   */
  const reset = useCallback(() => {
    setErrors({})
    setTouched({})
  }, [])

  return {
    errors,
    touched,
    clearErrors,
    clearFieldError,
    setFieldTouched,
    setFieldError,
    setFieldErrors,
    hasError,
    getFieldError,
    isFieldTouched,
    shouldShowError,
    validateField,
    validateForm,
    reset
  }
}
