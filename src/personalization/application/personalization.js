// src/stores/personalization.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { PersonalizationAPI } from '../infrastructure/personalization.endpoint.js'

function getUserId() {
    try {
        const user = JSON.parse(localStorage.getItem('energix-user'))
        return user?.id || null
    } catch {
        return null
    }
}

const DEFAULTS = {
    kpiCurrent: true,
    kpiCost: true,
    kpiMonthly: true,
    chartHourly: true,
    chartMonthly: false,
    chartDevice: true
}

export const usePersonalizationStore = defineStore('personalization', () => {
    const kpiCurrent = ref(DEFAULTS.kpiCurrent)
    const kpiCost = ref(DEFAULTS.kpiCost)
    const kpiMonthly = ref(DEFAULTS.kpiMonthly)
    const chartHourly = ref(DEFAULTS.chartHourly)
    const chartMonthly = ref(DEFAULTS.chartMonthly)
    const chartDevice = ref(DEFAULTS.chartDevice)
    const isLoading = ref(false)
    const currentUserId = ref(null)
    const justCleared = ref(false)

    async function loadPersonalization() {
        const userId = getUserId()

        if (!userId) {
            resetToDefaults()
            currentUserId.value = null
            return
        }

        if (currentUserId.value !== null && currentUserId.value !== userId) {
            resetToDefaults()
        }

        currentUserId.value = userId

        try {
            isLoading.value = true
            const data = await PersonalizationAPI.getByUserId(userId)

            if (data) {
                kpiCurrent.value = data.kpiCurrent
                kpiCost.value = data.kpiCost
                kpiMonthly.value = data.kpiMonthly
                chartHourly.value = data.chartHourly
                chartMonthly.value = data.chartMonthly
                chartDevice.value = data.chartDevice
                justCleared.value = false
            } else {
                resetToDefaults()
            }
        } catch (error) {
            resetToDefaults()
        } finally {
            isLoading.value = false
        }
    }

    async function savePersonalization(forceValues) {
        const userId = getUserId()

        if (!userId) {
            throw new Error('No hay usuario autenticado')
        }

        if (justCleared.value && !forceValues) {
            return
        }

        try {
            isLoading.value = true

            const data = forceValues || {
                kpiCurrent: kpiCurrent.value,
                kpiCost: kpiCost.value,
                kpiMonthly: kpiMonthly.value,
                chartHourly: chartHourly.value,
                chartMonthly: chartMonthly.value,
                chartDevice: chartDevice.value
            }

            const result = await PersonalizationAPI.saveUserPersonalization(userId, data)

            if (result) {
                kpiCurrent.value = result.kpiCurrent
                kpiCost.value = result.kpiCost
                kpiMonthly.value = result.kpiMonthly
                chartHourly.value = result.chartHourly
                chartMonthly.value = result.chartMonthly
                chartDevice.value = result.chartDevice
                justCleared.value = false
            }
        } catch (error) {
            throw error
        } finally {
            isLoading.value = false
        }
    }

    function resetToDefaults() {
        kpiCurrent.value = DEFAULTS.kpiCurrent
        kpiCost.value = DEFAULTS.kpiCost
        kpiMonthly.value = DEFAULTS.kpiMonthly
        chartHourly.value = DEFAULTS.chartHourly
        chartMonthly.value = DEFAULTS.chartMonthly
        chartDevice.value = DEFAULTS.chartDevice
    }

    function clearStore() {
        resetToDefaults()
        currentUserId.value = null
        justCleared.value = true
    }

    async function resetPersonalization() {
        resetToDefaults()
        await savePersonalization(DEFAULTS)
    }

    function setPersonalization(data) {
        kpiCurrent.value = data.kpiCurrent
        kpiCost.value = data.kpiCost
        kpiMonthly.value = data.kpiMonthly
        chartHourly.value = data.chartHourly
        chartMonthly.value = data.chartMonthly
        chartDevice.value = data.chartDevice
    }

    return {
        kpiCurrent,
        kpiCost,
        kpiMonthly,
        chartHourly,
        chartMonthly,
        chartDevice,
        isLoading,
        currentUserId,
        setPersonalization,
        loadPersonalization,
        savePersonalization,
        resetToDefaults,
        resetPersonalization,
        clearStore
    }
})

