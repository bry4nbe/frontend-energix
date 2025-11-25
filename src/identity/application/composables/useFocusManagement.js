// Composable para manejo de foco en formularios
import { nextTick } from 'vue'

/**
 * Composable para gestionar el foco en elementos del DOM
 * @returns {Object} { focusElement, focusFirstError }
 */
export function useFocusManagement() {
  /**
   * Hace foco en un elemento por selector
   * @param {string} selector - Selector CSS del elemento
   * @returns {Promise<boolean>} true si se hizo foco, false si no se encontró
   */
  async function focusElement(selector) {
    await nextTick()
    const element = document.querySelector(selector)
    if (element) {
      element.focus()
      return true
    }
    return false
  }

  /**
   * Hace foco en el primer campo con error
   * @param {Object} errors - Objeto con errores por campo
   * @param {Object} fieldIdMap - Mapa de nombres de campo a IDs de input
   * @returns {Promise<boolean>}
   */
  async function focusFirstError(errors, fieldIdMap = {}) {
    const firstErrorField = Object.keys(errors)[0]
    if (!firstErrorField) return false

    // Intentar con el mapa de IDs si está disponible
    if (fieldIdMap[firstErrorField]) {
      return await focusElement(`#${fieldIdMap[firstErrorField]}`)
    }

    // Fallback: intentar con el nombre del campo directamente
    return await focusElement(`#field-${firstErrorField}`)
  }

  /**
   * Hace foco en un elemento por ID
   * @param {string} id - ID del elemento
   * @returns {Promise<boolean>}
   */
  async function focusById(id) {
    return await focusElement(`#${id}`)
  }

  return {
    focusElement,
    focusFirstError,
    focusById
  }
}

