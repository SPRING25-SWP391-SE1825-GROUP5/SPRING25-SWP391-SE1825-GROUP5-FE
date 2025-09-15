import { lazy, Suspense } from 'react'
import type { ReactElement } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import RequireAuth from '@/components/routes/RequireAuth'

// Lazy pages
const SavartHomepage = lazy(() => import('@/views/SavartHomepage'))
const About = lazy(() => import('@/views/About'))
const Services = lazy(() => import('@/views/Services'))
const Contact = lazy(() => import('@/views/Contact'))
const Booking = lazy(() => import('@/views/booking/Booking'))
const Login = lazy(() => import('@/views/auth/Login'))
const Register = lazy(() => import('@/views/auth/Register'))
const Dashboard = lazy(() => import('@/views/Dashboard'))
const Profile = lazy(() => import('@/views/Profile'))
const Users = lazy(() => import('@/views/Users'))
const MyVehicles = lazy(() => import('@/views/Customer/MyVehicles'))
const MaintenanceHistory = lazy(() => import('@/views/Customer/MaintenanceHistory'))
const StaffCustomers = lazy(() => import('@/views/Staff/Customers'))
const StaffAppointments = lazy(() => import('@/views/Staff/Appointments'))
const StaffServiceOrders = lazy(() => import('@/views/Staff/ServiceOrders'))
const TechnicianWorkQueue = lazy(() => import('@/views/Technician/WorkQueue'))
const TechnicianChecklists = lazy(() => import('@/views/Technician/Checklists'))
const TechnicianPartsRequest = lazy(() => import('@/views/Technician/PartsRequest'))
const AdminPartsManagement = lazy(() => import('@/views/Admin/PartsManagement'))
const AdminReports = lazy(() => import('@/views/Admin/Reports'))
const AdminStaffManagement = lazy(() => import('@/views/Admin/StaffManagement'))
const NotFound = lazy(() => import('@/views/NotFound'))

const suspense = (el: ReactElement) => <Suspense fallback={<div />}>{el}</Suspense>

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: suspense(<SavartHomepage />) },
      { path: 'about', element: suspense(<About />) },
      { path: 'services', element: suspense(<Services />) },
      { path: 'contact', element: suspense(<Contact />) },
      { path: 'booking', element: suspense(<Booking />) },
      { path: 'login', element: suspense(<Login />) },
      { path: 'register', element: suspense(<Register />) },

      { path: 'dashboard', element: <RequireAuth>{suspense(<Dashboard />)}</RequireAuth> },
      { path: 'profile', element: <RequireAuth>{suspense(<Profile />)}</RequireAuth> },

      // Customer
      { path: 'my-vehicles', element: <RequireAuth>{suspense(<MyVehicles />)}</RequireAuth> },
      { path: 'maintenance-history', element: <RequireAuth>{suspense(<MaintenanceHistory />)}</RequireAuth> },

      // Staff
      { path: 'customers', element: <RequireAuth>{suspense(<StaffCustomers />)}</RequireAuth> },
      { path: 'appointments', element: <RequireAuth>{suspense(<StaffAppointments />)}</RequireAuth> },
      { path: 'service-orders', element: <RequireAuth>{suspense(<StaffServiceOrders />)}</RequireAuth> },

      // Technician
      { path: 'work-queue', element: <RequireAuth>{suspense(<TechnicianWorkQueue />)}</RequireAuth> },
      { path: 'checklists', element: <RequireAuth>{suspense(<TechnicianChecklists />)}</RequireAuth> },
      { path: 'parts-request', element: <RequireAuth>{suspense(<TechnicianPartsRequest />)}</RequireAuth> },

      // Admin
      { path: 'users', element: <RequireAuth>{suspense(<Users />)}</RequireAuth> },
      { path: 'parts-management', element: <RequireAuth>{suspense(<AdminPartsManagement />)}</RequireAuth> },
      { path: 'reports', element: <RequireAuth>{suspense(<AdminReports />)}</RequireAuth> },
      { path: 'staff-management', element: <RequireAuth>{suspense(<AdminStaffManagement />)}</RequireAuth> },

      { path: '*', element: suspense(<NotFound />) },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

