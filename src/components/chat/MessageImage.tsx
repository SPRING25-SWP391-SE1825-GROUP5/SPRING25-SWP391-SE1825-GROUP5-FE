import React from 'react'
import type { ChatAttachment } from '@/types/chat'
import { normalizeImageUrl } from '@/utils/imageUrl'
import './MessageImage.scss'

interface MessageImageProps {
  attachment: ChatAttachment
  className?: string
  onClick?: () => void
  totalImages?: number
  imageIndex?: number
}

const MessageImage: React.FC<MessageImageProps> = ({
  attachment,
  className = '',
  onClick,
  totalImages = 1,
  imageIndex = 0
}) => {
  const handleImageClick = () => {
    if (onClick) {
      onClick()
    }
  }

  // Determine grid layout based on number of images
  const getGridClass = () => {
    if (totalImages === 1) return 'message-image--single'
    if (totalImages === 2) return 'message-image--double'
    if (totalImages === 3) return 'message-image--triple'
    if (totalImages === 4) return 'message-image--quad'
    return 'message-image--multiple'
  }

  return (
    <div
      className={`message-image ${getGridClass()} ${className}`}
      onClick={handleImageClick}
      style={{
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <img
        src={normalizeImageUrl(attachment.thumbnail || attachment.url)}
        alt={attachment.name}
        className="message-image__thumbnail"
        loading="lazy"
        onError={(e) => {
          // If image fails to load, try alternative paths
          const currentSrc = (e.target as HTMLImageElement).src
          const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5001'
          const cleanBaseURL = baseURL.replace(/\/api$/, '')

          // Try different paths
          const url = attachment.url || attachment.thumbnail || ''
          if (url && !url.startsWith('http') && !url.startsWith('blob:')) {
            const alternativePaths = [
              `${cleanBaseURL}/api/uploads/${url}`,
              `${cleanBaseURL}/uploads/${url}`,
              `${cleanBaseURL}/images/${url}`
            ]

            // Try next path if current one failed
            const currentPathIndex = alternativePaths.findIndex(path => currentSrc.includes(path.split('/').pop() || ''))
            if (currentPathIndex >= 0 && currentPathIndex < alternativePaths.length - 1) {
              (e.target as HTMLImageElement).src = alternativePaths[currentPathIndex + 1]
            }
          }
        }}
      />
      {totalImages > 4 && imageIndex === 3 && (
        <div className="message-image__overlay">
          <span className="message-image__count">+{totalImages - 4}</span>
        </div>
      )}
    </div>
  )
}

export default MessageImage

