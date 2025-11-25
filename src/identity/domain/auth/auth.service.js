import { AuthApi } from '@/identity/infrastructure/endpoint/auth.endpoint.js';
import { AlertsApi } from '@/alert/infrastructure/alerts.endpoint.js';

export function setAuthenticated(v = true){ localStorage.setItem('isAuthenticated', String(v)); }
export function isAuthenticated(){ return localStorage.getItem('isAuthenticated') === 'true'; }

export async function validateCodeService(code){
    return AuthApi.validateCode(code);
}

export async function registerService(payload){
    const { user, token } = await AuthApi.register(payload);
    localStorage.setItem('token', token || 'dev-token');
    localStorage.setItem('energix-user', JSON.stringify(user));
    localStorage.setItem('energix-plan', user.plan);
    setAuthenticated(true);

    // 🔥 CREAR ALERTA DE BIENVENIDA AUTOMÁTICAMENTE
    await AlertsApi.create({
        userId: user.id,
        type: 'info',
        badge: 'Bienvenida',
        message: '¡Registro completado exitosamente!',
        details: `Bienvenid@ ${user.name}! Tu plan es: ${user.plan.toUpperCase()}. Comienza a monitorear tu consumo energético.`,
        timestamp: new Date().toISOString(),
        isRead: false
    });

    return user;
}

export async function loginService({ email, password }){
    const { user, token } = await AuthApi.login({ email, password });
    localStorage.setItem('token', token || 'dev-token');
    localStorage.setItem('energix-user', JSON.stringify(user));
    localStorage.setItem('energix-plan', user.plan);
    setAuthenticated(true);

    // 🔥 CREAR ALERTA DE LOGIN AUTOMÁTICAMENTE
    await AlertsApi.create({
        userId: user.id,
        type: 'info',
        badge: 'Info',
        message: 'Sesión iniciada',
        details: `¡Bienvenid@ de vuelta, ${user.name}!`,
        timestamp: new Date().toISOString(),
        isRead: false
    });

    return user;
}

export function logoutService(){
    ['token','energix-user','energix-plan'].forEach(k => localStorage.removeItem(k));
    setAuthenticated(false);
}

/**
 * Cambia la contraseña del usuario autenticado
 * @param {number|string} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
export async function changePasswordService(userId, currentPassword, newPassword) {
    const response = await fetch(`/api/v1/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Error al actualizar la contraseña');
    }
    return;
}
