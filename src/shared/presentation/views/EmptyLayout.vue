<script setup>
// Componente de views vacío para rutas públicas
</script>

<template>
  <div class="empty-layout">
    <slot />
  </div>
</template>

<style scoped>
.empty-layout {
  display: contents; /* No afecta al views, renderiza hijos directamente */
}
</style>

