<template>
  <div>
    <!-- KPIs -->
    <section aria-labelledby="ov-title">
      <h2 id="ov-title" class="section-title">{{ t('dashboard.title') }}</h2>
        <div class="kpi-group">
          <article class="kpi" v-for="(item, i) in kpis" :key="i">
            <h3 class="kpi-title">{{ item.title }}</h3>
            <div class="kpi-value">{{ item.value }}</div>
            <div class="kpi-sub">{{ item.sub }}</div>
          </article>
        </div>
      </section>

      <!-- Charts -->
      <section class="grid-12">
        <figure v-if="personalization.chartHourly" class="card chart-box col-span-8">
          <h3>📈 {{ t('dashboard.charts.hourlyConsumption') }}</h3>
          <div class="chart-container">
            <canvas id="chartPorHora"></canvas>
          </div>
        </figure>

        <figure v-if="personalization.chartDevice" class="card chart-box col-span-4">
          <h3>⚡ {{ t('dashboard.charts.deviceConsumption') }}</h3>
          <div class="chart-container small">
            <canvas id="chartPorDispositivo"></canvas>
          </div>
        </figure>

        <figure v-if="personalization.chartWeekly" class="card chart-box col-span-12">
          <h3>📊 {{ t('dashboard.charts.weeklyConsumption') }}</h3>
          <div class="chart-container">
            <canvas id="chartPorSemana"></canvas>
          </div>
        </figure>

        <figure v-if="personalization.chartMonthly" class="card chart-box col-span-12">
          <h3>📅 {{ t('dashboard.charts.monthlyConsumption') }}</h3>
          <div class="chart-container">
            <canvas id="chartPorMes"></canvas>
          </div>
        </figure>
      </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { Chart, registerables } from 'chart.js'
import { DevicesApi, onDeviceChange } from '@/device/infrastructure/devices.endpoint.js'
import { usePersonalizationStore } from '@/personalization/application/personalization.js'
import { useAuth } from '@/identity/application/composables/useAuth.js'

const { t } = useI18n()
const personalization = usePersonalizationStore()
const { userId, getCurrentUser } = useAuth()

Chart.register(...registerables)

const tarifa = 0.68
let charts = { hora: null, semana: null, disp: null, mes: null }

const devices = ref([])
const hourly24 = ref([])
const week7 = ref([])
const month30 = ref([])
const share = ref({ labels: [], data: [] })

async function loadDevices() {
  if (!userId.value) {
    console.warn('UserId not available yet')
    return []
  }
  const list = await DevicesApi.getByUserId(userId.value)
  devices.value = list
  return list
}

/* ===== Generadores (simulan datos) ===== */
function seedRand(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
function genHourlyFromDeviceId(deviceId) {
  const r = seedRand(deviceId * 9301 + 49297)
  return Array.from({ length: 24 }, (_, h) => {
    const base = 0.05 + (h >= 18 && h <= 22 ? 0.2 : h >= 6 && h <= 9 ? 0.12 : 0.08)
    const noise = (r() - 0.5) * 0.04
    return Number((base + noise).toFixed(3))
  })
}
function genWeekFromDevices(devs) {
  const r = seedRand(devs.length * 517)
  return Array.from({ length: 7 }, (_, d) => {
    const base = 0.7 + 0.3 * Math.sin((d / 7) * Math.PI * 2)
    const noise = (r() - 0.5) * 0.15
    return Number(Math.max(0.2, base + noise).toFixed(2))
  })
}

function genMonthFromDevices(devs) {
  const r = seedRand(devs.length * 1234)
  return Array.from({ length: 30 }, (_, d) => {
    const base = 0.6 + 0.3 * Math.sin((d / 30) * Math.PI * 2)
    const noise = (r() - 0.5) * 0.2
    return Number(Math.max(0.3, base + noise).toFixed(2))
  })
}

function genShareFromDevices(devs) {
  if (!devs?.length) return { labels: [], data: [] }

  // Si hay métricas reales de monthly, usarlas para el share
  const hasRealMetrics = devs.some(d => d.metrics?.monthly)

  if (hasRealMetrics) {
    const consumptions = devs.map(d => Number(d.metrics?.monthly || 0))
    const total = consumptions.reduce((a, b) => a + b, 0)
    if (total > 0) {
      const data = consumptions.map(c => Number(((c / total) * 100).toFixed(2)))
      const labels = devs.map(d => d.name || `Dispositivo ${d.id}`)
      return { labels, data }
    }
  }

  // Fallback a generación si no hay métricas
  const weights = devs.map(d => {
    const r = seedRand(d.id * 101)
    return 0.5 + r() * 2
  })
  const total = weights.reduce((a, b) => a + b, 0)
  const data = weights.map(w => Number(((w / total) * 100).toFixed(2)))
  const labels = devs.map(d => d.name || `Dispositivo ${d.id}`)
  return { labels, data }
}

/* ===== CHARTS ===== */
function drawHora() {
  charts.hora?.destroy()
  const ctx = document.getElementById('chartPorHora')
  charts.hora = new Chart(ctx, {
    type: 'line',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [{
        label: 'kWh',
        data: hourly24.value,
        borderColor: '#007bff',
        backgroundColor: 'rgba(0,123,255,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Consumo (kWh)' } },
        x: { title: { display: true, text: 'Hora del día' } }
      }
    }
  })
}

function drawDispositivo() {
  charts.disp?.destroy()
  const ctx = document.getElementById('chartPorDispositivo')
  charts.disp = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: share.value.labels,
      datasets: [{
        label: 'Porcentaje de consumo',
        data: share.value.data,
        backgroundColor: '#0b2541'
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: '% del total' },
          ticks: { font: { size: 11 } }
        },
        y: {
          ticks: { font: { size: 12 } }
        }
      }
    }
  })
}

function drawSemana() {
  charts.semana?.destroy()
  const ctx = document.getElementById('chartPorSemana')
  const avg = week7.value.reduce((a,b)=>a+b,0) / week7.value.length
  charts.semana = new Chart(ctx, {
    data: {
      labels: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
      datasets: [
        { type: 'bar', label: 'Consumo diario', data: week7.value, backgroundColor: '#f46161' },
        { type: 'line', label: 'Promedio semanal', data: new Array(7).fill(avg), borderColor: '#0b2541', borderWidth: 2, pointRadius: 0, tension: 0.3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { beginAtZero: true, title: { display: true, text: 'Consumo (kWh)' } } }
    }
  })
}

function drawMes() {
  charts.mes?.destroy()
  const ctx = document.getElementById('chartPorMes')
  if (!ctx) return

  const avg = month30.value.reduce((a,b)=>a+b,0) / month30.value.length
  charts.mes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Array.from({ length: 30 }, (_, i) => i + 1),
      datasets: [{
        label: 'Consumo diario (kWh)',
        data: month30.value,
        backgroundColor: '#0b2541'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Día ${context.label}: ${context.parsed.y.toFixed(2)} kWh`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Consumo (kWh)' }
        },
        x: {
          title: { display: true, text: 'Día del mes' }
        }
      }
    }
  })
}

/* ===== KPIs ===== */
const totalDevices = computed(() => devices.value.length)
const todayTotalKwh = computed(() => hourly24.value.reduce((a,b)=>a+Number(b||0),0))
const currentPowerKwh = computed(() => hourly24.value.at(-1) ?? 0)
const weekTotalKwh = computed(() => week7.value.reduce((a,b)=>a+Number(b||0),0))
const estimatedCost = computed(() => weekTotalKwh.value * tarifa)
const dailyAvgKwh = computed(() => week7.value.length ? weekTotalKwh.value / week7.value.length : 0)

const kpis = computed(() => [
  { title: t('dashboard.kpi.activeDevices'), value: totalDevices.value, sub: t('dashboard.kpi.registeredInAccount') },
  { title: t('dashboard.kpi.currentConsumption'), value: `${currentPowerKwh.value.toFixed(2)} ${t('units.kWh')}`, sub: t('dashboard.kpi.realTimeMeasurement') },
  { title: t('dashboard.kpi.todayConsumption'), value: `${todayTotalKwh.value.toFixed(2)} ${t('units.kWh')}`, sub: t('dashboard.kpi.totalSoFar') },
  { title: t('dashboard.kpi.estimatedWeeklyCost'), value: `${t('units.currency')}${estimatedCost.value.toFixed(2)}`, sub: t('dashboard.kpi.basedOnCurrentRate') },
  { title: t('dashboard.kpi.dailyAverage'), value: `${dailyAvgKwh.value.toFixed(2)} ${t('units.kWh')}`, sub: t('dashboard.kpi.lastDays') }
])

/* ===== Lifecycle ===== */
async function reloadAll() {
  const devs = await loadDevices()
  const deviceId = devs?.[0]?.id || 1
  hourly24.value = genHourlyFromDeviceId(deviceId)
  week7.value = genWeekFromDevices(devs)
  month30.value = genMonthFromDevices(devs)
  share.value = genShareFromDevices(devs)
  await nextTick()
  drawHora()
  drawDispositivo()
  drawSemana()
  drawMes()
}

let stopListening

onMounted(async () => {
  await personalization.loadPersonalization()
  await getCurrentUser() // Inicializar usuario actual
  await reloadAll()

  stopListening = onDeviceChange(async () => {
    console.log('📡 Cambio en dispositivos → recargando dashboard student...')
    await reloadAll()
  })
})

onBeforeUnmount(() => {
  stopListening?.()
  charts.hora?.destroy()
  charts.semana?.destroy()
  charts.disp?.destroy()
  charts.mes?.destroy()
})
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
.chart-container { height: 300px; }
.chart-container.small { height: 240px; }
@media (max-width: 1100px) { .col-span-8, .col-span-4, .col-span-12 { grid-column: span 12; } }
</style>
