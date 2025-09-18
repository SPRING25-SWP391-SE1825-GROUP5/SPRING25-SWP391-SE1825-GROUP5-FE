import { Outlet } from 'react-router-dom'
import '../../views/Staff/staff.scss' // Import staff-specific styles

export default function StaffLayout() {
  return (
    <div className="staff-layout">
      <Outlet />
    </div>
  )
}
