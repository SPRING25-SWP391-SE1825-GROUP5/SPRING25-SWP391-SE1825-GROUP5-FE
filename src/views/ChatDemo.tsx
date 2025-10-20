/**
 * Chat Demo Component
 * Component để test chat widget functionality
 */

import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { openWidget, setConversations, addMessage } from '@/store/chatSlice'
import type { ChatConversation, ChatMessage, ChatUser } from '@/types/chat'

const ChatDemo: React.FC = () => {
  const dispatch = useAppDispatch()
  const { isWidgetOpen, conversations } = useAppSelector((state) => state.chat)

  // Mock data for testing
  useEffect(() => {
    const mockUsers: ChatUser[] = [
      {
        id: 'user1',
        name: 'Nguyễn Văn A',
        role: 'staff',
        isOnline: true,
        avatar: 'https://via.placeholder.com/40x40/1976d2/ffffff?text=A'
      },
      {
        id: 'user2',
        name: 'Trần Thị B',
        role: 'technician',
        isOnline: false,
        avatar: 'https://via.placeholder.com/40x40/4caf50/ffffff?text=B'
      },
      {
        id: 'user3',
        name: 'Lê Văn C',
        role: 'admin',
        isOnline: true,
        avatar: 'https://via.placeholder.com/40x40/ff9800/ffffff?text=C'
      }
    ]

    const mockMessages: ChatMessage[] = [
      {
        id: 'msg1',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'Nguyễn Văn A',
        content: 'Xin chào! Tôi có thể hỗ trợ gì cho bạn?',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'text',
        isRead: true
      },
      {
        id: 'msg2',
        conversationId: 'conv1',
        senderId: 'current-user',
        senderName: 'Bạn',
        content: 'Tôi muốn đặt lịch bảo dưỡng xe điện',
        timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
        type: 'text',
        isRead: true
      },
      {
        id: 'msg3',
        conversationId: 'conv1',
        senderId: 'user1',
        senderName: 'Nguyễn Văn A',
        content: 'Tất nhiên! Bạn có thể cho tôi biết loại xe và thời gian mong muốn không?',
        timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        type: 'text',
        isRead: false
      }
    ]

    const mockConversations: ChatConversation[] = [
      {
        id: 'conv1',
        participants: [mockUsers[0], { id: 'current-user', name: 'Bạn', role: 'customer', isOnline: true }],
        lastMessage: mockMessages[mockMessages.length - 1],
        unreadCount: 1,
        isPinned: false,
        isArchived: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString()
      },
      {
        id: 'conv2',
        participants: [mockUsers[1], { id: 'current-user', name: 'Bạn', role: 'customer', isOnline: true }],
        lastMessage: {
          id: 'msg4',
          conversationId: 'conv2',
          senderId: 'user2',
          senderName: 'Trần Thị B',
          content: 'Xe của bạn đã sẵn sàng để lấy',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'text',
          isRead: true
        },
        unreadCount: 0,
        isPinned: false,
        isArchived: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ]

    // Set mock data
    dispatch(setConversations(mockConversations))
  }, [dispatch])

  const handleOpenChat = () => {
    dispatch(openWidget())
  }

  const handleAddTestMessage = () => {
    // Simulate adding a test message to the chat
    console.log('Test message added to chat')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Chat Widget Demo</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Tính năng Chat Widget</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">✅ Đã hoàn thành:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Chat widget icon ở góc phải màn hình</li>
              <li>Giao diện chat popup đơn giản giống hình minh họa</li>
              <li>Nhắn tin trực tiếp không cần chọn cuộc trò chuyện</li>
              <li>Welcome message và quick actions</li>
              <li>Tin nhắn với icon avatar Headphones (hỗ trợ khách hàng)</li>
              <li>Typing indicator và auto response</li>
              <li>Responsive design cho mobile/desktop</li>
              <li>Tích hợp Redux state management</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">🎯 Tính năng chính:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>Chat trực tiếp với nhân viên hỗ trợ</li>
              <li>Welcome message tự động</li>
              <li>Quick actions (FAQ, Dịch vụ)</li>
              <li>Auto response từ nhân viên</li>
              <li>Typing indicator khi nhân viên đang trả lời</li>
              <li>File upload (hình ảnh, tài liệu)</li>
              <li>Minimize/restore chat window</li>
              <li>Responsive cho mobile và desktop</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Hướng dẫn sử dụng</h2>
        <div className="space-y-3 text-blue-700">
          <p><strong>1.</strong> Nhìn góc phải màn hình - bạn sẽ thấy icon chat màu xanh</p>
          <p><strong>2.</strong> Click vào icon để mở chat widget</p>
          <p><strong>3.</strong> Giao diện chat sẽ hiện lên với welcome message</p>
          <p><strong>4.</strong> Nhập tin nhắn và gửi ngay lập tức</p>
          <p><strong>5.</strong> Nhân viên sẽ tự động phản hồi với typing indicator</p>
          <p><strong>6.</strong> Sử dụng các nút minimize/close để điều khiển</p>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleOpenChat}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          {isWidgetOpen ? 'Chat đã mở' : 'Mở Chat Widget'}
        </button>
        
        <button
          onClick={handleAddTestMessage}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Thêm tin nhắn test
        </button>
        
        <a
          href="/avatar-demo"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
        >
          Xem Headphones Icon Demo
        </a>
      </div>

      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3">📊 Thống kê hiện tại:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{conversations.length}</div>
            <div className="text-gray-600">Cuộc trò chuyện</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
            </div>
            <div className="text-gray-600">Tin nhắn chưa đọc</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {conversations.filter(conv => conv.participants.some(p => p.isOnline)).length}
            </div>
            <div className="text-gray-600">Nhân viên online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {isWidgetOpen ? 'Mở' : 'Đóng'}
            </div>
            <div className="text-gray-600">Trạng thái widget</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatDemo
