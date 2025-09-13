import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/SavartHomepage.vue'),
      meta: { public: true }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: { public: true }
    },
    {
      path: '/services',
      name: 'services',
      component: () => import('../views/ServicesView.vue'),
      meta: { public: true }
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../views/ContactView.vue'),
      meta: { public: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true, public: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { public: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },

    // Public information pages
    {
      path: '/booking-info',
      name: 'booking-info',
      component: () => import('../views/ServicesView.vue'),
      meta: { public: true }
    },
    {
      path: '/pricing',
      name: 'pricing',
      component: () => import('../views/ServicesView.vue'),
      meta: { public: true }
    },
    {
      path: '/faq',
      name: 'faq',
      component: () => import('../views/AboutView.vue'),
      meta: { public: true }
    },

    // Customer Routes (now public for demo)
    {
      path: '/booking',
      name: 'booking',
      component: () => import('../views/booking/BookingView.vue'),
      meta: { public: true }
    },
    {
      path: '/my-vehicles',
      name: 'my-vehicles',
      component: () => import('../views/Customer/MyVehiclesView.vue'),
      meta: { public: true }
    },
    {
      path: '/maintenance-history',
      name: 'maintenance-history',
      component: () => import('../views/Customer/MaintenanceHistoryView.vue'),
      meta: { public: true }
    },

    // Staff Routes (now public for demo)
    {
      path: '/customers',
      name: 'customers',
      component: () => import('../views/Staff/CustomersView.vue'),
      meta: { public: true }
    },
    {
      path: '/appointments',
      name: 'appointments',
      component: () => import('../views/Staff/AppointmentsView.vue'),
      meta: { public: true }
    },
    {
      path: '/service-orders',
      name: 'service-orders',
      component: () => import('../views/Staff/ServiceOrdersView.vue'),
      meta: { public: true }
    },

    // Technician Routes (now public for demo)
    {
      path: '/work-queue',
      name: 'work-queue',
      component: () => import('../views/Technician/WorkQueueView.vue'),
      meta: { public: true }
    },
    {
      path: '/checklists',
      name: 'checklists',
      component: () => import('../views/Technician/ChecklistsView.vue'),
      meta: { public: true }
    },
    {
      path: '/parts-request',
      name: 'parts-request',
      component: () => import('../views/Technician/PartsRequestView.vue'),
      meta: { public: true }
    },

    // Admin Routes (now public for demo)
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersView.vue'),
      meta: { public: true }
    },
    {
      path: '/parts-management',
      name: 'parts-management',
      component: () => import('../views/Admin/PartsManagementView.vue'),
      meta: { public: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('../views/Admin/ReportsView.vue'),
      meta: { public: true }
    },
    {
      path: '/staff-management',
      name: 'staff-management',
      component: () => import('../views/Admin/StaffManagementView.vue'),
      meta: { public: true }
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { public: true }
    }
  ]
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Allow public routes without authentication
  if (to.meta.public) {
    // For guest-only routes (like login), redirect if already authenticated
    if (to.meta.requiresGuest && authStore.isAuthenticated) {
      next({ name: 'dashboard' })
      return
    }
    next()
    return
  }

  // Initialize auth if not already done
  if (!authStore.user && authStore.token) {
    await authStore.getCurrentUser()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  // Check if route requires guest (not authenticated)
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  // Role-based access control (currently disabled for testing)
  // if (to.meta.requiresRole) {
  //   const userRole = authStore.user?.role || authStore.userRole
  //   if (userRole !== to.meta.requiresRole) {
  //     // Redirect to appropriate dashboard based on user role
  //     next({ name: 'dashboard' })
  //     return
  //   }
  // }

  next()
})

export default router
