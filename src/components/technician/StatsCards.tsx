import React from 'react'
import { Clock, CheckCircle, Wrench, CheckCircle2, CreditCard } from 'lucide-react'

interface StatsCardsProps {
  stats: Array<{
    label: string
    value: number
    icon: React.ComponentType<{ size?: number }>
    color: string
  }>
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  return (
    <div className="work-queue__stats">
      {stats.map((stat, index) => (
        <div key={index} className="work-queue__stats__card">
          <div 
            className="work-queue__stats__card__icon"
            style={{ backgroundColor: stat.color + '15', color: stat.color }}
          >
            <stat.icon size={16} />
          </div>
          <div className="work-queue__stats__card__content">
            <div className="work-queue__stats__card__content__value">{stat.value}</div>
            <div className="work-queue__stats__card__content__label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
