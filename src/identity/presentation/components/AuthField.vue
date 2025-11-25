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
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :aria-required="true"
        :aria-invalid="!!error"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        :disabled="disabled"
        :class="['auth-field__input', { 'auth-field__input--error': error }]"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
      />
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
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
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
  }
})

defineEmits(['update:modelValue', 'blur'])

const inputId = computed(() => {
  return `field-${props.label.toLowerCase().replace(/\s+/g, '-')}`
})
</script>

<style scoped>
@import '../styles/auth.css';
</style>

