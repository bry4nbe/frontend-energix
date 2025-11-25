// Utilidades de validación para formularios

/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida que el texto no esté vacío
 * @param {string} value
 * @returns {boolean}
 */
export function isRequired(value) {
  return value && value.trim().length > 0
}

/**
 * Valida longitud mínima de contraseña
 * @param {string} password
 * @param {number} minLength
 * @returns {boolean}
 */
export function isValidPassword(password, minLength = 8) {
  return password && password.length >= minLength
}

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {boolean}
 */
export function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0
}

/**
 * Valida que solo contenga dígitos
 * @param {string} value
 * @returns {boolean}
 */
export function isNumeric(value) {
  if (!value) return false
  return /^\d+$/.test(value)
}

/**
 * Valida DNI (solo dígitos, mínimo 8)
 * @param {string} dni
 * @returns {boolean}
 */
export function isValidDNI(dni) {
  return isNumeric(dni) && dni.length >= 8
}

