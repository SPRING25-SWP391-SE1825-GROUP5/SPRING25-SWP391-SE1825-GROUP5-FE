import React from 'react'
import { formatMessageContent } from '@/utils/richTextFormatter'
import type { ChatMessage } from '@/types/chat'
import './MessageContent.scss'

interface MessageContentProps {
  message: ChatMessage
  className?: string
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  className = ''
}) => {
  const content = message.richTextContent || message.content
  const format = message.formatting || 'plain'

  const formattedContent = formatMessageContent(content, format)

  return (
    <div
      className={`message-content ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  )
}

export default MessageContent

