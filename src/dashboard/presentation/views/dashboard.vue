<template>
  <div>
    <section aria-labelledby="ov-title">
      <h2 id="ov-title" class="section-title">Overview</h2>
        <div class="kpi-group">
          <article class="kpi">
            <h3 class="kpi-title">Dispositivos activos</h3>
            <div class="kpi-value">{{ activeDevicesCount }}</div>
            <div class="kpi-sub">Registrados en tu cuenta</div>
          </article>
          <article v-if="personalization.kpiCurrent" class="kpi">
            <h3 class="kpi-title">Consumo actual</h3>
            <div class="kpi-value">{{ currentPowerKwh.toFixed(2) }} kWh</div>
            <div class="kpi-sub">+10% ahorrado vs ayer</div>
          </article>
          <article class="kpi">
            <h3 class="kpi-title">Consumo de hoy</h3>
            <div class="kpi-value">{{ todayTotalKwh.toFixed(2) }} kWh</div>
            <div class="kpi-sub">Hasta ahora / {{ projectedTodayKwh.toFixed(2) }} kWh proyectado</div>
          </article>
          <article v-if="personalization.kpiMonthly" class="kpi">
            <h3 class="kpi-title">Consumo mensual</h3>
            <div class="kpi-value">{{ monthTotalKwh.toFixed(0) }} kWh</div>
            <div class="kpi-sub">-80% de una meta de 250 kWh</div>
          </article>
          <article v-if="personalization.kpiCost" class="kpi">
            <h3 class="kpi-title">Costo estimado</h3>
            <div class="kpi-value">S/{{ estimatedCost.toFixed(2) }}</div>
            <div class="kpi-sub">vs S/48 el mes pasado</div>
          </article>
          <article class="kpi">
            <h3 class="kpi-title">Promedio diario</h3>
            <div class="kpi-value">{{ dailyAvgKwh.toFixed(1) }} kWh</div>
            <div class="kpi-sub">Historial últimos 3 meses</div>
          </article>
        </div>
      </section>

      <section class="grid-12">
        <figure v-if="personalization.chartHourly" class="card chart-box col-span-8">
          <h3>Consumo de energía hoy (por hora)</h3>
          <select :value="selectedZoneIdHora" @change="onZoneChangeHora" style="margin-bottom: 1rem;">
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
          <select :value="selectedDeviceId" @change="onDeviceSelectChange" style="margin-left: .5rem; margin-bottom: 1rem;">
            <option v-for="d in devicesHora" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <canvas id="consumoPorHora"></canvas>
        </figure>

        <figure v-if="personalization.chartDevice" class="card chart-box col-span-4">
          <h3>Consumo por dispositivo</h3>
          <select :value="selectedZoneIdDispositivo" @change="onZoneChangeDispositivo" style="margin-bottom: 1rem;">
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
          <canvas id="consumoPorDispositivo"></canvas>
        </figure>

        <figure v-if="personalization.chartMonthly" class="card chart-box col-span-12">
          <h3>Consumo este mes (diario)</h3>
          <select :value="selectedZoneIdMes" @change="onZoneChangeMes" style="margin-bottom: 1rem;">
            <option v-for="z in zones" :key="z.id" :value="z.id">{{ z.name }}</option>
          </select>
          <canvas id="consumoPorMes"></canvas>
        </figure>
      </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { DevicesApi, onDeviceChange } from '@/device/infrastructure/devices.endpoint.js'
import { usePersonalizationStore } from '@/personalization/application/personalization.js'
import { useAuth } from '@/identity/application/composables/useAuth.js'

const personalization = usePersonalizationStore()
const { userId } = useAuth()


Chart.register(...registerables)

// Estado global de dispositivos (debe estar al inicio)
const allUserDevices = ref([])
const zones = ref([])
const devicesHora = ref([])
const devicesShareCache = ref([])

// Datos de los gráficos (reactivos)
const chartData = ref({
  hourly: [],
  monthly: [],
  deviceShare: { labels: [], data: [] }
})

const selectedZoneIdHora = ref(null)
const selectedZoneIdMes = ref(null)
const selectedZoneIdDispositivo = ref(null)
const selectedDeviceId = ref(null)
let charts = { hora: null, mes: null, dispositivo: null }

// Estado separado para evitar reactividad
const isChartsReady = ref(false)

// API helpers
async function loadZones() {
  if (!userId.value) {
    console.warn('UserId not available yet')
    return []
  }
  try {
    const zones = await DevicesApi.getZones(userId.value)
    return zones
  } catch (error) {
    console.error('Error loading zones:', error)
    return []
  }
}

async function loadDevicesFor(zoneId) {
  if (!zoneId) return []
  try {
    const allDevices = await DevicesApi.getByUserId(userId.value)
    // Filtrar devices por zona
    const devices = allDevices.filter(d => d.zoneId === zoneId)
    return devices
  } catch (error) {
    console.error('Error loading devices for zone', zoneId, ':', error)
    return []
  }
}

// Generadores determinísticos
function seedRand(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
function genHourlyFromDeviceId(deviceId) {
  const rand = seedRand(deviceId * 9301 + 49297)
  return Array.from({ length: 24 }, (_, h) => {
    const base = 0.05 + (h >= 18 && h <= 22 ? 0.2 : h >= 6 && h <= 9 ? 0.12 : 0.08)
    const noise = (rand() - 0.5) * 0.04
    return Number((base + noise).toFixed(3))
  })
}

function genMonthlyFromDevices(devices) {
  if (!devices?.length) return Array(30).fill(0)
  const deviceId = devices[0]?.id ?? 1
  const rand = seedRand(deviceId * 777 + 13)
  return Array.from({ length: 30 }, (_, d) => Number((0.6 + 0.2 * Math.sin((d / 30) * Math.PI * 2) + (rand() - 0.5) * 0.15).toFixed(2)))
}

function genShareFromDevices(devices) {
  if (!devices?.length) {
    console.warn('⚠️ No hay dispositivos para generar el gráfico')
    return { labels: [], data: [] }
  }

  console.log('📊 Generando share para', devices.length, 'dispositivos')

  // Priorizar métricas reales de monthly
  const hasRealMetrics = devices.some(d => d.metrics?.monthly && d.metrics.monthly > 0)

  if (hasRealMetrics) {
    console.log('✅ Usando métricas reales de la base de datos')
    const consumptions = devices.map(d => Number(d.metrics?.monthly || 0))
    const total = consumptions.reduce((a, b) => a + b, 0)
    if (total > 0) {
      const data = consumptions.map(c => Number(((c / total) * 100).toFixed(2)))
      const labels = devices.map(d => d.name || `Device ${d.id}`)
      return { labels, data }
    }
  }

  // Fallback: generar datos sintéticos para que siempre se vean los dispositivos
  console.log('⚙️ Usando generación sintética (fallback)')
  const weights = devices.map(d => { const r = seedRand(d.id * 101); return 0.5 + r() * 2 })
  const total = weights.reduce((a, b) => a + b, 0)
  const data = weights.map(w => Number(((w / total) * 100).toFixed(2)))
  const labels = devices.map(d => d.name || `Device ${d.id}`)
  return { labels, data }
}

// Charts helpers
const horaLabels6 = ['12 AM','4 AM','8 AM','12 PM','4 PM','8 PM']
function sampleTo6(arr24) { return [arr24[0], arr24[4], arr24[8], arr24[12], arr24[16], arr24[20]] }

async function renderHora() {
  if (!selectedZoneIdHora.value) return
  devicesHora.value = await loadDevicesFor(selectedZoneIdHora.value)
  if (!selectedDeviceId.value) selectedDeviceId.value = devicesHora.value[0]?.id ?? null
  if (!selectedDeviceId.value) return
  const buckets24 = genHourlyFromDeviceId(selectedDeviceId.value)
  chartData.value.hourly = sampleTo6(buckets24)
  const ctx = document.getElementById('consumoPorHora')?.getContext('2d')
  if (!ctx) return
  charts.hora?.destroy?.()
  charts.hora = new Chart(ctx, {
    type: 'line',
    data: { labels: horaLabels6, datasets: [{ label: 'kWh', data: chartData.value.hourly, borderColor: '#0b2541', backgroundColor: 'rgba(11,37,65,0.15)', fill: true, tension: 0.3, pointRadius: 4 }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  })
}

async function renderDispositivoShare() {
  if (!selectedZoneIdDispositivo.value) {
    console.warn('⚠️ No hay zona seleccionada para el gráfico de dispositivos')
    return
  }
  const devices = await loadDevicesFor(selectedZoneIdDispositivo.value)
  console.log('📊 Dispositivos para gráfico (zona ' + selectedZoneIdDispositivo.value + '):', devices)
  devicesShareCache.value = devices
  chartData.value.deviceShare = genShareFromDevices(devices)
  console.log('📊 Datos del gráfico de dispositivos:', chartData.value.deviceShare)
  const ctx = document.getElementById('consumoPorDispositivo')?.getContext('2d')
  if (!ctx) {
    console.warn('⚠️ No se encontró el canvas consumoPorDispositivo')
    return
  }
  charts.dispositivo?.destroy?.()
  charts.dispositivo = new Chart(ctx, {
    type: 'bar',
    data: { labels: chartData.value.deviceShare.labels, datasets: [{ label: '% del consumo', data: chartData.value.deviceShare.data, backgroundColor: '#f46161' }] },
    options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true }, y: { ticks: { font: { size: 12 } } } } }
  })
}

async function renderMes() {
  if (!selectedZoneIdMes.value) return
  const rawDevices = await loadDevicesFor(selectedZoneIdMes.value)
  const daily = genMonthlyFromDevices(rawDevices)
  chartData.value.monthly = daily
  const ctx = document.getElementById('consumoPorMes')?.getContext('2d')
  if (!ctx) return
  charts.mes?.destroy?.()
  charts.mes = new Chart(ctx, {
    type: 'bar',
    data: { labels: daily.map((_, i) => i + 1), datasets: [{ label: 'Consumo (kWh)', data: daily, backgroundColor: '#0b2541' }] },
    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
  })
}

watch(selectedZoneIdHora, () => renderHora())
watch(selectedZoneIdDispositivo, () => renderDispositivoShare())
watch(selectedZoneIdMes, () => renderMes())

function onZoneChangeHora(e) { selectedZoneIdHora.value = Number(e.target.value) }
function onZoneChangeMes(e) { selectedZoneIdMes.value = Number(e.target.value) }
function onZoneChangeDispositivo(e) { selectedZoneIdDispositivo.value = Number(e.target.value) }
function onDeviceSelectChange(e) { selectedDeviceId.value = Number(e.target.value); renderHora() }

let stopListening

onMounted(async () => {
  // Cargar personalización del usuario
  await personalization.loadPersonalization()

  // Cargar todos los dispositivos del usuario
  allUserDevices.value = await DevicesApi.getByUserId(userId.value)
  console.log('🔌 Todos los dispositivos del usuario:', allUserDevices.value)
  console.log('🟢 Dispositivos activos:', allUserDevices.value.filter(d => d.online).length)

  const z = await loadZones()
  console.log('🏠 Zonas cargadas:', z)
  zones.value = z
  selectedZoneIdHora.value = z[0]?.id || null
  selectedZoneIdDispositivo.value = z[0]?.id || null
  selectedZoneIdMes.value = z[0]?.id || null
  await renderHora()
  await renderDispositivoShare()
  await renderMes()
  isChartsReady.value = true

  // Escuchar cambios en dispositivos
  stopListening = onDeviceChange(async () => {
    console.log('📡 Cambio en dispositivos → recargando dashboard...')
    allUserDevices.value = await DevicesApi.getByUserId(userId.value)
    await renderHora()
    await renderDispositivoShare()
    await renderMes()
  })
})

onBeforeUnmount(() => {
  stopListening?.()
  Object.values(charts).forEach(c => c?.destroy?.())
})

// ========== KPIs CALCULADOS ==========
const activeDevicesCount = computed(() => {
  const count = allUserDevices.value.filter(d => d.status === 'on' || d.online === true).length
  console.log('🔢 Conteo de dispositivos activos:', count, 'de', allUserDevices.value.length)
  return count
})

// Usar métricas reales cuando estén disponibles
const monthTotalKwh = computed(() => {
  // Intentar primero obtener de métricas reales
  const realMetrics = allUserDevices.value
    .filter(d => d.metrics?.monthly)
    .reduce((sum, d) => sum + Number(d.metrics.monthly), 0)

  if (realMetrics > 0) return realMetrics

  // Fallback a datos sintéticos del gráfico
  return chartData.value.monthly.reduce((a, b) => a + b, 0)
})

const dailyAvgKwh = computed(() => {
  // Intentar primero obtener de métricas reales
  const avgFromMetrics = allUserDevices.value
    .filter(d => d.metrics?.dailyAvg)
    .reduce((sum, d) => sum + Number(d.metrics.dailyAvg), 0)

  if (avgFromMetrics > 0) return avgFromMetrics

  // Fallback a cálculo sintético
  return monthTotalKwh.value / 30
})

const estimatedCost = computed(() => {
  // Intentar primero obtener de métricas reales
  const costFromMetrics = allUserDevices.value
    .filter(d => d.metrics?.estimatedCost)
    .reduce((sum, d) => sum + Number(d.metrics.estimatedCost), 0)

  if (costFromMetrics > 0) return costFromMetrics

  // Fallback a cálculo sintético
  return monthTotalKwh.value * 0.68
})

const todayTotalKwh = computed(() => chartData.value.hourly.reduce((a, b) => a + b, 0))
const currentPowerKwh = computed(() => chartData.value.hourly.at(-1) ?? 0)
const projectedTodayKwh = computed(() => (todayTotalKwh.value / horaLabels6.length) * 24)
</script>

<style scoped>
.section-title { font-size: 1.3rem; margin-bottom: 1rem; }
.kpi-group { display: grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap: 1rem; margin-bottom: 2rem; }
.kpi { background: #fff; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 1rem; }
.kpi-title { font-size: .9rem; font-weight: 600; margin-bottom: .25rem; }
.kpi-value { font-size: 1.2rem; font-weight: 600; }
.kpi-sub { font-size: .7rem; color: #555; }
.grid-12 { display: grid; grid-template-columns: repeat(12,1fr); gap: 1.5rem; }
.chart-box { background: #fff; padding: 1rem 1.25rem; border-radius: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.col-span-8 { grid-column: span 8; }
.col-span-4 { grid-column: span 4; }
.col-span-12 { grid-column: span 12; }
@media (max-width: 1100px) { .col-span-8, .col-span-4, .col-span-12 { grid-column: span 12; } }
</style>
