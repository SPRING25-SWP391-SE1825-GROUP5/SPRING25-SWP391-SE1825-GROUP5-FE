import { Outlet } from 'react-router-dom'
import '../../views/Technician/technician.scss' // Import technician-specific styles

export default function TechnicianLayout() {
  return (
    <div className="technician-layout">
      <Outlet />
    </div>
  )
}
