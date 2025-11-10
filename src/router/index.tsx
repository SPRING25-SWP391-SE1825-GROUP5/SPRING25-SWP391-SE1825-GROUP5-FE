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
import RequireEmailVerified from '@/components/routes/RequireEmailVerified'
import TimeSlotManagement from '../views/Admin/TimeSlotManagement';
import Cart from '@/views/Cart'

// Lazy pages
const SavartHomepage = lazy(() => import('@/views/SavartHomepage'))
const About = lazy(() => import('@/views/About'))
const Services = lazy(() => import('@/views/Services'))
const ProtectedContact = lazy(() => import('@/views/ProtectedContact'))
const Products = lazy(() => import('@/views/Products'))
const ProductDetail = lazy(() => import('@/views/ProductDetail'))
const Promotions = lazy(() => import('@/views/Promotions'))
const ServiceBookingView = lazy(() => import('@/views/ServiceBookingView'))
const BookingSuccess = lazy(() => import('@/views/BookingSuccess'))
const PaymentSuccess = lazy(() => import('@/views/PaymentSuccess'))
const PaymentCancel = lazy(() => import('@/views/PaymentCancel'))
const PaymentCallback = lazy(() => import('@/views/PaymentCallback'))
const OrderConfirmationPage = lazy(() => import('../views/OrderConfirmationPage'))
const Login = lazy(() => import('@/views/auth/Login'))
const Register = lazy(() => import('@/views/auth/Register'))
const ForgotPasswordRequest = lazy(() => import('../views/auth/ForgotPasswordRequest'))
const ForgotPasswordConfirm = lazy(() => import('../views/auth/ForgotPasswordConfirm'))
const EmailVerification = lazy(() => import('../views/auth/EmailVerification'))
const Dashboard = lazy(() => import('@/views/Dashboard'))
const Profile = lazy(() => import('@/views/Profile'))
const Users = lazy(() => import('@/views/Users'))
const MyVehicles = lazy(() => import('@/views/Customer/MyVehicles'))
const MaintenanceHistory = lazy(() => import('@/views/Customer/MaintenanceHistory'))
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
const FulfillmentOrchestration = lazy(() => import('@/views/Manager/FulfillmentOrchestration'))
const ChatDemo = lazy(() => import('@/views/ChatDemo'))
const AvatarIconDemo = lazy(() => import('@/views/AvatarIconDemo'))
const MapDemo = lazy(() => import('@/views/MapDemo'))
const NotFound = lazy(() => import('@/views/NotFound'))
const ServiceTemplateManagement = lazy(() => import('@/views/Admin/ServiceTemplateManagement'))
const SystemSettings = lazy(() => import('@/views/Admin/SystemSettings'))
const RagIngest = lazy(() => import('@/views/Admin/RagIngest'))

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
      { path: 'product/:id', element: suspense(<ProductDetail />) },
      { path: 'cart', element: suspense(<Cart />) },
      { path: 'promotions', element: suspense(<Promotions />) },
      { path: 'contact', element: suspense(<ProtectedContact />) },
      { path: 'booking', element: suspense(<ServiceBookingView />) },
      { path: 'confirm-order', element: <RequireEmailVerified>{suspense(<OrderConfirmationPage />)}</RequireEmailVerified> },
      { path: 'booking-success', element: suspense(<BookingSuccess />) },
      { path: 'payment-success', element: suspense(<PaymentSuccess />) },
      { path: 'payment-cancel', element: suspense(<PaymentCancel />) },
      { path: 'payment-callback', element: suspense(<PaymentCallback />) },
      { path: 'payment/result', element: suspense(<PaymentCallback />) },
      { path: 'payment/cancel', element: suspense(<PaymentCancel />) },
      { path: 'payment/success', element: suspense(<PaymentSuccess />) },
      { path: 'payment/error', element: suspense(<PaymentSuccess />) },
      { path: 'payment/failed', element: suspense(<PaymentSuccess />) },
      { path: 'payment/cancelled', element: suspense(<PaymentSuccess />) },
      { path: 'chat-demo', element: suspense(<ChatDemo />) },
      { path: 'avatar-demo', element: suspense(<AvatarIconDemo />) },
      { path: 'map-demo', element: suspense(<MapDemo />) },

      { path: 'dashboard', element: <RequireEmailVerified>{suspense(<Dashboard />)}</RequireEmailVerified> },
      { path: 'profile', element: <RequireEmailVerified>{suspense(<Profile />)}</RequireEmailVerified> },

      // Customer
      { path: 'my-vehicles', element: <RequireEmailVerified>{suspense(<MyVehicles />)}</RequireEmailVerified> },
      { path: 'maintenance-history', element: <RequireEmailVerified>{suspense(<MaintenanceHistory />)}</RequireEmailVerified> },

      { path: '*', element: suspense(<NotFound />) },
    ],
  },
  // Staff routes with staff layout (no global header)
  {
    path: '/staff',
    element: <StaffLayout />,
    children: [
      { index: true, element: suspense(<StaffDashboard />) },
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
      { path: 'fulfillment', element: suspense(<FulfillmentOrchestration />) },
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
      { path: 'rag-ingest', element: suspense(<RagIngest />) },
      { path: 'orders', element: suspense(<AdminDashboard />) },
      { path: 'bookings', element: suspense(<AdminDashboard />) },
      { path: 'reminders', element: suspense(<AdminDashboard />) },
      { path: 'feedback', element: suspense(<AdminDashboard />) },
      { path: 'users', element: suspense(<AdminDashboard />) },
      { path: 'staff', element: suspense(<AdminDashboard />) },
      { path: 'services', element: suspense(<AdminDashboard />) },
      { path: 'service-packages', element: suspense(<AdminDashboard />) },
      { path: 'parts-management', element: suspense(<AdminDashboard />) },
      { path: 'inventory', element: suspense(<AdminDashboard />) },
      { path: 'service-centers', element: suspense(<AdminDashboard />) },
      { path: 'vehicle-models', element: suspense(<AdminDashboard />) },
      { path: 'time-slots', element: <RequireAuth><AdminDashboard /></RequireAuth> },
      { path: 'maintenance-checklist', element: suspense(<AdminDashboard />) },
      { path: 'promotions', element: suspense(<AdminDashboard />) },
      { path: 'reports', element: suspense(<AdminDashboard />) },
      { path: 'settings', element: suspense(<AdminDashboard />) },
    ],
  },
  // Auth routes without header/footer
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: suspense(<Login />) },
      { path: 'register', element: suspense(<Register />) },
      { path: 'verify-email', element: suspense(<EmailVerification />) },
      { path: 'forgot-password', element: suspense(<ForgotPasswordRequest />) },
      { path: 'forgot-password/confirm', element: suspense(<ForgotPasswordConfirm />) },
    ],
  },
  // Catch-all route for 404
  {
    path: '*',
    element: suspense(<NotFound />),
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}

