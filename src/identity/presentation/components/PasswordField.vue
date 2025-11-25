<template>
  <div class="auth-field">
    <label
      :for="inputId"
      class="auth-field__label"
    >
      {{ label }}
    </label>
    <div class="auth-field__input-wrapper">
      <input
        :id="inputId"
        :type="isVisible ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        :aria-required="true"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : `${inputId}-hint`"
        :disabled="disabled"
        :class="['auth-field__input', { 'auth-field__input--error': error }]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />
      <button
        type="button"
        class="password-field__toggle"
        :disabled="disabled"
        :aria-label="isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        @click="toggleVisibility"
      >
        <svg v-if="isVisible" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeWidth="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
    </div>
    <div
      v-if="error"
      :id="`${inputId}-error`"
      class="auth-field__error"
      role="alert"
      aria-live="polite"
    >
      {{ error }}
    </div>
    <div
      v-else-if="showHint"
      :id="`${inputId}-hint`"
      class="auth-field__hint"
    >
      {{ hint }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: 'Contraseña'
  },
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showHint: {
    type: Boolean,
    default: true
  },
  hint: {
    type: String,
    default: 'Mínimo 8 caracteres'
  }
})

defineEmits(['update:modelValue', 'blur'])

const isVisible = ref(false)

const inputId = computed(() => {
  return `field-${props.label.toLowerCase().replace(/\s+/g, '-')}`
})

const toggleVisibility = () => {
  isVisible.value = !isVisible.value
}
</script>

<style scoped>
@import '../styles/auth.css';
</style>
