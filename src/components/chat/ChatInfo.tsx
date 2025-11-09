import React, { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Search, Edit3, Palette, Smile, Mail, Clock, FileText } from 'lucide-react'
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
  const [sharedFiles, setSharedFiles] = useState<Array<{ name: string; url: string; size: number }>>([])
  const [loading, setLoading] = useState(false)

  const loadSharedMedia = useCallback(async () => {
    if (!conversation) return

    try {
      setLoading(true)

      // Fetch messages to extract shared photos and files
      const messages = await ChatService.getMessages(conversation.id)

      const photos: string[] = []
      const files: Array<{ name: string; url: string; size: number }> = []

      messages.forEach((message) => {
        if (message.attachments && message.attachments.length > 0) {
          message.attachments.forEach((attachment) => {
            if (attachment.type === 'image') {
              photos.push(attachment.url)
            } else if (attachment.type === 'file') {
              files.push({
                name: attachment.name,
                url: attachment.url,
                size: attachment.size
              })
            }
          })
        }
      })

      setSharedPhotos(photos)
      setSharedFiles(files)
    } catch {
      setSharedPhotos([])
      setSharedFiles([])
    } finally {
      setLoading(false)
    }
  }, [conversation])

  useEffect(() => {
    if (conversation) {
      loadSharedMedia()
    }
  }, [conversation, loadSharedMedia])

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
          <div className="profile-avatar-wrapper">
            {otherParticipant?.avatar ? (
              <img
                src={otherParticipant.avatar}
                alt={otherParticipant?.name}
                className="profile-avatar"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const placeholder = target.parentElement?.querySelector('.profile-avatar-placeholder') as HTMLElement
                  if (placeholder) {
                    placeholder.style.display = 'flex'
                  }
                }}
              />
            ) : null}
            <div
              className="profile-avatar-placeholder"
              style={{ display: otherParticipant?.avatar ? 'none' : 'flex' }}
            >
              {otherParticipant?.name?.charAt(0).toUpperCase() || '?'}
            </div>
          </div>
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
            {otherParticipant?.email && (
              <div className="contact-item">
                <Mail size={16} />
                <span>{otherParticipant.email}</span>
              </div>
            )}
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
              {loading ? (
                <div className="files-loading">
                  <div className="file-skeleton"></div>
                  <div className="file-skeleton"></div>
                </div>
              ) : sharedFiles.length > 0 ? (
                <div className="shared-files">
                  {sharedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <FileText size={16} />
                      <div className="file-details">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                      </div>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="file-download">
                        Tải xuống
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-files">
                  <p>Chưa có file nào được chia sẻ</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatInfo
