import { http } from '../../../shared/infrastructure/base-api.js';
import { rewardsEndpoint } from '../../../loyalty/infrastructure/rewards_endpoint.js';

const USERS = (import.meta.env.VITE_USERS_ENDPOINT_PATH || '/users').replace(/\/+$/, '');
const CODES = (import.meta.env.VITE_CODES_ENDPOINT_PATH || '/codes').replace(/\/+$/, '');
const CODES_CHECK = (import.meta.env.VITE_CODES_CHECK_PATH || '/codes').replace(/\/+$/, '');

// Función auxiliar: Devuelve el objeto de código (entry) o lanza un error
async function checkCode(code) {
    // Si no hay código, lo tratamos como plan 'basic' pero no lanzamos error en el check
    if (!code) return { plan: 'basic', entry: null, type: 'none' };

    // Primero verificar si es un código de referido (formato ENX-XXXXXX)
    if (code.startsWith('ENX-')) {
        const validation = await rewardsEndpoint.validateReferralCode(code);
        if (validation.valid) {
            // Es un código de referido válido, se asigna plan basic
            return { plan: 'basic', entry: { code, type: 'referral' }, type: 'referral' };
        }
        // Si no es válido, continuamos para verificar si es un código de dispositivo
    }

    // Verificar si es un código de dispositivo
    const list = await http.get(`${CODES_CHECK}?code=${encodeURIComponent(code)}`);
    const entry = Array.isArray(list) && list[0] ? list[0] : null;

    if (!entry) throw { message: 'Código inválido' };
    if (entry.used) throw { message: 'Este código ya fue usado' };

    // Aquí definimos el plan basado en el 'kind' para el registro
    const plan = entry.kind === 'plug' ? 'student' : entry.kind === 'sensor' ? 'family' : 'basic';

    return { plan, entry, type: 'device' };
}

export const AuthApi = {
    async validateCode(code) {
        const { entry, type } = await checkCode(code);
        return { ...entry, codeType: type };
    },

    async register({ name, lastName, email, password, dni, district, code }) {
        const { plan, entry, type } = await checkCode(code);
        const dup = await http.get(`${USERS}?email=${encodeURIComponent(email)}`);
        if (dup.length) throw { message: 'Ya existe un usuario con este correo' };

        const user = await http.post(USERS, { name, lastName, email, password, dni, district, plan });

        // Si es código de dispositivo, marcarlo como usado
        if (type === 'device' && entry) {
            await http.patch(`${CODES}/${entry.id}`, { used: true });
        }

        // Si es código de referido, registrar el referido
        if (type === 'referral' && code) {
            try {
                await rewardsEndpoint.useReferralCode(code, String(user.id), `${name} ${lastName}`);
            } catch (error) {
                console.error('Error registrando referido:', error);
                // No bloqueamos el registro si falla el registro del referido
            }
        }

        return { user, token: 'dev-token' };
    },

    async login({ email, password }) {
        const list = await http.get(`${USERS}?email=${encodeURIComponent(email)}`);
        if (!list.length) throw { message: 'Usuario no encontrado. Regístrate primero.' };

        const user = list[0];
        // ✅ Validar contraseña
        if (user.password !== password) {
            throw { message: 'Contraseña incorrecta.' };
        }

        return { user, token: 'dev-token' };
    }
};
