import './BaseCard.scss'

export type BaseCardProps = {
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'sm' | 'md' | 'lg' | 'none'
  header?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function BaseCard({
  variant = 'default',
  padding = 'md',
  header,
  footer,
  children,
  className = '',
}: BaseCardProps) {
  const classes = ['card', `card--${variant}`, `card--padding-${padding}`, className].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      {header && <div className="card__header">{header}</div>}
      <div className="card__body">{children}</div>
      {footer && <div className="card__footer">{footer}</div>}
    </div>
  )
}

export default BaseCard

