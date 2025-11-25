// loyalty/domain/model/rewards.entity.js

/**
 * Entidad que representa el registro de recompensas de un usuario
 */
export class Reward {
  constructor({
    id = null,
    userId = '',
    activeCode = '',
    expiresAt = null,
    lastGeneratedAt = null,
    uses = 0,
    maxUses = 5,
    rewardPoints = 50,
    totalPoints = 0
  } = {}) {
    this.id = id
    this.userId = userId
    this.activeCode = activeCode
    this.expiresAt = expiresAt
    this.lastGeneratedAt = lastGeneratedAt
    this.uses = uses
    this.maxUses = maxUses
    this.rewardPoints = rewardPoints
    this.totalPoints = totalPoints
  }

  /**
   * Verifica si el código está activo y no ha expirado
   * @returns {boolean}
   */
  isCodeActive() {
    if (!this.activeCode) return false
    if (!this.expiresAt) return true
    return new Date(this.expiresAt) > new Date()
  }

  /**
   * Verifica si puede usar el código (no ha alcanzado el límite de usos)
   * @returns {boolean}
   */
  canUseCode() {
    return this.isCodeActive() && this.uses < this.maxUses
  }

  /**
   * Incrementa el contador de usos del código
   */
  incrementUses() {
    if (this.canUseCode()) {
      this.uses++
    }
  }

  /**
   * Genera un nuevo código de referido
   * @param {string} code - El código generado
   * @param {Date} expiresAt - Fecha de expiración
   * @param {Date} lastGeneratedAt - Fecha de última generación
   */
  generateNewCode(code, expiresAt, lastGeneratedAt) {
    this.activeCode = code
    this.expiresAt = expiresAt
    this.lastGeneratedAt = lastGeneratedAt
    this.uses = 0
  }

  /**
   * Revoca el código activo
   */
  revokeCode() {
    this.activeCode = ''
    this.expiresAt = null
  }

  /**
   * Agrega puntos al total
   * @param {number} points - Puntos a agregar
   */
  addPoints(points) {
    this.totalPoints += points
  }

  /**
   * Convierte la entidad a un objeto plano para la API
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      activeCode: this.activeCode,
      expiresAt: this.expiresAt,
      lastGeneratedAt: this.lastGeneratedAt,
      uses: this.uses,
      maxUses: this.maxUses,
      rewardPoints: this.rewardPoints,
      totalPoints: this.totalPoints
    }
  }

  /**
   * Crea una instancia desde un objeto de la API
   * @param {Object} data - Datos de la API
   * @returns {Reward}
   */
  static fromJSON(data) {
    return new Reward(data)
  }
}

/**
 * Entidad que representa un referido
 */
export class Referral {
  constructor({
    id = null,
    referrerId = '',
    referredUserId = '',
    code = '',
    status = 'pending', // pending | activated | rewarded
    points = 0,
    date = new Date().toISOString(),
    user = ''
  } = {}) {
    this.id = id
    this.referrerId = referrerId
    this.referredUserId = referredUserId
    this.code = code
    this.status = status
    this.points = points
    this.date = date
    this.user = user
  }

  /**
   * Marca el referido como activado
   */
  activate() {
    if (this.status === 'pending') {
      this.status = 'activated'
    }
  }

  /**
   * Marca el referido como recompensado
   * @param {number} points - Puntos otorgados
   */
  reward(points) {
    if (this.status === 'activated') {
      this.status = 'rewarded'
      this.points = points
    }
  }

  /**
   * Verifica si el referido puede ser recompensado
   * @returns {boolean}
   */
  canBeRewarded() {
    return this.status === 'activated'
  }

  /**
   * Convierte la entidad a un objeto plano para la API
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      referrerId: this.referrerId,
      referredUserId: this.referredUserId,
      code: this.code,
      status: this.status,
      points: this.points,
      date: this.date,
      user: this.user
    }
  }

  /**
   * Crea una instancia desde un objeto de la API
   * @param {Object} data - Datos de la API
   * @returns {Referral}
   */
  static fromJSON(data) {
    return new Referral(data)
  }
}

