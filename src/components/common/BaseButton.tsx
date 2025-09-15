import './BaseButton.scss'

export type BaseButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  type?: 'button' | 'submit' | 'reset'
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  children?: React.ReactNode
  className?: string
}

export function BaseButton({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  type = 'button',
  onClick,
  children,
  className = '',
}: BaseButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    disabled ? 'btn--disabled' : '',
    loading ? 'btn--loading' : '',
    fullWidth ? 'btn--full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} disabled={disabled || loading} onClick={onClick} type={type}>
      {loading && <span className="btn__spinner">⟳</span>}
      {children}
    </button>
  )
}

export default BaseButton

