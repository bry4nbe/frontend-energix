// Composable para manejo de acciones asíncronas con loading y error
import { ref } from 'vue'

/**
 * Composable para ejecutar acciones asíncronas con manejo automático de loading y errores
 * @returns {Object} { loading, error, execute }
 */
export function useAsyncAction() {
  const loading = ref(false)
  const error = ref(null)

  /**
   * Ejecuta una función asíncrona con manejo automático de estados
   * @param {Function} asyncFn - Función asíncrona a ejecutar
   * @param {Function} errorHandler - Handler opcional para errores
   * @returns {Promise<any>} Resultado de la función
   */
  async function execute(asyncFn, errorHandler) {
    loading.value = true
    error.value = null

    try {
      const result = await asyncFn()
      return result
    } catch (err) {
      error.value = err
      if (errorHandler) {
        errorHandler(err)
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Resetea el estado de error
   */
  function clearError() {
    error.value = null
  }

  return {
    loading,
    error,
    execute,
    clearError
  }
}

