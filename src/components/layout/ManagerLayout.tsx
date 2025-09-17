import { Outlet } from 'react-router-dom'
import '../../views/Manager/manager.scss' // Import manager-specific styles

export default function ManagerLayout() {
  return (
    <div className="manager-layout">
      <Outlet />
    </div>
  )
}
