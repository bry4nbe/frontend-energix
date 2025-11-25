// Mock de servicios de autenticación

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Establece el estado de autenticación
 * @param {boolean} value - Estado de autenticación
 */
export function setAuthenticated(value = true) {
    try {
        localStorage.setItem('isAuthenticated', String(value))
    } catch (e) {
        // Error silencioso - no es crítico para el funcionamiento
    }
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export function isAuthenticated() {
    try {
        return localStorage.getItem('isAuthenticated') === 'true'
    } catch (e) {
        return false
    }
}

/**
 * Cierra la sesión del usuario
 */
export function logout() {
    try {
        localStorage.removeItem('isAuthenticated')
    } catch (e) {
        // Error silencioso - no es crítico para el funcionamiento
    }
}

/**
 * Valida un código de registro
 * @param {string} code - Código a validar
 * @returns {Promise<{valid: boolean}>}
 */
export async function validateCode(code) {
    await sleep(600)

    // Simular error de red aleatoriamente (5% de probabilidad)
    if (Math.random() < 0.05) {
        throw { network: true, message: 'Error de conexión. Intenta nuevamente.' }
    }

    if (code === 'Energix2025') {
        return { valid: true }
    }

    throw { message: 'Código inválido' }
}

/**
 * Simula login de usuario
 * @param {Object} credentials - Email y password
 * @returns {Promise<{success: boolean, user: Object}>}
 */
export async function login(credentials) {
    await sleep(700)

    // Simular error de red aleatoriamente (5% de probabilidad)
    if (Math.random() < 0.05) {
        throw { network: true, message: 'Error de conexión. Intenta nuevamente.' }
    }

    // Validar credenciales mock
    if (credentials.email === 'test@ejemplo.com' && credentials.password === 'password') {
        return {
            success: true,
            user: {
                email: credentials.email,
                name: 'Usuario Test'
            }
        }
    }

    throw { message: 'Correo electrónico o contraseña incorrectos' }
}

/**
 * Registra un nuevo usuario (mock)
 * @param {Object} payload - Datos del usuario
 * @returns {Promise<{success: boolean, user: Object}>}
 */
export async function register(payload) {
    await sleep(700)

    // Simular error de red aleatoriamente (5% de probabilidad)
    if (Math.random() < 0.05) {
        throw { network: true, message: 'Error de conexión. Intenta nuevamente.' }
    }

    // Simular email ya registrado
    if (payload.email === 'already@taken.com') {
        throw { field: 'email', message: 'Correo ya en uso' }
    }

    // Validar código en el momento del registro
    if (payload.code !== 'Energix2025') {
        throw { field: 'code', message: 'Código inválido o expirado' }
    }

    // Registro exitoso
    return {
        success: true,
        user: {
            name: payload.name,
            email: payload.email
        }
    }
}
