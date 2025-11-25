import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/identity/domain/auth/auth.service'

const getUserPlan = () => {
    try {
        // 'energix-plan' se guarda en auth.service.js durante el registro/login
        return localStorage.getItem('energix-plan') || 'basic';
    } catch (e) {
        // En caso de error de acceso al storage
        return 'basic';
    }
}

/**
 * Mapea el plan guardado al nombre de la ruta.
 * @param {string} plan - El plan del usuario ('student', 'family', 'basic').
 * @returns {string} Nombre de la ruta del dashboard.
 */
const getDashboardRouteName = (plan) => {
    switch (plan.toLowerCase()) {
        case 'student':
            return 'dashboard-student';
        case 'family':
            return 'dashboard-family';
        case 'basic':
        default:
            return 'dashboard-basic';
    }
}

// --- Lazy load para rutas privadas ---
const DashboardFamily = () => import('../dashboard/presentation/views/dashboard.vue')
const DashboardStudent = () => import('../dashboard/presentation/views/dashboard-student.vue')
const DashboardBasic = () => import('../dashboard/presentation/views/dashboard-basic.vue')

const Alerts = () => import('../alert/presentation/views/alerts.vue')
const ConfigurationBasic = () => import('../personalization/presentation/views/configuration-basic.vue')
const Configuration = () => import('../personalization/presentation/views/configuration.vue')
const NotFound = () => import('../shared/presentation/components/notfound.vue')
const Subscriptions = () => import('../loyalty/presentation/views/subscriptions.vue')

// Eager load para rutas críticas de autenticación
import Login from '../identity/presentation/views/Login.vue'
import Register from '../identity/presentation/views/Register.vue'

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL || '/'),
    routes: [
        {
            path: '/subscriptions',
            name: 'subscriptions',
            component: Subscriptions,
            meta: { title: 'Suscripciones' } },
        {
            path: '/',
            redirect: () => {
                // Redirige al login o al dashboard dinámico principal
                return isAuthenticated() ? '/dashboard' : '/login'
            }
        },

        {
            path: '/login',
            name: 'login',
            component: Login,
            meta: { title: 'Sign In', public: true }
        },

        {
            path: '/recompensas',
            name: 'rewards',
            component: () => import('../loyalty/presentation/views/rewards.vue'),
            meta: { title: 'Recompensas' }
        },

        {
            path: '/register',
            name: 'register',
            component: Register,
            meta: { title: 'Sign Up', public: true }
        },

        // RUTA DINÁMICA DE DASHBOARD (El nombre 'dashboard' actúa como proxy)
        {
            path: '/dashboard',
            name: 'dashboard',
            redirect: () => {
                const plan = getUserPlan();
                const routeName = getDashboardRouteName(plan);
                return { name: routeName };
            },
            meta: { title: 'Dashboard', requiresAuth: true }
        },

        // Rutas específicas de los dashboards
        {
            path: '/dashboard/family',
            name: 'dashboard-family',
            component: DashboardFamily,
            meta: { title: 'Dashboard Familiar', requiresAuth: true }
        },
        {
            path: '/dashboard/student',
            name: 'dashboard-student',
            component: DashboardStudent,
            meta: { title: 'Dashboard Estudiante', requiresAuth: true }
        },
        {
            path: '/dashboard/basic',
            name: 'dashboard-basic',
            component: DashboardBasic,
            meta: { title: 'Dashboard Básico', requiresAuth: true }
        },

        {
            path: '/profile',
            redirect: '/dashboard'
        },
        {
            path: '/alerts',
            name: 'alerts',
            component: Alerts,
            meta: { title: 'Alerts', requiresAuth: true }
        },
        {
            path: '/devices',
            name: 'devices',
            component: () => import('@/device/presentation/views/devices.vue'),
            meta: { title: 'Mis Dispositivos', requiresAuth: true }
        },
        // Redirección dinámica para configuración según el plan
        {
            path: '/configuration',
            redirect: () => {
                const plan = (localStorage.getItem('energix-plan') || 'basic').toLowerCase();
                if (plan === 'basic') {
                    return { name: 'configuration-basic' };
                } else {
                    return { name: 'configuration-advanced' };
                }
            },
            meta: { title: 'Configuration', requiresAuth: true }
        },
        {
            path: '/configuration/basic',
            name: 'configuration-basic',
            component: ConfigurationBasic,
            meta: { title: 'Configuración Básica', requiresAuth: true }
        },
        {
            path: '/configuration/advanced',
            name: 'configuration-advanced',
            component: Configuration,
            meta: { title: 'Configuración Avanzada', requiresAuth: true }
        },

        {
            path: '/:pathMatch(.*)*',
            name: '404',
            component: NotFound,
            meta: { title: 'Not Found' }
        }
    ],
    scrollBehavior() {
        return { top: 0 }
    }
})

router.beforeEach((to, from, next) => {
    const requiresAuth = to.meta?.requiresAuth === true
    const isPublic = to.meta?.public === true
    const logged = isAuthenticated()

    if (requiresAuth && !logged) {
        return next({ name: 'login' })
    }

    if (isPublic && logged) {
        // CORRECCIÓN: Usamos el nombre de ruta genérico 'dashboard'
        // que ya tiene el redirect configurado para ir al plan correcto.
        return next({ name: 'dashboard' })
    }

    next()
})

router.afterEach((to) => {
    document.title = `Energix · ${to.meta?.title || 'App'}`
})

export default router