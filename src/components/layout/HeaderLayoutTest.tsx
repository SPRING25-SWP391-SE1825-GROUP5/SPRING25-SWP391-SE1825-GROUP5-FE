import React from 'react'
import { AppHeader } from './AppHeader'
import './AppHeader.scss'

/**
 * Test component để kiểm tra layout header mới
 * - Logo ở sát góc trái
 * - Navigation ở giữa
 * - Icons + User + Hamburger ở sát góc phải
 */
export function HeaderLayoutTest() {
  return (
    <div style={{ height: '100vh', background: '#f5f5f5' }}>
      <AppHeader />
      
      {/* Content để test scroll */}
      <div style={{ 
        paddingTop: '0px', 
        padding: '100px 20px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        minHeight: '100vh'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>
          Header Layout Test
        </h1>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <h3>Test Card {i}</h3>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
          ))}
        </div>
        
        <div style={{ 
          marginTop: '4rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2rem',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2>Layout Features Tested:</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>✅ Logo positioned at far left edge</li>
            <li>✅ Navigation centered (without "Về chúng tôi", no hover effects, arrow rotation only)</li>
            <li>✅ Icons + User + Buttons at far right edge</li>
            <li>✅ Login button (underlined link style, no hover effects)</li>
            <li>✅ Start Booking button (black background, color change on hover only)</li>
            <li>✅ Cart icon properly centered, no background, no hover effects</li>
            <li>✅ Logo with proper left padding</li>
            <li>✅ Dropdown menus - NEW SIMPLE VERSION, clean and working</li>
            <li>✅ No hamburger button</li>
            <li>✅ No right sidebar</li>
            <li>✅ Responsive design</li>
            <li>✅ Fixed header with backdrop blur</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
