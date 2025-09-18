import React, { useEffect } from 'react'

export default function DropdownDebug() {
  useEffect(() => {
    // Check all dropdown menus in DOM
    const checkDropdowns = () => {
      const dropdowns = document.querySelectorAll('.dropdown-menu')
      console.log('Found dropdowns:', dropdowns.length)
      
      dropdowns.forEach((dropdown, index) => {
        const styles = window.getComputedStyle(dropdown)
        console.log(`Dropdown ${index}:`, {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex,
          position: styles.position,
          overflow: styles.overflow
        })
        
        // Check parent overflow
        let parent = dropdown.parentElement
        while (parent && parent !== document.body) {
          const parentStyles = window.getComputedStyle(parent)
          if (parentStyles.overflow === 'hidden' || parentStyles.overflow === 'clip') {
            console.warn('Parent has overflow hidden:', parent.className, parentStyles.overflow)
          }
          parent = parent.parentElement
        }
      })
    }
    
    // Run check after a delay
    setTimeout(checkDropdowns, 1000)
    
    // Add event listener for hover
    const navItems = document.querySelectorAll('.nav-item-wrapper')
    navItems.forEach(item => {
      item.addEventListener('mouseenter', () => {
        console.log('Hovering nav item')
        setTimeout(checkDropdowns, 100)
      })
    })
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'black',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 999999
    }}>
      Check console for dropdown debug info
    </div>
  )
}
