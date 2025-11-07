import React from 'react'
import { Paperclip, Image as ImageIcon, ArrowUp } from 'lucide-react'
import './InputActions.scss'

interface InputActionsProps {
  onFileSelect: () => void
  onImageSelect: () => void
  onSend: () => void
  disabled?: boolean
  className?: string
}

const InputActions: React.FC<InputActionsProps> = ({
  onFileSelect,
  onImageSelect,
  onSend,
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`input-actions ${className}`}>
      <button
        className="input-actions__btn"
        onClick={onFileSelect}
        title="Đính kèm file"
      >
        <Paperclip size={18} />
      </button>

      <button
        className="input-actions__btn"
        onClick={onImageSelect}
        title="Thêm hình ảnh"
      >
        <ImageIcon size={18} />
      </button>

      <button
        className={`input-actions__btn input-actions__btn--send ${disabled ? 'disabled' : ''}`}
        onClick={onSend}
        disabled={disabled}
        title="Gửi"
      >
        <ArrowUp size={18} />
      </button>
    </div>
  )
}

export default InputActions

