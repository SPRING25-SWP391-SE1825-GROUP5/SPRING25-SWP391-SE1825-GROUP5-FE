import React from 'react'
import { Search } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setSearchQuery } from '@/store/chatSlice'
import './ConversationSearch.scss'

const ConversationSearch: React.FC = () => {
  const dispatch = useAppDispatch()
  const { searchQuery } = useAppSelector((state) => state.chat)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value))
  }

  return (
    <div className="conversation-search">
      <Search className="conversation-search__icon" size={18} />
      <input
        type="text"
        className="conversation-search__input"
        placeholder="Tìm kiếm cuộc trò chuyện..."
        value={searchQuery}
        onChange={handleChange}
      />
    </div>
  )
}

export default ConversationSearch

