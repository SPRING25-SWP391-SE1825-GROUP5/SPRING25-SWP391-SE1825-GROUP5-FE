import React from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setActiveFilter } from '@/store/chatSlice'
import './ConversationFilters.scss'

const ConversationFilters: React.FC = () => {
  const dispatch = useAppDispatch()
  const { activeFilter } = useAppSelector((state) => state.chat)

  const filters = [
    { id: 'all' as const, label: 'Tất cả' },
    { id: 'unread' as const, label: 'Chưa đọc' },
    { id: 'pinned' as const, label: 'Đã ghim' }
  ]

  return (
    <div className="conversation-filters">
      {filters.map((filter) => (
        <button
          key={filter.id}
          className={`conversation-filters__tab ${activeFilter === filter.id ? 'active' : ''}`}
          onClick={() => dispatch(setActiveFilter(filter.id))}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

export default ConversationFilters

