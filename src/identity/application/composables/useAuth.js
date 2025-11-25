import { ref, computed } from 'vue'
import { http } from '@/shared/infrastructure/base-api.js'

// Estado global del usuario autenticado
const currentUser = ref(null)
const isAuthenticated = ref(false)

export function useAuth() {
  // Función para obtener el usuario desde localStorage (sistema existente)
  const getCurrentUser = async () => {
    try {
      // El sistema existente guarda el usuario en 'energix-user'
      const storedUser = localStorage.getItem('energix-user')
      if (storedUser) {
        const user = JSON.parse(storedUser)
        currentUser.value = user
        isAuthenticated.value = true
        return user
      }

      // Si no hay usuario almacenado, verificar si está autenticado
      const authStatus = localStorage.getItem('isAuthenticated')
      if (authStatus === 'true') {
        // Intentar obtener el primer usuario disponible como fallback
        const users = await http.get('/api/v1/users')
        if (users.length > 0) {
          // Por defecto tomar el primer usuario estudiante si existe
          const user = users.find(u => u.plan === 'student') || users[0]
          currentUser.value = user
          isAuthenticated.value = true
          // Guardar en el formato correcto
          localStorage.setItem('energix-user', JSON.stringify(user))
          localStorage.setItem('energix-plan', user.plan)
          return user
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error)
    }
    return null
  }

  // Función para cambiar usuario (simulación de login)
  const setCurrentUser = (user) => {
    currentUser.value = user
    isAuthenticated.value = !!user
    if (user) {
      localStorage.setItem('energix-user', JSON.stringify(user))
      localStorage.setItem('energix-plan', user.plan)
      localStorage.setItem('isAuthenticated', 'true')
    } else {
      localStorage.removeItem('energix-user')
      localStorage.removeItem('energix-plan')
      localStorage.setItem('isAuthenticated', 'false')
    }
  }

  // Función para logout
  const logout = () => {
    currentUser.value = null
    isAuthenticated.value = false
    localStorage.removeItem('energix-user')
    localStorage.removeItem('energix-plan')
    localStorage.removeItem('token')
    localStorage.setItem('isAuthenticated', 'false')
  }

  // Computed properties
  const userId = computed(() => currentUser.value?.id || null)
  const userPlan = computed(() => currentUser.value?.plan || 'Básico')
  const userName = computed(() => currentUser.value?.name || 'Usuario')

  return {
    currentUser,
    isAuthenticated,
    userId,
    userPlan,
    userName,
    getCurrentUser,
    setCurrentUser,
    logout
  }
}
