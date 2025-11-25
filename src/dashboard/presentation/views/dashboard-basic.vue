<template>
  <div class="basic-dashboard">
    <h1 class="title">Panel de Energía - Usuario Básico</h1>

    <!-- Viñetas de resumen -->
    <div v-if="hasDevices" class="summary-cards">
      <div v-if="personalization.kpiCurrent" class="card">
        <span class="emoji">💡</span>
        <p class="label">Consumo Total</p>
        <p class="value">{{ totalConsumo }} kWh</p>
      </div>
      <div v-if="personalization.kpiCost" class="card">
        <span class="emoji">💰</span>
        <p class="label">Costo Estimado</p>
        <p class="value">S/ {{ totalCosto.toFixed(2) }}</p>
      </div>
      <div v-if="personalization.kpiTariff" class="card">
        <span class="emoji">⚡</span>
        <p class="label">Tarifa Promedio</p>
        <p class="value">S/ {{ tarifa.toFixed(2) }}/kWh</p>
      </div>
    </div>

    <!-- Si tiene dispositivos -->
    <div v-if="hasDevices" class="charts">
      <div v-if="personalization.chartDevice" class="chart">
        <h3>Consumo por Dispositivo (kWh)</h3>
        <canvas id="chartConsumoMensual"></canvas>
      </div>

      <div v-if="personalization.chartCost" class="chart">
        <h3>Costos Estimados por Dispositivo (S/)</h3>
        <canvas id="chartCostosMensuales"></canvas>
      </div>
    </div>

    <!-- Si no hay dispositivos -->
    <div v-else class="empty-state">
      <p>🔌 No tienes dispositivos vinculados todavía.</p>
      <small>Agrega un dispositivo para visualizar tus métricas.</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { DevicesApi, onDeviceChange } from '@/device/infrastructure/devices.endpoint.js'
import { usePersonalizationStore } from '@/personalization/application/personalization.js'
import { useAuth } from '@/identity/application/composables/useAuth.js'

const personalization = usePersonalizationStore()
const { userId, getCurrentUser } = useAuth()

Chart.register(...registerables)

const tarifa = ref(0)
const hasDevices = ref(false)
const consumoMensual = ref([])
const costosMensuales = ref([])
const charts = { consumo: null, costos: null }

// Métricas totales para las viñetas
const totalConsumo = ref(0)
const totalCosto = ref(0)

/* ==========================================================
   📡 Cargar datos desde la API
   ========================================================== */
async function reloadData() {
  const devices = await DevicesApi.getByUserId(userId)
  hasDevices.value = devices.length > 0

  if (!hasDevices.value) {
    destroyCharts()
    return
  }

  // Mapear datos del backend
  consumoMensual.value = devices.map(d => parseFloat(d.metrics?.monthly ?? 0))
  costosMensuales.value = devices.map(d => parseFloat(d.metrics?.estimatedCost ?? 0))

  const tarifas = devices.map(d => parseFloat(d.metrics?.tariff ?? 0)).filter(v => v > 0)
  tarifa.value = tarifas.length ? tarifas.reduce((a, b) => a + b) / tarifas.length : 0

  // Calcular totales para las viñetas
  totalConsumo.value = consumoMensual.value.reduce((a, b) => a + b, 0)
  totalCosto.value = costosMensuales.value.reduce((a, b) => a + b, 0)

  await nextTick()
  drawCharts(devices)
}

/* ==========================================================
   🎨 Crear los gráficos
   ========================================================== */
function destroyCharts() {
  Object.values(charts).forEach(ch => ch?.destroy?.())
  charts.consumo = charts.costos = null
}

function drawCharts(devices) {
  const c1 = document.getElementById('chartConsumoMensual')
  const c2 = document.getElementById('chartCostosMensuales')
  if (!c1 || !c2) return

  destroyCharts()

  const labels = devices.map(d => d.name || `Dispositivo ${d.id}`)

  charts.consumo = new Chart(c1.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Consumo (kWh)',
        data: consumoMensual.value,
        backgroundColor: '#0b2541'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  })

  charts.costos = new Chart(c2.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Costo (S/)',
        data: costosMensuales.value,
        borderColor: '#f46161',
        backgroundColor: 'rgba(244,97,97,0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#f46161',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  })
}

/* ==========================================================
   🔔 Reacción a cambios de dispositivos
   ========================================================== */
let stopListening

onMounted(async () => {
  await personalization.loadPersonalization()
  await getCurrentUser() // Inicializar usuario actual
  await reloadData()
  stopListening = onDeviceChange(async () => {
    console.log('📡 Cambio en dispositivos → recargando dashboard básico...')
    await reloadData()
  })
})

onBeforeUnmount(() => {
  stopListening?.()
  destroyCharts()
})
</script>

<style scoped>
.basic-dashboard {
  max-width: 900px;
  margin: 2rem auto;
  font-family: 'Inter', sans-serif;
  color: #0b2541;
  text-align: center;
}

.title {
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.summary-cards {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.summary-cards .card {
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1rem 1.5rem;
  text-align: center;
}

.summary-cards .emoji {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.25rem;
}

.summary-cards .label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #555;
}

.summary-cards .value {
  font-size: 1.2rem;
  font-weight: 600;
}

.charts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart {
  background: #ffffff;
  border-radius: 1rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.empty-state {
  background: #fff;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.empty-state p { font-size: 1rem; margin-bottom: 0.25rem; }
.empty-state small { color: #555; }

@media (max-width: 768px) {
  .charts { grid-template-columns: 1fr; }
}
</style>
