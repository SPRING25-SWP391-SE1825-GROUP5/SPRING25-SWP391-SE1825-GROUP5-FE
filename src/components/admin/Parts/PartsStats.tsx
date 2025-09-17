import React, { useState, useEffect } from 'react'
import { Part } from '../../../types/parts'

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

  const getChangeColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return '#10b981'
      case 'negative': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getChangeIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return '↗️'
      case 'negative': return '↘️'
      default: return '→'
    }
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '24px',
      marginBottom: '32px'
    }}>
      {stats.map((stat, index) => (
        <div
          key={index}
          style={{
            background: '#ffffff',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #f3f4f6',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)'
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            e.currentTarget.style.borderColor = stat.color + '40'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            e.currentTarget.style.borderColor = '#f3f4f6'
          }}
        >
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background: stat.gradient,
            opacity: 0.05,
            borderRadius: '50%',
            transform: 'translate(30px, -30px)'
          }} />
          
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: stat.gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: `0 8px 16px ${stat.color}30`
            }}>
              {stat.icon}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '20px',
              background: getChangeColor(stat.changeType) + '15',
              fontSize: '12px',
              fontWeight: '600',
              color: getChangeColor(stat.changeType)
            }}>
              <span>{getChangeIcon(stat.changeType)}</span>
              <span>{stat.change}</span>
            </div>
          </div>
          
          <div style={{
            marginBottom: '8px'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: '800',
              background: stat.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: '1.2',
              fontFamily: '"Inter", system-ui, sans-serif'
            }}>
              {index === 1 ? formatPrice(animatedValues[index]) : formatNumber(animatedValues[index])}
            </div>
          </div>
          
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: '600',
            letterSpacing: '0.025em'
          }}>
            {stat.title}
          </div>
          
          {/* Progress bar for visual appeal */}
          <div style={{
            width: '100%',
            height: '3px',
            background: '#f3f4f6',
            borderRadius: '2px',
            marginTop: '16px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: stat.gradient,
              borderRadius: '2px',
              width: `${Math.min((animatedValues[index] / Math.max(...stats.map(s => s.value))) * 100, 100)}%`,
              transition: 'width 1s ease-out'
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

