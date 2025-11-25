// src/personalization/infrastructure/personalization.endpoint.js
import { http } from '@/shared/infrastructure/base-api.js'

export const PersonalizationAPI = {
  async getByUserId(userId) {
    const response = await http.get(`/personalization?userId=${userId}`)
    return response[0] || null
  },

  async create(data) {
    return await http.post('/personalization', data)
  },

  async update(id, data, userId) {
    const fullData = { id, userId, ...data }
    await http.put(`/personalization/${id}`, fullData)

    await new Promise(resolve => setTimeout(resolve, 100))

    return await this.getByUserId(userId)
  },

  async saveUserPersonalization(userId, data) {
    const existing = await this.getByUserId(userId)

    if (existing) {
      return this.update(existing.id, data, userId)
    } else {
      return this.create({ userId, ...data })
    }
  }
}

