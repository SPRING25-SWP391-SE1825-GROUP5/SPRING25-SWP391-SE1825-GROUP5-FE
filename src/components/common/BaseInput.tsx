import './BaseInput.scss'

export type BaseInputProps = {
  id?: string
  type?: string
  label?: string
  placeholder?: string
  value?: string | number
  error?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  onChange?: (value: string) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
}

export function BaseInput({
  id,
  type = 'text',
  label,
  placeholder,
  value = '',
  error,
  hint,
  disabled = false,
  required = false,
  size = 'md',
  onChange,
  onBlur,
  onFocus,
}: BaseInputProps) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`
  const classes = [
    'input',
    `input--${size}`,
    error ? 'input--error' : '',
    disabled ? 'input--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="input-group">
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label} {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          className={classes}
          onInput={(e) => onChange?.((e.target as HTMLInputElement).value)}
          onChange={(e) => onChange?.(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      </div>
      {error ? (
        <div className="input-error">{error}</div>
      ) : hint ? (
        <div className="input-hint">{hint}</div>
      ) : null}
    </div>
  )
}

export default BaseInput

