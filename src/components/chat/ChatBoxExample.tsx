import React, { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import ChatBox from './ChatBox'

const ChatBoxExample: React.FC = () => {
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsChatBoxOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#004030',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0, 64, 48, 0.3)',
          zIndex: 9999,
          transition: 'all 0.3s ease'
        }}
        title="Mở chat hỗ trợ"
      >
        <MessageCircle size={24} />
      </button>

      <ChatBox
        isOpen={isChatBoxOpen}
        onClose={() => setIsChatBoxOpen(false)}
      />
    </>
  )
}

export default ChatBoxExample

