import type { ChatConversation, ChatMessage, ChatUser } from '@/types/chat'

// Mock users
export const mockUsers: ChatUser[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    role: 'customer',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  // Staff (màu xanh)
  {
    id: '4',
    name: 'Phạm Thị D',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    role: 'staff',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Võ Thị F',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    role: 'staff',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: '8',
    name: 'Đặng Thị H',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    role: 'staff',
    isOnline: false,
    lastSeen: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  // Technician (màu cam)
  {
    id: '3',
    name: 'Lê Văn C',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    role: 'technician',
    isOnline: false,
    lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: '5',
    name: 'Hoàng Văn E',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    role: 'technician',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: '7',
    name: 'Bùi Văn G',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    role: 'technician',
    isOnline: true,
    lastSeen: new Date().toISOString()
  },
  {
    id: '9',
    name: 'Ngô Văn I',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop&crop=face',
    role: 'technician',
    isOnline: false,
    lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
]

// Mock messages
export const mockMessages: Record<string, ChatMessage[]> = {
  'conv-2': [
    {
      id: 'msg-6',
      conversationId: 'conv-2',
      senderId: '3',
      senderName: 'Lê Văn C',
      content: 'Chào bạn! Tôi là kỹ thuật viên chuyên về xe điện. Có vấn đề gì cần hỗ trợ?',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    },
    {
      id: 'msg-7',
      conversationId: 'conv-2',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Xe tôi có tiếng kêu lạ khi chạy. Có thể kiểm tra được không?',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    },
    {
      id: 'msg-8',
      conversationId: 'conv-2',
      senderId: '3',
      senderName: 'Lê Văn C',
      content: 'Được, tôi sẽ kiểm tra hệ thống phanh và động cơ. Bạn có thể mang xe đến trung tâm không?',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    }
  ],
  'conv-3': [
    {
      id: 'msg-9',
      conversationId: 'conv-3',
      senderId: '4',
      senderName: 'Phạm Thị D',
      content: 'Chào bạn! Tôi có thể hỗ trợ về dịch vụ khách hàng.',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ],
  'conv-4': [
    {
      id: 'msg-10',
      conversationId: 'conv-4',
      senderId: '5',
      senderName: 'Hoàng Văn E',
      content: 'Xin chào! Tôi là kỹ thuật viên chuyên về pin xe điện. Có gì cần hỗ trợ?',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    },
    {
      id: 'msg-11',
      conversationId: 'conv-4',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Pin xe tôi sạc chậm hơn bình thường. Có vấn đề gì không?',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    },
    {
      id: 'msg-12',
      conversationId: 'conv-4',
      senderId: '5',
      senderName: 'Hoàng Văn E',
      content: 'Pin sạc chậm có thể do nhiều nguyên nhân. Bạn có thể mô tả chi tiết hơn không?',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    },
    {
      id: 'msg-13',
      conversationId: 'conv-4',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Trước đây sạc 80% trong 1 tiếng, giờ phải 2 tiếng mới được 70%. Nhiệt độ pin cũng nóng hơn.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ],
  'conv-5': [
    {
      id: 'msg-14',
      conversationId: 'conv-5',
      senderId: '4',
      senderName: 'Phạm Thị D',
      content: 'Chào bạn! Tôi có thể hỗ trợ về dịch vụ khách hàng. Có gì cần giúp không?',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    },
    {
      id: 'msg-15',
      conversationId: 'conv-5',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Tôi muốn hỏi về chính sách bảo hành xe điện.',
      timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    },
    {
      id: 'msg-16',
      conversationId: 'conv-5',
      senderId: '4',
      senderName: 'Phạm Thị D',
      content: 'Chúng tôi có chính sách bảo hành 3 năm cho xe điện. Bạn có thể xem chi tiết tại: https://example.com/warranty',
      timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    },
    {
      id: 'msg-17',
      conversationId: 'conv-5',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Cảm ơn bạn! Tôi sẽ xem thông tin này.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: true
    }
  ],
  // Staff conversations (màu xanh)
  'conv-6': [
    {
      id: 'msg-18',
      conversationId: 'conv-6',
      senderId: '6',
      senderName: 'Võ Thị F',
      content: 'Xin chào! Tôi là nhân viên hỗ trợ khách hàng. Có gì tôi có thể giúp bạn?',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    },
    {
      id: 'msg-19',
      conversationId: 'conv-6',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Tôi muốn hỏi về dịch vụ sửa chữa xe điện.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ],
  'conv-7': [
    {
      id: 'msg-20',
      conversationId: 'conv-7',
      senderId: '8',
      senderName: 'Đặng Thị H',
      content: 'Chào bạn! Tôi có thể hỗ trợ về dịch vụ khách hàng. Cần giúp gì không?',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ],
  // Technician conversations (màu cam)
  'conv-8': [
    {
      id: 'msg-21',
      conversationId: 'conv-8',
      senderId: '7',
      senderName: 'Bùi Văn G',
      content: 'Chào bạn! Tôi là kỹ thuật viên chuyên về hệ thống điện. Có vấn đề gì cần hỗ trợ?',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    },
    {
      id: 'msg-22',
      conversationId: 'conv-8',
      senderId: '1',
      senderName: 'Nguyễn Văn A',
      content: 'Xe tôi có vấn đề về hệ thống sạc. Có thể kiểm tra không?',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ],
  'conv-9': [
    {
      id: 'msg-23',
      conversationId: 'conv-9',
      senderId: '9',
      senderName: 'Ngô Văn I',
      content: 'Xin chào! Tôi là kỹ thuật viên chuyên về động cơ xe điện. Cần hỗ trợ gì?',
      timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ],
  // Thêm conversations mới để có đủ cả technician và staff
  'conv-11': [
    {
      id: 'msg-25',
      conversationId: 'conv-11',
      senderId: '3',
      senderName: 'Lê Văn C',
      content: 'Xin chào! Tôi là kỹ thuật viên chuyên về hệ thống phanh. Cần kiểm tra gì?',
      timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
      type: 'text',
      isRead: false
    }
  ]
}

// Mock conversations - Sắp xếp theo thời gian mới nhất
export const mockConversations: ChatConversation[] = [
  // Technician conversations (màu cam) - Mới nhất
  {
    id: 'conv-9',
    participants: [mockUsers[0], mockUsers[7]], // Nguyễn Văn A & Ngô Văn I (Technician)
    lastMessage: mockMessages['conv-9'][mockMessages['conv-9'].length - 1],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-8',
    participants: [mockUsers[0], mockUsers[5]], // Nguyễn Văn A & Bùi Văn G (Technician)
    lastMessage: mockMessages['conv-8'][mockMessages['conv-8'].length - 1],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-4',
    participants: [mockUsers[0], mockUsers[3]], // Nguyễn Văn A & Hoàng Văn E (Technician)
    lastMessage: mockMessages['conv-4'][mockMessages['conv-4'].length - 1],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-2',
    participants: [mockUsers[0], mockUsers[1]], // Nguyễn Văn A & Lê Văn C (Technician)
    lastMessage: mockMessages['conv-2'][mockMessages['conv-2'].length - 1],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  // Staff conversations (màu xanh)
  {
    id: 'conv-7',
    participants: [mockUsers[0], mockUsers[6]], // Nguyễn Văn A & Đặng Thị H (Staff)
    lastMessage: mockMessages['conv-7'][mockMessages['conv-7'].length - 1],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-6',
    participants: [mockUsers[0], mockUsers[4]], // Nguyễn Văn A & Võ Thị F (Staff)
    lastMessage: mockMessages['conv-6'][mockMessages['conv-6'].length - 1],
    unreadCount: 2,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-3',
    participants: [mockUsers[0], mockUsers[2]], // Nguyễn Văn A & Phạm Thị D (Staff)
    lastMessage: mockMessages['conv-3'][mockMessages['conv-3'].length - 1],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-5',
    participants: [mockUsers[0], mockUsers[2]], // Nguyễn Văn A & Phạm Thị D (Staff - conversation khác)
    lastMessage: mockMessages['conv-5'][mockMessages['conv-5'].length - 1],
    unreadCount: 0,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  },
  {
    id: 'conv-11',
    participants: [mockUsers[0], mockUsers[1]], // Nguyễn Văn A & Lê Văn C (Technician)
    lastMessage: mockMessages['conv-11'][mockMessages['conv-11'].length - 1],
    unreadCount: 1,
    createdAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    isPinned: false,
    isArchived: false
  }
]

// Mock available staff
export const mockAvailableStaff: ChatUser[] = [
  mockUsers[1], // Phạm Thị D (Staff)
  mockUsers[2], // Võ Thị F (Staff)
  mockUsers[3], // Đặng Thị H (Staff)
  mockUsers[4], // Lê Văn C (Technician)
  mockUsers[5], // Hoàng Văn E (Technician)
  mockUsers[6], // Bùi Văn G (Technician)
  mockUsers[7]  // Ngô Văn I (Technician)
]

// Mock notifications
export const mockNotifications = [
  {
    id: 'notif-1',
    type: 'message' as const,
    title: 'Tin nhắn mới',
    message: 'Phạm Thị D đã gửi tin nhắn',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isRead: false,
    conversationId: 'conv-3'
  }
]
