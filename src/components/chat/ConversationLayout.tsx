import React from 'react'
import ConversationSidebar from './ConversationSidebar'
import ConversationDetail from './ConversationDetail'
import { useAppSelector } from '@/store/hooks'
import './ConversationLayout.scss'

interface ConversationLayoutProps {
  onCreateNewChat?: () => void
}

const ConversationLayout: React.FC<ConversationLayoutProps> = ({ onCreateNewChat }) => {
  const { conversations, activeConversationId } = useAppSelector((state) => state.chat)
  const selectedConversation = conversations.find(conv => conv.id === activeConversationId) || null

  return (
    <div className="conversation-layout">
      <ConversationSidebar onCreateNewChat={onCreateNewChat} />
      <ConversationDetail conversation={selectedConversation} />
    </div>
  )
}

export default ConversationLayout

