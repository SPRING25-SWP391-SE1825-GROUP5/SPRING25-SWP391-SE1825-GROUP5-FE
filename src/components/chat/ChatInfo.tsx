import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search, Edit3, Palette, Smile, Phone, Video, Mail, MapPin, Clock } from 'lucide-react'
import { ChatService } from '@/services/chatService'
import type { ChatConversation, ChatUser } from '@/types/chat'
import './ChatInfo.scss'

interface ChatInfoProps {
  conversation: ChatConversation | null
  currentUser: ChatUser
}

const ChatInfo: React.FC<ChatInfoProps> = ({ conversation, currentUser }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['options']))
  const [sharedPhotos, setSharedPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (conversation) {
      loadSharedPhotos()
    }
  }, [conversation])

  const loadSharedPhotos = async () => {
    if (!conversation) return

    try {
      setLoading(true)
      // Mock data for shared photos
      const mockPhotos = [
        '/shared-photos/rubik-cube.jpg',
        '/shared-photos/wooden-chair.jpg',
        '/shared-photos/open-book.jpg'
      ]
      setSharedPhotos(mockPhotos)
    } catch (error) {
      console.error('Error loading shared photos:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const getOtherParticipant = () => {
    if (!conversation) return null
    return conversation.participants.find(p => p.id !== currentUser.id)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'technician': return 'Kỹ thuật viên'
      case 'staff': return 'Nhân viên hỗ trợ'
      case 'admin': return 'Quản trị viên'
      default: return 'Nhân viên'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'technician': return '#10b981'
      case 'staff': return '#3b82f6'
      case 'admin': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Không xác định'
    
    const date = new Date(lastSeen)
    const now = new Date()
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60)
    
    if (diffInMinutes < 1) return 'Vừa xong'
    if (diffInMinutes < 60) return `${Math.floor(diffInMinutes)} phút trước`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`
    return date.toLocaleDateString('vi-VN')
  }

  if (!conversation) {
    return (
      <div className="chat-info">
        <div className="chat-info__empty">
          <div className="empty-state">
            <h3>Chọn một cuộc trò chuyện</h3>
            <p>Xem thông tin chi tiết về cuộc trò chuyện</p>
          </div>
        </div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="chat-info">
      <div className="chat-info__header">
        <div className="participant-profile">
          <img 
            src={otherParticipant?.avatar || '/default-avatar.png'} 
            alt={otherParticipant?.name}
            className="profile-avatar"
          />
          <div className="profile-details">
            <h3>{otherParticipant?.name}</h3>
            <span 
              className="role-badge"
              style={{ backgroundColor: getRoleColor(otherParticipant?.role || 'staff') }}
            >
              {getRoleLabel(otherParticipant?.role || 'staff')}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-info__content">
        {/* Contact Information */}
        <div className="info-section">
          <div className="contact-info">
            <div className="contact-item">
              <Phone size={16} />
              <span>1900 123 456</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>support@evservice.com</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>Hà Nội, Việt Nam</span>
            </div>
            <div className="contact-item">
              <Clock size={16} />
              <span>Hoạt động: {formatLastSeen(otherParticipant?.lastSeen)}</span>
            </div>
          </div>
        </div>

        {/* Options Section */}
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('options')}
          >
            <span>OPTIONS</span>
            {expandedSections.has('options') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedSections.has('options') && (
            <div className="section-content">
              <button className="option-item">
                <Search size={16} />
                <span>Tìm kiếm trong cuộc trò chuyện</span>
              </button>
              <button className="option-item">
                <Edit3 size={16} />
                <span>Chỉnh sửa biệt danh</span>
              </button>
              <button className="option-item">
                <Palette size={16} />
                <span>Thay đổi chủ đề</span>
              </button>
              <button className="option-item">
                <Smile size={16} />
                <span>Thay đổi emoji</span>
              </button>
            </div>
          )}
        </div>

        {/* Privacy & Support Section */}
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('privacy')}
          >
            <span>PRIVACY & SUPPORT</span>
            {expandedSections.has('privacy') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedSections.has('privacy') && (
            <div className="section-content">
              <button className="option-item">
                <span>Báo cáo cuộc trò chuyện</span>
              </button>
              <button className="option-item">
                <span>Chặn người dùng</span>
              </button>
              <button className="option-item">
                <span>Xóa cuộc trò chuyện</span>
              </button>
            </div>
          )}
        </div>

        {/* Shared Photos Section */}
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('photos')}
          >
            <span>SHARED PHOTOS</span>
            {expandedSections.has('photos') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedSections.has('photos') && (
            <div className="section-content">
              {loading ? (
                <div className="photos-loading">
                  <div className="photo-skeleton"></div>
                  <div className="photo-skeleton"></div>
                  <div className="photo-skeleton"></div>
                </div>
              ) : sharedPhotos.length > 0 ? (
                <div className="shared-photos">
                  {sharedPhotos.map((photo, index) => (
                    <div key={index} className="photo-item">
                      <img 
                        src={photo} 
                        alt={`Shared photo ${index + 1}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.png'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-photos">
                  <p>Chưa có ảnh nào được chia sẻ</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shared Files Section */}
        <div className="info-section">
          <button 
            className="section-header"
            onClick={() => toggleSection('files')}
          >
            <span>SHARED FILES</span>
            {expandedSections.has('files') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedSections.has('files') && (
            <div className="section-content">
              <div className="no-files">
                <p>Chưa có file nào được chia sẻ</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInfo
