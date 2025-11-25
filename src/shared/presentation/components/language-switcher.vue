<script setup>
import { useI18n } from "vue-i18n";
import SelectButton from 'primevue/selectbutton';

const { locale } = useI18n();

const languageOptions = [
  { label: 'ES', value: 'es' },
  { label: 'EN', value: 'en' }
];
</script>

<template>
  <SelectButton v-model="locale" :options="languageOptions" optionLabel="label" optionValue="value" />
</template>

<style scoped>
:deep(.p-selectbutton) {
  display: flex;
  gap: 0;
}

:deep(.p-button) {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}
</style>