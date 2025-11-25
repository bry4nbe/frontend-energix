<template>
  <div class="auth-page">
    <AuthCard :title="MESSAGES.title" :subtitle="MESSAGES.subtitle">
      <form class="auth-form" @submit.prevent="handleSubmit">
        <div v-if="generalError" class="auth-error-message" role="alert" aria-live="polite">
          {{ generalError }}
        </div>

        <CodeInput
          v-model="formData.code"
          :label="MESSAGES.codeLabel"
          :placeholder="MESSAGES.codePlaceholder"
          :error="errors.code"
          :disabled="submitLoading"
          :loading="codeLoading"
          :is-valid="codeValid"
          @validate="handleValidateCode"
          @update:modelValue="handleCodeChange"
        />

        <AuthField
          v-model="formData.name"
          :label="MESSAGES.nameLabel"
          type="text"
          :placeholder="MESSAGES.namePlaceholder"
          :error="errors.name"
          :disabled="submitLoading"
          @blur="validateField('name')"
        />

        <AuthField
          v-model="formData.lastName"
          :label="MESSAGES.lastNameLabel"
          type="text"
          :placeholder="MESSAGES.lastNamePlaceholder"
          :error="errors.lastName"
          :disabled="submitLoading"
          @blur="validateField('lastName')"
        />

        <AuthField
          v-model="formData.email"
          :label="MESSAGES.emailLabel"
          type="email"
          :placeholder="MESSAGES.emailPlaceholder"
          :error="errors.email"
          :disabled="submitLoading"
          @blur="validateField('email')"
        />

        <PasswordField
          v-model="formData.password"
          :label="MESSAGES.passwordLabel"
          :placeholder="MESSAGES.passwordPlaceholder"
          :error="errors.password"
          :disabled="submitLoading"
          :show-hint="true"
          :hint="MESSAGES.passwordHint"
          @blur="validateField('password')"
        />

        <PasswordField
          v-model="formData.confirmPassword"
          :label="MESSAGES.confirmPasswordLabel"
          :placeholder="MESSAGES.confirmPasswordPlaceholder"
          :error="errors.confirmPassword"
          :disabled="submitLoading"
          :show-hint="false"
          @blur="validateField('confirmPassword')"
        />

        <AuthField
          v-model="formData.dni"
          :label="MESSAGES.dniLabel"
          type="text"
          :placeholder="MESSAGES.dniPlaceholder"
          :error="errors.dni"
          :disabled="submitLoading"
          @blur="validateField('dni')"
        />

        <AuthField
          v-model="formData.district"
          :label="MESSAGES.districtLabel"
          type="text"
          :placeholder="MESSAGES.districtPlaceholder"
          :error="errors.district"
          :disabled="submitLoading"
          @blur="validateField('district')"
        />

        <button
          type="submit"
          :class="['auth-button', { 'auth-button--loading': submitLoading }]"
          :disabled="submitLoading || !canSubmit"
          :aria-busy="submitLoading"
        >
          <span v-if="!submitLoading">{{ MESSAGES.registerButton }}</span>
          <div v-if="submitLoading" class="auth-button__spinner"></div>
        </button>
      </form>

      <div class="auth-footer">
        {{ MESSAGES.hasAccount }}
        <router-link to="/login" class="auth-footer__link">
          {{ MESSAGES.loginLink }}
        </router-link>
      </div>
    </AuthCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AuthCard from '../components/AuthCard.vue'
import AuthField from '../components/AuthField.vue'
import PasswordField from '../components/PasswordField.vue'
import CodeInput from '../components/CodeInput.vue'
import { validateCodeService, registerService } from '@/identity/domain/auth/auth.service.js'
import { isValidEmail, isRequired, isValidPassword, passwordsMatch, isValidDNI } from '@/identity/application/utils/validators.js'
import { useAsyncAction } from '@/identity/application/composables/useAsyncAction.js'
import { useFocusManagement } from '@/identity/application/composables/useFocusManagement.js'

const router = useRouter()
const route = useRoute()

const MESSAGES = {
  title: 'Registro en Energix',
  subtitle: 'Complete sus datos para crear una cuenta',
  codeLabel: 'Código',
  codePlaceholder: 'Ingrese su código de registro o código de referido (ENX-XXXXXX)',
  nameLabel: 'Nombre',
  namePlaceholder: 'Ingrese su nombre',
  lastNameLabel: 'Apellido',
  lastNamePlaceholder: 'Ingrese su apellido',
  emailLabel: 'Correo Electrónico',
  emailPlaceholder: 'ejemplo@correo.com',
  passwordLabel: 'Contraseña',
  passwordPlaceholder: 'Ingrese su contraseña',
  passwordHint: 'Mínimo 8 caracteres',
  confirmPasswordLabel: 'Confirmar Contraseña',
  confirmPasswordPlaceholder: 'Confirme su contraseña',
  dniLabel: 'DNI',
  dniPlaceholder: 'Ingrese su DNI',
  districtLabel: 'Distrito',
  districtPlaceholder: 'Ingrese su distrito',
  registerButton: 'Registrarse',
  hasAccount: '¿Ya tiene una cuenta?',
  loginLink: 'Inicie sesión aquí',
  errors: {
    codeRequired: 'El código es requerido',
    codeValidate: 'Debe validar su código antes de registrarse',
    nameRequired: 'El nombre es requerido',
    lastNameRequired: 'El apellido es requerido',
    emailRequired: 'El correo electrónico es requerido',
    emailInvalid: 'El formato del correo electrónico no es válido',
    passwordRequired: 'La contraseña es requerida',
    passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
    confirmPasswordRequired: 'Debe confirmar su contraseña',
    passwordsNoMatch: 'Las contraseñas no coinciden',
    dniRequired: 'El DNI es requerido',
    dniInvalid: 'El DNI debe contener solo números y tener al menos 8 dígitos',
    districtRequired: 'El distrito es requerido'
  }
}

const formData = ref({
  code: '',
  name: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dni: '',
  district: ''
})

const errors = ref({
  code: '',
  name: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dni: '',
  district: ''
})

const generalError = ref('')
const codeValid = ref(false)

const { loading: codeLoading, execute: executeCodeValidation } = useAsyncAction()
const { loading: submitLoading, execute: executeSubmit } = useAsyncAction()
const { focusFirstError } = useFocusManagement()

const canSubmit = computed(() =>
    !submitLoading.value && (formData.value.code ? codeValid.value : true)
)

// Detectar código de referido desde la URL
onMounted(() => {
  const refCode = route.query.ref
  if (refCode) {
    formData.value.code = refCode
    // Auto-validar el código si viene de la URL
    handleValidateCode()
  }
})

const handleCodeChange = () => {
  codeValid.value = false
  errors.value.code = ''
}

const handleValidateCode = async () => {
  errors.value.code = ''
  if (!formData.value.code) {
    errors.value.code = MESSAGES.errors.codeRequired
    return
  }
  try {
    await executeCodeValidation(async () => {
      await validateCodeService(formData.value.code)
      codeValid.value = true
    })
  } catch (error) {
    codeValid.value = false
    errors.value.code = error.network ? error.message : (error.message || MESSAGES.errors.codeRequired)
  }
}

const validateField = (fieldName) => {
  errors.value[fieldName] = ''
  switch (fieldName) {
    case 'name':
      if (!isRequired(formData.value.name)) errors.value.name = MESSAGES.errors.nameRequired
      break
    case 'lastName':
      if (!isRequired(formData.value.lastName)) errors.value.lastName = MESSAGES.errors.lastNameRequired
      break
    case 'email':
      if (!formData.value.email) errors.value.email = MESSAGES.errors.emailRequired
      else if (!isValidEmail(formData.value.email)) errors.value.email = MESSAGES.errors.emailInvalid
      break
    case 'password':
      if (!formData.value.password) errors.value.password = MESSAGES.errors.passwordRequired
      else if (!isValidPassword(formData.value.password)) errors.value.password = MESSAGES.errors.passwordMinLength
      if (formData.value.confirmPassword) validateField('confirmPassword')
      break
    case 'confirmPassword':
      if (!formData.value.confirmPassword) errors.value.confirmPassword = MESSAGES.errors.confirmPasswordRequired
      else if (!passwordsMatch(formData.value.password, formData.value.confirmPassword)) errors.value.confirmPassword = MESSAGES.errors.passwordsNoMatch
      break
    case 'dni':
      if (!formData.value.dni) errors.value.dni = MESSAGES.errors.dniRequired
      else if (!isValidDNI(formData.value.dni)) errors.value.dni = MESSAGES.errors.dniInvalid
      break
    case 'district':
      if (!isRequired(formData.value.district)) errors.value.district = MESSAGES.errors.districtRequired
      break
  }
}

const validateAllFields = () => {
  let isValid = true
  const fields = ['name', 'lastName', 'email', 'password', 'confirmPassword', 'dni', 'district']
  fields.forEach(field => {
    validateField(field)
    if (errors.value[field]) isValid = false
  })
  return isValid
}

const handleSubmit = async () => {
  generalError.value = ''

  // Solo exigimos validación si el usuario ingresó un código
  if (formData.value.code && !codeValid.value) {
    generalError.value = MESSAGES.errors.codeValidate
    return
  }

  // Validaciones de campos
  const isValid = validateAllFields()
  if (!isValid) {
    await focusFirstError(errors.value)
    return
  }

  try {
    await executeSubmit(async () => {
      const payload = {
        code: formData.value.code || '',   // vacío => plan basic en el backend
        name: formData.value.name,
        lastName: formData.value.lastName,
        email: formData.value.email,
        password: formData.value.password,
        dni: formData.value.dni,
        district: formData.value.district
      }

      await registerService(payload)
      await router.push({ name: 'dashboard' })
    })
  } catch (error) {
    if (error.field) {
      errors.value[error.field] = error.message
      await focusFirstError(errors.value)
    } else if (error.network) {
      generalError.value = error.message
    } else {
      generalError.value = error.message || 'Ocurrió un error durante el registro'
    }
  }
}

</script>

<style scoped>
@import '../styles/auth.css';
</style>
