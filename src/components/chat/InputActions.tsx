import React, { useState } from 'react'
import { Paperclip, Image as ImageIcon, Smile, ArrowUp } from 'lucide-react'
import './InputActions.scss'

interface InputActionsProps {
  onFileSelect: () => void
  onImageSelect: () => void
  onEmojiSelect?: (emoji: string) => void
  onSend: () => void
  disabled?: boolean
  className?: string
}

const InputActions: React.FC<InputActionsProps> = ({
  onFileSelect,
  onImageSelect,
  onEmojiSelect,
  onSend,
  disabled = false,
  className = ''
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜'
  ]

  const handleEmojiSelect = (emoji: string) => {
    if (onEmojiSelect) {
      onEmojiSelect(emoji)
    }
    setShowEmojiPicker(false)
  }

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

      <div className="input-actions__emoji-container">
        <button
          className="input-actions__btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          title="Thêm emoji"
        >
          <Smile size={18} />
        </button>

        {showEmojiPicker && (
          <div className="input-actions__emoji-picker">
            {commonEmojis.map((emoji) => (
              <button
                key={emoji}
                className="input-actions__emoji-item"
                onClick={() => handleEmojiSelect(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

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

