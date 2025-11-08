import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { X } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { addMessage, setMessageStatus, removeMessage } from '@/store/chatSlice'
import { ChatService } from '@/services/chatService'
import signalRService from '@/services/signalRService'
import InputActions from './InputActions'
import type { ChatMessage } from '@/types/chat'
import './MessageInput.scss'

interface MessageInputProps {
  conversationId: string
  replyToMessage?: ChatMessage | null
  onReplyCancel?: () => void
  className?: string
}

export interface MessageInputRef {
  setReplyTo: (message: ChatMessage | null) => void
  focus: () => void
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(({
  conversationId,
  replyToMessage,
  onReplyCancel,
  className = ''
}, ref) => {
  const dispatch = useAppDispatch()
  const authUser = useAppSelector((state) => state.auth.user)
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [currentReplyTo, setCurrentReplyTo] = useState<ChatMessage | null>(replyToMessage || null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const sendingRef = useRef(false) // Use ref to prevent duplicate sends
  const lastSendTimeRef = useRef<number>(0) // Track last send time to prevent rapid duplicate sends
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track typing timeout
  const lastTypingTimeRef = useRef<number>(0) // Track last typing indicator send time
  const stopTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track stop typing timeout (debounce)
  const isTypingRef = useRef<boolean>(false) // Track if currently typing

  useImperativeHandle(ref, () => ({
    setReplyTo: (message: ChatMessage | null) => {
      setCurrentReplyTo(message)
      textareaRef.current?.focus()
    },
    focus: () => {
      textareaRef.current?.focus()
    }
  }))

  useEffect(() => {
    // Only update if replyToMessage prop actually changes (not just on every render)
    // This prevents resetting currentReplyTo when new messages arrive
    // Compare by ID to avoid unnecessary resets
    if (replyToMessage?.id !== currentReplyTo?.id) {
    setCurrentReplyTo(replyToMessage || null)
    }
  }, [replyToMessage, currentReplyTo])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  // Cleanup typing timeout on unmount and stop typing indicator
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current)
      }
      // Stop typing indicator when component unmounts
      if (isTypingRef.current) {
        signalRService.sendTypingIndicator(conversationId, false)
        isTypingRef.current = false
      }
    }
  }, [conversationId])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Clear existing stop typing timeout (debounce)
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current)
      stopTypingTimeoutRef.current = null
    }

    // Clear existing auto-stop timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (value.trim()) {
      // User is typing - send typing indicator with throttle (max once per 500ms)
      const now = Date.now()
      if (now - lastTypingTimeRef.current > 500) {
        signalRService.notifyTyping(conversationId)
        lastTypingTimeRef.current = now
        isTypingRef.current = true
      }

      // Set up debounce to detect when user stops typing (1 second of no changes)
      stopTypingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          signalRService.sendTypingIndicator(conversationId, false)
          isTypingRef.current = false
        }
        stopTypingTimeoutRef.current = null
      }, 1000)

      // Auto-stop typing after 3 seconds of inactivity (backup)
      typingTimeoutRef.current = setTimeout(() => {
        if (isTypingRef.current) {
          signalRService.sendTypingIndicator(conversationId, false)
          isTypingRef.current = false
        }
        typingTimeoutRef.current = null
      }, 3000)
    } else {
      // Stop typing immediately if input is empty
      if (isTypingRef.current) {
        signalRService.sendTypingIndicator(conversationId, false)
        isTypingRef.current = false
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation() // Prevent event bubbling
      handleSendMessage()
    }
  }

  const handleBlur = () => {
    // Stop typing indicator when user leaves the input field
    if (isTypingRef.current) {
      signalRService.sendTypingIndicator(conversationId, false)
      isTypingRef.current = false
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current)
      stopTypingTimeoutRef.current = null
    }
  }

  const handleFocus = () => {
    // When user focuses back, if there's text, start typing indicator
    if (message.trim()) {
      signalRService.notifyTyping(conversationId)
    }
  }

  const handleSendClick = (e?: React.MouseEvent) => {
    // Prevent if already sending
    if (sendingRef.current) {
      e?.preventDefault()
      e?.stopPropagation()
      return
    }
    handleSendMessage()
  }

  const handleSendMessage = async () => {
    // Prevent duplicate sends using ref (more reliable than state)
    const now = Date.now()
    const timeSinceLastSend = now - lastSendTimeRef.current

    // Prevent if already sending or sent within last 500ms (debounce)
    if (sendingRef.current || timeSinceLastSend < 500 || (!message.trim() && attachments.length === 0)) {
      return
    }

    try {
      // Set flags immediately to prevent duplicate calls
      lastSendTimeRef.current = now
      sendingRef.current = true
      setIsSending(true)

      const tempMessageId = `temp-${Date.now()}`
      // Use authUser.id from Redux store, fallback to localStorage
      const currentUserId = authUser?.id?.toString() || localStorage.getItem('userId') || 'guest'

      // Create temporary message for optimistic UI
      const tempMessage = {
        id: tempMessageId,
        conversationId,
        senderId: String(currentUserId),
        senderName: 'Bạn',
        content: message.trim(),
        timestamp: new Date().toISOString(),
        type: attachments.length > 0 ? 'file' as const : 'text' as const,
        isRead: false,
        messageStatus: 'sending' as const,
        attachments: attachments.map((file, index) => ({
          id: `temp-${index}`,
          type: file.type.startsWith('image/') ? 'image' as const : 'file' as const,
          url: URL.createObjectURL(file),
          name: file.name,
          size: file.size
        }))
      }

      // Use currentUserId from above (already declared at line 217)
      dispatch(addMessage({ conversationId, message: tempMessage, currentUserId }))

      // Send message via API
      const replyToMessageId = currentReplyTo ? parseInt(currentReplyTo.id) : undefined

      const response = await ChatService.sendMessageToConversation(
        parseInt(conversationId),
        message.trim(),
        replyToMessageId,
        attachments
      )

      // Update message status - SignalR will replace temp message with real one
      if (response.success && response.data) {
        dispatch(setMessageStatus({
          conversationId,
          messageId: tempMessageId,
          status: 'sent'
        }))
      } else {
        // Just update status if no data
        dispatch(setMessageStatus({
          conversationId,
          messageId: tempMessageId,
          status: 'sent'
        }))
      }

      // Stop typing indicator when message is sent
      if (isTypingRef.current) {
        signalRService.sendTypingIndicator(conversationId, false)
        isTypingRef.current = false
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
      if (stopTypingTimeoutRef.current) {
        clearTimeout(stopTypingTimeoutRef.current)
        stopTypingTimeoutRef.current = null
      }

      // Clear input and reply
      setMessage('')
      setAttachments([])
      setCurrentReplyTo(null)
      if (onReplyCancel) {
        onReplyCancel()
      }
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      // Update message status to show error
      dispatch(setMessageStatus({
        conversationId,
        messageId: `temp-${Date.now()}`,
        status: 'sent'
      }))
    } finally {
      sendingRef.current = false
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments(prev => [...prev, ...files])
    if (e.target) {
      e.target.value = ''
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`message-input ${className}`}>
      {currentReplyTo && (
        <div className="message-input__reply">
          <div className="message-input__reply-content">
            <div className="message-input__reply-name">Trả lời {currentReplyTo.senderName}</div>
            <div className="message-input__reply-text">{currentReplyTo.content}</div>
          </div>
          <button
            className="message-input__reply-cancel"
            onClick={() => {
              setCurrentReplyTo(null)
              if (onReplyCancel) {
                onReplyCancel()
              }
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="message-input__container">
        <textarea
          ref={textareaRef}
          className="message-input__textarea"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          rows={1}
        />

        {attachments.length > 0 && (
          <div className="message-input__attachments">
            {attachments.map((file, index) => (
              <div key={index} className="message-input__attachment">
                <span className="message-input__attachment-name">{file.name}</span>
                <button
                  className="message-input__attachment-remove"
                  onClick={() => handleRemoveAttachment(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="message-input__footer">
          <span className="message-input__add-image-text">Thêm hình ảnh</span>
          <InputActions
            onFileSelect={() => fileInputRef.current?.click()}
            onImageSelect={() => imageInputRef.current?.click()}
            onSend={handleSendClick}
            disabled={(!message.trim() && attachments.length === 0) || isSending}
          />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </div>
  )
})

MessageInput.displayName = 'MessageInput'

export default MessageInput

