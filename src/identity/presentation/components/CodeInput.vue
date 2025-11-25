<template>
  <div class="auth-field">
    <label
      :for="inputId"
      class="auth-field__label"
    >
      {{ label }}
    </label>
    <div class="code-field-wrapper">
      <div class="auth-field__input-wrapper code-input-wrapper">
        <input
          :id="inputId"
          type="text"
          :value="modelValue"
          :placeholder="placeholder"
          :aria-required="true"
          :aria-invalid="!!error"
          :aria-describedby="getAriaDescribedBy"
          :disabled="disabled"
          :class="['auth-field__input', { 'auth-field__input--error': error, 'auth-field__input--valid': isValid }]"
          @input="$emit('update:modelValue', $event.target.value)"
          @blur="$emit('blur')"
        />
      </div>
      <button
        type="button"
        class="code-validate-button"
        :disabled="disabled || loading || !modelValue"
        @click="$emit('validate')"
      >
        <span v-if="!loading">Validar</span>
        <div v-if="loading" class="auth-button__spinner"></div>
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
      v-else-if="isValid"
      :id="`${inputId}-success`"
      class="auth-field__success"
      role="status"
      aria-live="polite"
    >
      ✓ Código válido
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
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
  loading: {
    type: Boolean,
    default: false
  },
  isValid: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue', 'blur', 'validate'])

const inputId = computed(() => {
  return `field-${props.label.toLowerCase().replace(/\s+/g, '-')}`
})

const getAriaDescribedBy = computed(() => {
  if (props.error) return `${inputId.value}-error`
  if (props.isValid) return `${inputId.value}-success`
  return undefined
})
</script>

<style scoped>
@import '../styles/auth.css';

.code-field-wrapper {
  display: flex;
  gap: var(--spacing-sm);
  align-items: flex-start;
}

.code-input-wrapper {
  flex: 1;
}

.code-validate-button {
  padding: 12px 20px;
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 600;
  font-family: var(--font-family-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-validate-button:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

.code-validate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-field__input--valid {
  border-color: var(--color-success);
}

.auth-field__input--valid:focus {
  box-shadow: 0 0 0 3px rgba(56, 142, 60, 0.1);
}

.auth-field__success {
  color: var(--color-success);
  font-size: 12px;
  margin-top: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

