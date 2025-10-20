/**
 * Avatar Icon Demo Component
 * Component để test icon avatar Headphones
 */

import React from 'react'
import { Headphones } from 'lucide-react'

const AvatarIconDemo: React.FC = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Avatar Icon Demo - Headphones</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Icon Avatar được sử dụng</h2>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-50">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <Headphones size={32} />
              </div>
              <span className="text-lg font-medium">Headphones</span>
              <span className="text-sm text-gray-500 text-center">Biểu tượng hỗ trợ khách hàng</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium mb-3">Preview trong Chat Widget:</h3>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <Headphones size={24} />
            </div>
            <div>
              <p className="font-medium">Nhân viên hỗ trợ</p>
              <p className="text-sm text-gray-500">Đang sử dụng icon: Headphones</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">Tại sao chọn Headphones?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h3 className="font-medium mb-2">🎯 Ý nghĩa của icon:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Hỗ trợ khách hàng:</strong> Biểu tượng cho dịch vụ chăm sóc khách hàng</li>
              <li><strong>Lắng nghe:</strong> Thể hiện sự lắng nghe và thấu hiểu</li>
              <li><strong>Giao tiếp:</strong> Biểu tượng cho việc giao tiếp và tương tác</li>
              <li><strong>Chuyên nghiệp:</strong> Icon phù hợp với môi trường hỗ trợ</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">💡 Lợi ích:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Đồng bộ và nhất quán trong toàn bộ ứng dụng</li>
              <li>Dễ nhận biết và liên tưởng đến hỗ trợ</li>
              <li>Không phụ thuộc vào external images</li>
              <li>Load nhanh và không bị lỗi hiển thị</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-green-800">Các kích thước được sử dụng</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <Headphones size={12} />
            </div>
            <p className="text-sm font-medium">12px</p>
            <p className="text-xs text-gray-500">Mobile avatar</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <Headphones size={16} />
            </div>
            <p className="text-sm font-medium">16px</p>
            <p className="text-xs text-gray-500">Desktop avatar</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <Headphones size={20} />
            </div>
            <p className="text-sm font-medium">20px</p>
            <p className="text-xs text-gray-500">Header avatar</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
              <Headphones size={24} />
            </div>
            <p className="text-sm font-medium">24px</p>
            <p className="text-xs text-gray-500">Demo preview</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
        <pre>{`// Import icon
import { Headphones } from 'lucide-react'

// Sử dụng trong component
<div className="avatar-icon">
  <Headphones size={16} />
</div>

// CSS
.avatar-icon {
  width: 32px;
  height: 32px;
  background: var(--chat-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.avatar-icon:hover {
  background: var(--chat-primary-hover);
  transform: scale(1.05);
}`}</pre>
      </div>
    </div>
  )
}

export default AvatarIconDemo
