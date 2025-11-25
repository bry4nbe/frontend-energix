// loyalty/infrastructure/rewards_endpoint.js
import { http } from '../../shared/infrastructure/base-api.js'
import { Reward, Referral } from '../domain/model/rewards.entity.js'
import { RewardsService } from '../domain/rewards.service.js'

const REWARDS_BASE = '/rewards'
const REFERRALS_BASE = '/referrals'

export const rewardsEndpoint = {
  /**
   * Genera un código de referido para un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Reward>}
   */
  async generateCode(userId) {
    // Primero verificar si ya existe un reward para este usuario
    const existing = await http.get(`${REWARDS_BASE}?userId=${userId}`)

    const now = new Date()
    const expiresAt = RewardsService.calculateExpirationDate(24).toISOString()
    const lastGeneratedAt = now.toISOString()
    const activeCode = RewardsService.generateReferralCode()

    let reward
    if (existing && existing.length > 0) {
      // Actualizar el existente
      reward = Reward.fromJSON(existing[0])
      reward.generateNewCode(activeCode, expiresAt, lastGeneratedAt)
      const updated = await http.put(`${REWARDS_BASE}/${reward.id}`, reward.toJSON())
      return Reward.fromJSON(updated)
    } else {
      // Crear nuevo
      reward = new Reward({
        userId,
        activeCode,
        expiresAt,
        lastGeneratedAt,
        uses: 0,
        maxUses: 5,
        rewardPoints: 50,
        totalPoints: 0
      })
      const created = await http.post(REWARDS_BASE, reward.toJSON())
      return Reward.fromJSON(created)
    }
  },

  /**
   * Obtiene el registro de rewards de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Reward>}
   */
  async getUserRewards(userId) {
    const results = await http.get(`${REWARDS_BASE}?userId=${userId}`)
    if (results && results.length > 0) {
      return Reward.fromJSON(results[0])
    }
    const error = new Error('not_found')
    error.status = 404
    throw error
  },

  /**
   * Obtiene todos los referidos de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Referral[]>}
   */
  async getReferrals(userId) {
    const results = await http.get(`${REFERRALS_BASE}?referrerId=${userId}`)
    return results.map(r => Referral.fromJSON(r))
  },

  /**
   * Revoca el código activo de un usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Reward>}
   */
  async revokeCode(userId) {
    const existing = await http.get(`${REWARDS_BASE}?userId=${userId}`)
    if (existing && existing.length > 0) {
      const reward = Reward.fromJSON(existing[0])
      reward.revokeCode()
      const updated = await http.put(`${REWARDS_BASE}/${reward.id}`, reward.toJSON())
      return Reward.fromJSON(updated)
    }
  },

  /**
   * Marca un referido como recompensado y actualiza los puntos del referidor
   * @param {string} referralId - ID del referido
   * @returns {Promise<{referral: Referral, reward: Reward}>}
   */
  async rewardReferral(referralId) {
    // Obtener el referido
    const referralData = await http.get(`${REFERRALS_BASE}/${referralId}`)
    const referral = Referral.fromJSON(referralData)

    if (!referral.canBeRewarded()) {
      throw new Error('Referral cannot be rewarded')
    }

    // Marcar como recompensado
    referral.reward(50)
    const updatedReferral = await http.put(`${REFERRALS_BASE}/${referralId}`, referral.toJSON())

    // Actualizar puntos del referidor
    const rewardResults = await http.get(`${REWARDS_BASE}?userId=${referral.referrerId}`)
    if (rewardResults && rewardResults.length > 0) {
      const reward = Reward.fromJSON(rewardResults[0])
      reward.addPoints(50)
      const updatedReward = await http.put(`${REWARDS_BASE}/${reward.id}`, reward.toJSON())

      return {
        referral: Referral.fromJSON(updatedReferral),
        reward: Reward.fromJSON(updatedReward)
      }
    }

    return {
      referral: Referral.fromJSON(updatedReferral),
      reward: null
    }
  },

  /**
   * Valida y usa un código de referido (para el proceso de registro)
   * @param {string} code - Código de referido
   * @param {string} newUserId - ID del nuevo usuario
   * @param {string} newUserName - Nombre del nuevo usuario
   * @returns {Promise<Referral>}
   */
  async useReferralCode(code, newUserId, newUserName) {
    // Buscar el reward con ese código activo
    const rewardResults = await http.get(`${REWARDS_BASE}?activeCode=${code}`)

    if (!rewardResults || rewardResults.length === 0) {
      throw new Error('Invalid or expired referral code')
    }

    const reward = Reward.fromJSON(rewardResults[0])

    if (!reward.canUseCode()) {
      throw new Error('Referral code cannot be used (expired or max uses reached)')
    }

    // Incrementar usos del código
    reward.incrementUses()
    await http.put(`${REWARDS_BASE}/${reward.id}`, reward.toJSON())

    // Crear el registro de referido
    const referral = new Referral({
      referrerId: reward.userId,
      referredUserId: newUserId,
      code: code,
      status: 'activated', // Se marca como activado automáticamente
      points: 0,
      date: new Date().toISOString(),
      user: newUserName
    })

    const created = await http.post(REFERRALS_BASE, referral.toJSON())
    return Referral.fromJSON(created)
  },

  /**
   * Verifica si un código de referido es válido
   * @param {string} code - Código a verificar
   * @returns {Promise<{valid: boolean, message?: string}>}
   */
  async validateReferralCode(code) {
    if (!RewardsService.isValidReferralCode(code)) {
      return { valid: false, message: 'Invalid code format' }
    }

    try {
      const rewardResults = await http.get(`${REWARDS_BASE}?activeCode=${code}`)

      if (!rewardResults || rewardResults.length === 0) {
        return { valid: false, message: 'Code not found' }
      }

      const reward = Reward.fromJSON(rewardResults[0])

      if (!reward.canUseCode()) {
        return { valid: false, message: 'Code expired or max uses reached' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, message: 'Error validating code' }
    }
  }
}


