import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { ChatAttachment } from '@/types/chat'
import './MessageImage.scss'

interface MessageImageProps {
  attachment: ChatAttachment
  className?: string
}

const MessageImage: React.FC<MessageImageProps> = ({
  attachment,
  className = ''
}) => {
  const [showLightbox, setShowLightbox] = useState(false)

  const handleImageClick = () => {
    setShowLightbox(true)
  }

  const handleCloseLightbox = () => {
    setShowLightbox(false)
  }

  return (
    <>
      <div className={`message-image ${className}`} onClick={handleImageClick}>
        <img
          src={attachment.thumbnail || attachment.url}
          alt={attachment.name}
          className="message-image__thumbnail"
        />
      </div>

      {showLightbox && (
        <div className="message-image__lightbox" onClick={handleCloseLightbox}>
          <button
            className="message-image__close"
            onClick={handleCloseLightbox}
          >
            <X size={24} />
          </button>
          <img
            src={attachment.url}
            alt={attachment.name}
            className="message-image__full"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}

export default MessageImage

