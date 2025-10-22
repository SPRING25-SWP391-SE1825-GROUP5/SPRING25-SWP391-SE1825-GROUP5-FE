import { lazy, Suspense } from 'react'
import type { ReactElement } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import AppLayout from '@/components/layout/AppLayout'
import AuthLayout from '@/components/layout/AuthLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import TechnicianLayout from '@/components/layout/TechnicianLayout'
import StaffLayout from '@/components/layout/StaffLayout'
import ManagerLayout from '@/components/layout/ManagerLayout'
import RequireAuth from '@/components/routes/RequireAuth'

// Lazy pages
const SavartHomepage = lazy(() => import('@/views/SavartHomepage'))
const About = lazy(() => import('@/views/About'))
const Services = lazy(() => import('@/views/Services'))
const ProtectedContact = lazy(() => import('@/views/ProtectedContact'))
const Products = lazy(() => import('@/views/Products'))
const Promotions = lazy(() => import('@/views/Promotions'))
const ServiceBookingView = lazy(() => import('@/views/ServiceBookingView'))
const BookingSuccess = lazy(() => import('@/views/BookingSuccess'))
const PaymentSuccess = lazy(() => import('@/views/PaymentSuccess'))
const PaymentCancel = lazy(() => import('@/views/PaymentCancel'))
const PaymentQR = lazy(() => import('@/views/PaymentQR'))
const QRDebug = lazy(() => import('@/views/QRDebug'))
const PaymentCallback = lazy(() => import('@/views/PaymentCallback'))
const Login = lazy(() => import('@/views/auth/Login'))
const Register = lazy(() => import('@/views/auth/Register'))
const ForgotPasswordRequest = lazy(() => import('../views/auth/ForgotPasswordRequest'))
const ForgotPasswordConfirm = lazy(() => import('../views/auth/ForgotPasswordConfirm'))
const Dashboard = lazy(() => import('@/views/Dashboard'))
const Profile = lazy(() => import('@/views/Profile'))
const Users = lazy(() => import('@/views/Users'))
const MyVehicles = lazy(() => import('@/views/Customer/MyVehicles'))
const MaintenanceHistory = lazy(() => import('@/views/Customer/MaintenanceHistory'))
const StaffCustomers = lazy(() => import('@/views/Staff/Customers'))
const StaffAppointments = lazy(() => import('@/views/Staff/Appointments'))
const StaffTechnicianSchedule = lazy(() => import('@/components/staff/TechnicianSchedulePage'))
const StaffServiceOrders = lazy(() => import('@/views/Staff/ServiceOrders'))
const TechnicianWorkQueue = lazy(() => import('@/views/Technician/WorkQueue'))
const TechnicianChecklists = lazy(() => import('@/views/Technician/Checklists'))
const TechnicianPartsRequest = lazy(() => import('@/views/Technician/PartsRequest'))
const AdminDashboard = lazy(() => import('@/views/Admin/Dashboard'))
const AdminReports = lazy(() => import('@/views/Admin/Reports'))
const TechnicianDashboard = lazy(() => import('@/views/Technician/Dashboard'))
const StaffDashboard = lazy(() => import('@/views/Staff/Dashboard'))
const ManagerDashboard = lazy(() => import('@/views/Manager/Dashboard'))
const ChatDemo = lazy(() => import('@/views/ChatDemo'))
const AvatarIconDemo = lazy(() => import('@/views/AvatarIconDemo'))
const MapDemo = lazy(() => import('@/views/MapDemo'))
const NotFound = lazy(() => import('@/views/NotFound'))

const suspense = (el: ReactElement) => <Suspense fallback={<div />}>{el}</Suspense>

// Wrapper component để force re-render khi auth state thay đổi
const HomepageWrapper = () => {
  const user = useAppSelector((s) => s.auth.user)
  return <SavartHomepage key={user?.id || 'guest'} />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: suspense(<HomepageWrapper />) },
      { path: 'about', element: suspense(<About />) },
      { path: 'services', element: suspense(<Services />) },
      { path: 'products', element: suspense(<Products />) },
      { path: 'promotions', element: suspense(<Promotions />) },
      { path: 'contact', element: suspense(<ProtectedContact />) },
      { path: 'booking', element: suspense(<ServiceBookingView />) },
      { path: 'booking-success', element: suspense(<BookingSuccess />) },
      { path: 'payment-success', element: suspense(<PaymentSuccess />) },
      { path: 'payment-cancel', element: suspense(<PaymentCancel />) },
      { path: 'payment-qr', element: suspense(<PaymentQR />) },
      { path: 'qr-debug', element: suspense(<QRDebug />) },
      { path: 'payment-callback', element: suspense(<PaymentCallback />) },
      { path: 'chat-demo', element: suspense(<ChatDemo />) },
      { path: 'avatar-demo', element: suspense(<AvatarIconDemo />) },
      { path: 'map-demo', element: suspense(<MapDemo />) },

      { path: 'dashboard', element: <RequireAuth>{suspense(<Dashboard />)}</RequireAuth> },
      { path: 'profile', element: suspense(<Profile />) },

      // Customer
      { path: 'my-vehicles', element: <RequireAuth>{suspense(<MyVehicles />)}</RequireAuth> },
      { path: 'maintenance-history', element: <RequireAuth>{suspense(<MaintenanceHistory />)}</RequireAuth> },

      { path: '*', element: suspense(<NotFound />) },
    ],
  },
  // Staff routes with staff layout (no global header)
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: suspense(<StaffDashboard />) },
      { path: 'customers', element: suspense(<StaffCustomers />) },
      { path: 'appointments', element: suspense(<StaffAppointments />) },
      { path: 'service-orders', element: suspense(<StaffServiceOrders />) },
      { path: 'technician-schedule', element: suspense(<StaffTechnicianSchedule />) },
    ],
  },
  // Manager routes with manager layout (no global header)
  {
    path: '/manager',
    element: <ManagerLayout />,
    children: [
      { index: true, element: suspense(<ManagerDashboard />) },
    ],
  },
  // Technician routes with technician layout (no global header)
  {
    path: '/technician',
    element: <TechnicianLayout />,
    children: [
      { index: true, element: suspense(<TechnicianDashboard />) },
      { path: 'work-queue', element: suspense(<TechnicianWorkQueue />) },
      { path: 'checklists', element: suspense(<TechnicianChecklists />) },
      { path: 'parts-request', element: suspense(<TechnicianPartsRequest />) },
    ],
  },
  // Admin routes with admin layout (no global header)
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: suspense(<AdminDashboard />) },
      { path: 'users', element: suspense(<Users />) },
      { path: 'reports', element: suspense(<AdminReports />) },

    ],
  },
  // Auth routes without header/footer
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: suspense(<Login />) },
      { path: 'register', element: suspense(<Register />) },
      { path: 'forgot-password', element: suspense(<ForgotPasswordRequest />) },
      { path: 'forgot-password/confirm', element: suspense(<ForgotPasswordConfirm />) },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

