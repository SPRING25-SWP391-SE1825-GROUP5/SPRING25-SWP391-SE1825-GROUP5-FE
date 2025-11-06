import React, { useState, useRef, useEffect } from 'react'
import { Trash2, Archive, MoreVertical, Pin } from 'lucide-react'
import './ConversationItemActions.scss'

interface ConversationItemActionsProps {
  onPin: (e: React.MouseEvent) => void
  onArchive: () => void
  onDelete: () => void
  isPinned: boolean
}

const ConversationItemActions: React.FC<ConversationItemActionsProps> = ({
  onPin,
  onArchive,
  onDelete,
  isPinned
}) => {
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMore(false)
      }
    }

    if (showMore) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMore])

  return (
    <div className="conversation-item-actions">
      <button
        className="conversation-item-actions__btn"
        onClick={onPin}
        title={isPinned ? 'Bỏ ghim' : 'Ghim'}
      >
        <Pin size={16} className={isPinned ? 'pinned' : ''} />
      </button>

      <button
        className="conversation-item-actions__btn"
        onClick={onArchive}
        title="Lưu trữ"
      >
        <Archive size={16} />
      </button>

      <div className="conversation-item-actions__more" ref={moreRef}>
        <button
          className="conversation-item-actions__btn"
          onClick={() => setShowMore(!showMore)}
          title="Thêm"
        >
          <MoreVertical size={16} />
        </button>

        {showMore && (
          <div className="conversation-item-actions__dropdown">
            <button
              className="conversation-item-actions__dropdown-item"
              onClick={() => {
                onDelete()
                setShowMore(false)
              }}
            >
              <Trash2 size={16} />
              <span>Xóa</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ConversationItemActions

