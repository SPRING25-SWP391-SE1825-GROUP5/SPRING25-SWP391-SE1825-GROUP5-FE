import { Outlet } from 'react-router-dom'
import '../../views/Admin/admin.scss' // Import admin-specific styles

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <Outlet />
    </div>
  )
}
