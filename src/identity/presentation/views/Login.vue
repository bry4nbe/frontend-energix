<template>
  <div class="auth-page">
    <AuthCard :title="MESSAGES.title">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div
          v-if="generalError"
          class="auth-error-message"
          role="alert"
          aria-live="polite"
        >
          {{ generalError }}
        </div>

        <AuthField
          v-model="email"
          :label="MESSAGES.emailLabel"
          type="email"
          :placeholder="MESSAGES.emailPlaceholder"
          :error="emailError"
          :disabled="loading"
          @blur="validateEmail"
        />

        <PasswordField
          v-model="password"
          :label="MESSAGES.passwordLabel"
          :placeholder="MESSAGES.passwordPlaceholder"
          :error="passwordError"
          :disabled="loading"
          @blur="validatePassword"
        />

        <button
          type="submit"
          :class="['auth-button', { 'auth-button--loading': loading }]"
          :disabled="loading"
          :aria-busy="loading"
        >
          <span v-if="!loading">{{ MESSAGES.loginButton }}</span>
          <div v-if="loading" class="auth-button__spinner"></div>
        </button>
      </form>

      <div class="auth-footer">
        {{ MESSAGES.noAccount }}
        <router-link to="/register" class="auth-footer__link">
          {{ MESSAGES.registerLink }}
        </router-link>
      </div>
    </AuthCard>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import AuthField from '../components/AuthField.vue'
import PasswordField from '../components/PasswordField.vue'
import { loginService } from '@/identity/domain/auth/auth.service.js'
import { isValidEmail, isValidPassword } from '@/identity/application/utils/validators.js'
import { useAsyncAction } from '@/identity/application/composables/useAsyncAction.js'
import { usePersonalizationStore } from '@/personalization/application/personalization.js'

const router = useRouter()
const personalizationStore = usePersonalizationStore()

const MESSAGES = {
  title: 'Bienvenido a Energix',
  emailLabel: 'Correo Electrónico',
  emailPlaceholder: 'ejemplo@correo.com',
  passwordLabel: 'Contraseña',
  passwordPlaceholder: 'Ingrese su contraseña',
  loginButton: 'Iniciar Sesión',
  noAccount: '¿No tiene una cuenta?',
  registerLink: 'Regístrese aquí',
  errors: {
    emailRequired: 'El correo electrónico es requerido',
    emailInvalid: 'El formato del correo electrónico no es válido',
    passwordRequired: 'La contraseña es requerida',
    passwordMinLength: 'La contraseña debe tener al menos 8 caracteres'
  }
}

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const generalError = ref('')

const { loading, execute } = useAsyncAction()

const validateEmail = () => {
  emailError.value = ''
  if (!email.value) {
    emailError.value = MESSAGES.errors.emailRequired
    return false
  }
  if (!isValidEmail(email.value)) {
    emailError.value = MESSAGES.errors.emailInvalid
    return false
  }
  return true
}

const validatePassword = () => {
  passwordError.value = ''
  if (!password.value) {
    passwordError.value = MESSAGES.errors.passwordRequired
    return false
  }
  if (!isValidPassword(password.value)) {
    passwordError.value = MESSAGES.errors.passwordMinLength
    return false
  }
  return true
}

const handleSubmit = async () => {
  generalError.value = ''

  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()

  if (!isEmailValid || !isPasswordValid) {
    return
  }

  try {
    await execute(async () => {
      const user = await loginService({ email: email.value, password: password.value })
      personalizationStore.loadPersonalization() // Carga la personalización del usuario que acaba de iniciar sesión
      personalizationStore.savePersonalization() // Guarda la personalización del usuario al iniciar sesión
      await router.replace({
        name: 'dashboard'
      })
      return user
    })
  } catch (error) {
    generalError.value = error.message || 'Error al iniciar sesión'
  }
}
</script>

<style scoped>
@import '../styles/auth.css';
</style>