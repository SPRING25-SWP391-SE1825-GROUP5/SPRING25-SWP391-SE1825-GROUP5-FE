import React, { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Smile, Image, File } from 'lucide-react'
import './MessageInput.scss'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file') => void
  onTyping?: () => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = "Nhập tin nhắn...",
  disabled = false,
  className = ''
}) => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
    '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
    '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
    '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
    '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
    '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
    '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
    '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
    '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
    '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
    '😹', '😻', '😼', '😽', '🙀', '😿', '😾'
  ]

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Handle typing indicator
    if (onTyping && value.trim()) {
      setIsTyping(true)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
      }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim(), 'text')
      setMessage('')
      setIsTyping(false)
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    textareaRef.current?.focus()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, just show file name in message
      // In real implementation, you would upload the file first
      const fileType = file.type.startsWith('image/') ? 'image' : 'file'
      onSendMessage(`📎 ${file.name}`, fileType)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageSelect = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`message-input ${className}`}>
      <div className="message-input__container">
        {/* Attachment Button */}
        <button
          className="message-input__attach-btn"
          onClick={handleImageSelect}
          disabled={disabled}
          aria-label="Đính kèm file"
          title="Đính kèm file"
        >
          <Paperclip size={20} />
        </button>

        {/* Text Input */}
        <div className="message-input__input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="message-input__input"
            rows={1}
            maxLength={2000}
          />
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="message-input__emoji-picker">
              <div className="message-input__emoji-grid">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    className="message-input__emoji-btn"
                    onClick={() => handleEmojiSelect(emoji)}
                    aria-label={`Emoji ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emoji Button */}
        <button
          className="message-input__emoji-btn"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          aria-label="Thêm emoji"
          title="Thêm emoji"
        >
          <Smile size={20} />
        </button>

        {/* Send Button */}
        <button
          className="message-input__send-btn"
          onClick={handleSendMessage}
          disabled={disabled || !message.trim()}
          aria-label="Gửi tin nhắn"
          title="Gửi tin nhắn"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileSelect}
        className="message-input__file-input"
        aria-hidden="true"
      />

      {/* Typing Indicator */}
      {isTyping && (
        <div className="message-input__typing">
          <span>Đang nhập...</span>
        </div>
      )}
    </div>
  )
}

export default MessageInput
