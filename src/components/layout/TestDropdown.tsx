import React from 'react'
import { Link } from 'react-router-dom'

export default function TestDropdown() {
  return (
    <div style={{ padding: '100px', background: '#f5f5f5' }}>
      <h2>Test Dropdown Visibility</h2>
      
      <div style={{ 
        position: 'relative',
        display: 'inline-block',
        marginTop: '50px'
      }}>
        <button style={{
          padding: '10px 20px',
          background: '#000',
          color: '#fff',
          border: 'none',
          cursor: 'pointer'
        }}>
          Hover Me to See Dropdown
        </button>
        
        <div className="test-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          background: 'red',
          color: 'white',
          padding: '20px',
          minWidth: '200px',
          display: 'none',
          zIndex: 999999
        }}>
          <h3>Dropdown Content</h3>
          <p>If you can see this red box, dropdown is working!</p>
          <Link to="/services">Test Link</Link>
        </div>
      </div>
      
      <style>{`
        .test-dropdown {
          display: none;
        }
        
        div:hover .test-dropdown {
          display: block !important;
        }
      `}</style>
    </div>
  )
}
