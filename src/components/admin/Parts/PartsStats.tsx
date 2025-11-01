import React, { useState, useEffect } from 'react'
import { Part } from '../../../types/parts'
import './PartsStats.scss'

interface PartsStatsProps {
  parts: Part[]
}

export default function PartsStats({ parts }: PartsStatsProps) {
  const [animatedValues, setAnimatedValues] = useState<number[]>([0, 0, 0, 0, 0])
  
  const totalParts = parts.length
  const totalValue = parts.reduce((sum, part) => sum + (part.price * part.stock), 0)
  const lowStockParts = parts.filter(part => part.stock < 15).length
  const outOfStockParts = parts.filter(part => part.stock === 0).length
  const categories = [...new Set(parts.map(part => part.category))].length

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const stats = [
    {
      title: 'Tổng sản phẩm',
      value: totalParts,
      displayValue: formatNumber(totalParts),
      icon: '📦',
      color: '#3b82f6',
      bgColor: '#eff6ff',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Tổng giá trị kho',
      value: totalValue,
      displayValue: formatPrice(totalValue),
      icon: '💰',
      color: '#10b981',
      bgColor: '#ecfdf5',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      change: '+8.2%',
      changeType: 'positive' as const
    },
    {
      title: 'Sắp hết hàng',
      value: lowStockParts,
      displayValue: formatNumber(lowStockParts),
      icon: '⚠️',
      color: '#f59e0b',
      bgColor: '#fffbeb',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      change: '-5%',
      changeType: 'negative' as const
    },
    {
      title: 'Hết hàng',
      value: outOfStockParts,
      displayValue: formatNumber(outOfStockParts),
      icon: '❌',
      color: '#ef4444',
      bgColor: '#fef2f2',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      change: '-15%',
      changeType: 'negative' as const
    },
    {
      title: 'Danh mục',
      value: categories,
      displayValue: formatNumber(categories),
      icon: '🏷️',
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      change: '+2',
      changeType: 'neutral' as const
    }
  ]

  // Animation effect for numbers
  useEffect(() => {
    const targets = [totalParts, totalValue, lowStockParts, outOfStockParts, categories]
    
    const animateValue = (index: number, target: number) => {
      const duration = 1500
      const start = performance.now()
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - start
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4)
        const currentValue = Math.floor(target * easeOutQuart)
        
        setAnimatedValues(prev => {
          const newValues = [...prev]
          newValues[index] = currentValue
          return newValues
        })
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }
    
    targets.forEach((target, index) => {
      setTimeout(() => animateValue(index, target), index * 100)
    })
  }, [totalParts, totalValue, lowStockParts, outOfStockParts, categories])

  const getChangeIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return '↗️'
      case 'negative': return '↘️'
      default: return '→'
    }
  }

  const getCardColorClass = (color: string) => {
    if (color === '#3b82f6') return 'parts-stats__card--blue'
    if (color === '#10b981') return 'parts-stats__card--green'
    if (color === '#f59e0b') return 'parts-stats__card--orange'
    if (color === '#ef4444') return 'parts-stats__card--red'
    if (color === '#8b5cf6') return 'parts-stats__card--purple'
    return ''
  }

  const getChangeTypeClass = (type: 'positive' | 'negative' | 'neutral') => {
    return `parts-stats__change-badge--${type}`
  }

  return (
    <div className="parts-stats">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`parts-stats__card ${getCardColorClass(stat.color)}`}
        >
          {/* Gradient overlay */}
          <div 
            className="parts-stats__gradient-overlay"
            style={{ background: stat.gradient }}
          />
          
          <div className="parts-stats__header">
            <div 
              className="parts-stats__icon-wrapper"
              style={{ 
                background: stat.gradient,
                boxShadow: `0 8px 16px ${stat.color}30`
              }}
            >
              {stat.icon}
            </div>
            <div className={`parts-stats__change-badge ${getChangeTypeClass(stat.changeType)}`}>
              <span>{getChangeIcon(stat.changeType)}</span>
              <span>{stat.change}</span>
            </div>
          </div>
          
          <div>
            <div 
              className="parts-stats__value"
              style={{ background: stat.gradient }}
            >
              {index === 1 ? formatPrice(animatedValues[index]) : formatNumber(animatedValues[index])}
            </div>
          </div>
          
          <div className="parts-stats__title">
            {stat.title}
          </div>
          
          {/* Progress bar for visual appeal */}
          <div className="parts-stats__progress-bar">
            <div 
              className="parts-stats__progress-fill"
              style={{
                background: stat.gradient,
                width: `${Math.min((animatedValues[index] / Math.max(...stats.map(s => s.value))) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

