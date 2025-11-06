/**
 * ChatInterface - Trang nhắn tin đầy đủ với giao diện 3 cột
 *
 * Tính năng:
 * - Giao diện 3 cột: danh sách cuộc trò chuyện, khu vực chat, thông tin đối phương
 * - Quản lý nhiều cuộc trò chuyện
 * - Tìm kiếm cuộc trò chuyện
 * - Thông tin chi tiết về người dùng
 */
import React, { useState, useEffect, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { setConversations, setActiveConversation, addConversation, setMessages } from '@/store/chatSlice'
import ChatList from './ChatList'
import ChatArea from './ChatArea'
import ChatInfo from './ChatInfo'
import { ChatService } from '@/services/chatService'
import type { ChatConversation, ChatUser } from '@/types/chat'
import './ChatInterface.scss'

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch()
  const [showInfo, setShowInfo] = useState(false)
  const [showNewChatModal, setShowNewChatModal] = useState(false)

  const authUser = useAppSelector((state) => state.auth.user)
  const { conversations, activeConversationId } = useAppSelector((state) => state.chat)
  const selectedConversation = conversations.find(conv => conv.id === activeConversationId) || null

  const currentUser: ChatUser | null = useMemo(() => {
    if (authUser) {
      return {
        id: authUser.id?.toString() || '1',
        name: authUser.fullName || 'Nguyễn Văn A',
        avatar: authUser.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        role: 'customer',
        isOnline: true
      }
    }
    // Guest user: sử dụng guestSessionId từ localStorage
    const guestSessionId = typeof localStorage !== 'undefined'
      ? localStorage.getItem('guestSessionId') || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    if (typeof localStorage !== 'undefined' && !localStorage.getItem('guestSessionId')) {
      localStorage.setItem('guestSessionId', guestSessionId)
    }

    return {
      id: guestSessionId,
      name: 'Khách',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      role: 'customer',
      isOnline: true
    }
  }, [authUser?.id, authUser?.fullName, authUser?.avatar])


  useEffect(() => {
    if (currentUser?.id) {
      loadConversations()
    }
  }, [currentUser?.id])

  const loadConversations = async () => {
    try {
      const convs = await ChatService.getConversations()
      dispatch(setConversations(convs))
      if (convs.length > 0 && (!activeConversationId || !convs.some(c => c.id === activeConversationId))) {
        dispatch(setActiveConversation(convs[0].id))
      }
    } catch (error) {

    }
  }

  const handleConversationSelect = (conversation: ChatConversation) => {
    dispatch(setActiveConversation(conversation.id))
    setShowInfo(false)
  }

  const handleCreateNewChat = async () => {
    try {
      // Get available staff
      const availableStaff = await ChatService.getAvailableStaff()
      if (availableStaff.length > 0) {
        // Create conversation with first available staff
        const conversation = await ChatService.createConversation(availableStaff[0].id)
        dispatch(addConversation(conversation))
        dispatch(setActiveConversation(conversation.id))
        setShowInfo(false)
      }
    } catch (error) {

    }
  }

  const handleInfoClick = () => {
    setShowInfo(!showInfo)
  }

  if (!currentUser) {
    return (
      <div className="chat-interface">
        <div className="chat-interface__loading">
          <div className="loading-spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="chat-interface">
      <div className="chat-interface__container">
        {/* Chat List - Left Sidebar */}
        <div className="chat-interface__sidebar">
          <ChatList
            selectedConversationId={activeConversationId}
            onConversationSelect={handleConversationSelect}
            onCreateNewChat={handleCreateNewChat}
          />
        </div>

        {/* Chat Area - Main Content */}
        <div className="chat-interface__main">
          <ChatArea
            conversation={selectedConversation}
            currentUser={currentUser}
            onInfoClick={handleInfoClick}
          />
        </div>

        {/* Chat Info - Right Sidebar */}
        {showInfo && (
          <div className="chat-interface__info">
            <ChatInfo
              conversation={selectedConversation}
              currentUser={currentUser}
            />
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="new-chat-modal">
          <div className="modal-overlay" onClick={() => setShowNewChatModal(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tạo cuộc trò chuyện mới</h3>
              <button
                className="close-btn"
                onClick={() => setShowNewChatModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Chọn nhân viên để bắt đầu trò chuyện:</p>
              <div className="staff-list">
                {/* Staff list will be populated here */}
                <div className="staff-item">
                  <div className="staff-avatar"></div>
                  <div className="staff-info">
                    <h4>Nhân viên hỗ trợ 1</h4>
                    <span>Đang hoạt động</span>
                  </div>
                  <button className="start-chat-btn">Bắt đầu</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface
