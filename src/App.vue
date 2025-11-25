<template>
  <component :is="layout" v-if="isRouterReady">
    <Router-view/>
  </component>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LayoutShell from "./shared/presentation/views/LayoutShell.vue"
import EmptyLayout from "./shared/presentation/views/EmptyLayout.vue"

const route = useRoute()
const router = useRouter()
const isRouterReady = ref(false)


// Seleccionar el views basado en si la ruta es pública
const layout = computed(() => {
  return route.meta?.public === true ? EmptyLayout : LayoutShell
})

// Esperar a que el router esté listo antes de renderizar
onMounted(async () => {
  await router.isReady()
  isRouterReady.value = true
})
</script>