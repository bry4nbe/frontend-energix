import { http } from '@/shared/infrastructure/base-api.js'

// Base URLs (compatibles con json-server o tu backend real)
const DEVICES = (import.meta.env.VITE_DEVICES_ENDPOINT_PATH || '/devices').replace(/\/+$/, '')
const ZONES = (import.meta.env.VITE_ZONES_ENDPOINT_PATH || '/zones').replace(/\/+$/, '')

/* ==========================================================
   🔔 SISTEMA DE EVENTOS GLOBALES DE DISPOSITIVOS
   Permite que los dashboards reaccionen cuando hay cambios
   ========================================================== */
const listeners = new Set()

/**
 * Suscribe un callback a los cambios en dispositivos o zonas.
 * @param {Function} callback - función a ejecutar cuando haya un cambio.
 * @returns {Function} - función para desuscribirse.
 */
export function onDeviceChange(callback) {
    listeners.add(callback)
    return () => listeners.delete(callback)
}

/** Notifica a todos los listeners que hubo un cambio */
function emitDeviceChange() {
    listeners.forEach(cb => {
        try { cb() } catch (err) { console.error('Error en listener de dispositivo:', err) }
    })
}

/* ==========================================================
   📡 API DE DISPOSITIVOS Y ZONAS
   ========================================================== */
export const DevicesApi = {
    // ===== Devices =====
    async getByUserId(userId) {
        return await http.get(`${DEVICES}?userId=${userId}`)
    },

    async create(userId, payload) {
        const now = new Date().toISOString()
        const result = await http.post(DEVICES, {
            userId,
            linkedAt: now,
            status: 'off',
            online: false,
            zoneId: null,
            ...payload,
        })
        emitDeviceChange()
        return result
    },

    async update(id, patch) {
        const result = await http.patch(`${DEVICES}/${id}`, patch)
        emitDeviceChange()
        return result
    },

    async remove(id) {
        const result = await http.delete(`${DEVICES}/${id}`)
        emitDeviceChange()
        return result
    },

    // ===== Zones (para plan familiar, pero usable por todos) =====
    async getZones(userId) {
        return await http.get(`${ZONES}?userId=${userId}`)
    },

    async createZone(userId, name) {
        const result = await http.post(ZONES, { userId, name })
        emitDeviceChange()
        return result
    },

    async renameZone(zoneId, name) {
        const result = await http.patch(`${ZONES}/${zoneId}`, { name })
        emitDeviceChange()
        return result
    },

    async deleteZone(zoneId) {
        const result = await http.delete(`${ZONES}/${zoneId}`)
        emitDeviceChange()
        return result
    },

    async setDeviceZone(deviceId, zoneId) {
        const result = await http.patch(`${DEVICES}/${deviceId}`, { zoneId })
        emitDeviceChange()
        return result
    },
}
