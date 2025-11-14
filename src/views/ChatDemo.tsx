/**
 * Chat Demo Component
 * Component để test chat widget functionality
 */

import React from 'react'
// import './ChatDemo.scss' // File không tồn tại

const ChatDemo: React.FC = () => {
  return (
    <div className="chat-demo__container">
      <div className="chat-demo__empty">
        <h1>Chat Demo</h1>
        <p>Tính năng trò chuyện đang được tích hợp với dữ liệu thật. Vui lòng quay lại sau khi dịch vụ hoàn tất.</p>
      </div>
    </div>
  )
}

export default ChatDemo
