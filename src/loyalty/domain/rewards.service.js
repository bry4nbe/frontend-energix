// loyalty/domain/rewards.service.js
import { Reward, Referral } from './model/rewards.entity.js'

/**
 * Servicio de dominio para la lógica de negocio de recompensas
 */
export class RewardsService {
  /**
   * Genera un código de referido único
   * @returns {string}
   */
  static generateReferralCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'ENX-'
    for (let i = 0; i < 6; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return code
  }

  /**
   * Calcula la fecha de expiración de un código
   * @param {number} hoursFromNow - Horas desde ahora
   * @returns {Date}
   */
  static calculateExpirationDate(hoursFromNow = 24) {
    const now = new Date()
    return new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000)
  }

  /**
   * Verifica si un usuario puede generar un nuevo código
   * @param {Reward} reward - Registro de recompensas del usuario
   * @param {number} cooldownHours - Horas de cooldown
   * @returns {{canGenerate: boolean, remainingTime?: string}}
   */
  static canGenerateNewCode(reward, cooldownHours = 24) {
    // Si ya tiene un código activo, no puede generar otro
    if (reward && reward.isCodeActive()) {
      return { canGenerate: false, reason: 'active_code_exists' }
    }

    // Si nunca ha generado un código, puede hacerlo
    if (!reward || !reward.lastGeneratedAt) {
      return { canGenerate: true }
    }

    // Verificar cooldown
    const lastGenerated = new Date(reward.lastGeneratedAt)
    const now = new Date()
    const diffHours = (now - lastGenerated) / (1000 * 60 * 60)

    if (diffHours < cooldownHours) {
      const remainingHours = cooldownHours - diffHours
      const hours = Math.floor(remainingHours)
      const minutes = Math.round((remainingHours - hours) * 60)
      return {
        canGenerate: false,
        reason: 'cooldown',
        remainingTime: `${hours}h ${minutes}m`
      }
    }

    return { canGenerate: true }
  }

  /**
   * Calcula el nivel basado en los puntos
   * @param {number} points - Puntos totales
   * @returns {{level: number, progress: number, pointsToNextLevel: number}}
   */
  static calculateLevel(points) {
    const pointsPerLevel = 200
    const level = Math.floor(points / pointsPerLevel) + 1
    const currentLevelPoints = points % pointsPerLevel
    const progress = (currentLevelPoints / pointsPerLevel) * 100

    return {
      level,
      progress,
      pointsToNextLevel: pointsPerLevel - currentLevelPoints
    }
  }

  /**
   * Valida un código de referido
   * @param {string} code - Código a validar
   * @returns {boolean}
   */
  static isValidReferralCode(code) {
    if (!code) return false
    // Formato esperado: ENX-XXXXXX (6 caracteres alfanuméricos)
    const pattern = /^ENX-[A-Z0-9]{6}$/
    return pattern.test(code)
  }

  /**
   * Calcula las estadísticas de referidos
   * @param {Referral[]} referrals - Lista de referidos
   * @returns {{total: number, pending: number, activated: number, rewarded: number, totalPoints: number}}
   */
  static calculateReferralStats(referrals) {
    return {
      total: referrals.length,
      pending: referrals.filter(r => r.status === 'pending').length,
      activated: referrals.filter(r => r.status === 'activated').length,
      rewarded: referrals.filter(r => r.status === 'rewarded').length,
      totalPoints: referrals.reduce((sum, r) => sum + (r.points || 0), 0)
    }
  }
}

