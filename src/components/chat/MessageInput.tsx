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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setMessage(value)

    // Send typing indicator
    if (value.trim()) {
      signalRService.notifyTyping(conversationId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation() // Prevent event bubbling
      console.log('[MessageInput] handleKeyDown triggered')
      handleSendMessage()
    }
  }

  const handleSendClick = (e?: React.MouseEvent) => {
    console.log('[MessageInput] handleSendClick triggered, sendingRef:', sendingRef.current)
    // Prevent if already sending
    if (sendingRef.current) {
      console.log('[MessageInput] Already sending, preventing duplicate')
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

    console.log('[MessageInput] handleSendMessage called', {
      sendingRef: sendingRef.current,
      timeSinceLastSend,
      messageLength: message.trim().length,
      attachmentsCount: attachments.length
    })

    // Prevent if already sending or sent within last 500ms (debounce)
    if (sendingRef.current || timeSinceLastSend < 500 || (!message.trim() && attachments.length === 0)) {
      console.log('[MessageInput] Prevented duplicate send', {
        reason: sendingRef.current ? 'already_sending' : timeSinceLastSend < 500 ? 'too_soon' : 'empty_message'
      })
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

      console.log('[MessageInput] Starting send process', {
        tempMessageId,
        conversationId,
        currentUserId,
        content: message.trim(),
        replyToMessageId: currentReplyTo?.id
      })

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

      console.log('[MessageInput] Adding temp message to store', tempMessage)
      dispatch(addMessage({ conversationId, message: tempMessage }))

      // Send message via API
      const replyToMessageId = currentReplyTo ? parseInt(currentReplyTo.id) : undefined
      console.log('[MessageInput] Calling API sendMessageToConversation', {
        conversationId: parseInt(conversationId),
        content: message.trim(),
        replyToMessageId,
        attachmentsCount: attachments.length
      })

      const response = await ChatService.sendMessageToConversation(
        parseInt(conversationId),
        message.trim(),
        replyToMessageId,
        attachments
      )

      console.log('[MessageInput] API response received', {
        success: response.success,
        messageId: response.data?.messageId || response.data?.id,
        data: response.data
      })

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
      console.error('[MessageInput] Error sending message', error)

      // Update message status to show error
      dispatch(setMessageStatus({
        conversationId,
        messageId: `temp-${Date.now()}`,
        status: 'sent'
      }))
    } finally {
      console.log('[MessageInput] Resetting sending flags')
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

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    textareaRef.current?.focus()
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
            onEmojiSelect={handleEmojiSelect}
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
