import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
  className?: string
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Chọn...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Tìm label của option được chọn
  useEffect(() => {
    const selectedOption = options.find(option => option.value === value)
    setSelectedLabel(selectedOption ? selectedOption.label : placeholder)
  }, [value, options, placeholder])

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  return (
    <div className={`custom-select ${className}`} ref={dropdownRef}>
      <div 
        className="custom-select__trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="custom-select__trigger__text">{selectedLabel}</span>
        <ChevronDown 
          size={16} 
          className={`custom-select__trigger__icon ${isOpen ? 'custom-select__trigger__icon--open' : ''}`}
        />
      </div>
      
      {isOpen && (
        <div className="custom-select__dropdown">
          {options.map((option) => (
            <div
              key={option.value}
              className={`custom-select__option ${
                value === option.value ? 'custom-select__option--selected' : ''
              }`}
              onClick={() => handleOptionClick(option.value)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
