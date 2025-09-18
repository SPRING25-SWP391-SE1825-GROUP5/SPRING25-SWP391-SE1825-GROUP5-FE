import React from 'react'
import './AppHeader.scss'

export default function HeaderDropdownTest() {
  return (
    <div style={{ padding: '100px 50px', background: '#f5f5f5' }}>
      <h2>Test Dropdown Menu Functionality</h2>
      
      <div style={{ 
        display: 'flex', 
        gap: '2rem', 
        background: 'white', 
        padding: '1rem',
        borderRadius: '8px',
        position: 'relative'
      }}>
        {/* Test Navigation Item with Dropdown */}
        <div className="nav-item-wrapper" style={{ position: 'relative' }}>
          <a href="#" className="nav-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            textDecoration: 'none',
            color: '#333',
            fontWeight: '500'
          }}>
            Dịch vụ
            <svg width="16" height="16" fill="currentColor" className="nav-arrow">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </a>
          
          {/* Dropdown Menu */}
          <div className="dropdown-menu">
            <div className="dropdown-content">
              <div className="dropdown-section">
                <h4>Bảo dưỡng định kỳ</h4>
                <a href="#">Bảo dưỡng cơ bản</a>
                <a href="#">Bảo dưỡng nâng cao</a>
                <a href="#">Bảo dưỡng cao cấp</a>
              </div>
              <div className="dropdown-section">
                <h4>Sửa chữa</h4>
                <a href="#">Sửa chữa động cơ</a>
                <a href="#">Sửa chữa pin</a>
                <a href="#">Hệ thống điện</a>
              </div>
              <div className="dropdown-section">
                <h4>Kiểm tra</h4>
                <a href="#">Kiểm tra an toàn</a>
                <a href="#">Kiểm tra hiệu suất</a>
              </div>
            </div>
          </div>
        </div>

        {/* Another test item */}
        <div className="nav-item-wrapper" style={{ position: 'relative' }}>
          <a href="#" className="nav-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            textDecoration: 'none',
            color: '#333',
            fontWeight: '500'
          }}>
            Sản phẩm
            <svg width="16" height="16" fill="currentColor" className="nav-arrow">
              <path d="M4 6l4 4 4-4"/>
            </svg>
          </a>
          
          <div className="dropdown-menu">
            <div className="dropdown-content">
              <div className="dropdown-section">
                <h4>Phụ tùng EV</h4>
                <a href="#">Pin xe điện</a>
                <a href="#">Bộ sạc</a>
                <a href="#">Động cơ điện</a>
              </div>
              <div className="dropdown-section">
                <h4>Phụ kiện</h4>
                <a href="#">Cáp sạc</a>
                <a href="#">Dụng cụ</a>
                <a href="#">Thiết bị an toàn</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px' }}>
        <h3>Instructions:</h3>
        <ul>
          <li>Hover over "Dịch vụ" or "Sản phẩm" to see dropdown</li>
          <li>Check if dropdown appears correctly</li>
          <li>Check if subcategories are visible</li>
          <li>Check if hover states work</li>
        </ul>
      </div>
    </div>
  )
}
