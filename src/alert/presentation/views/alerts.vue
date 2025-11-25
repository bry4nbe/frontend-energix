

<template>
  <div class="alerts-container">
    <div class="alerts-content">
      <div class="alerts-header">
        <h2 class="alerts-title">{{ t('alerts.title') }}</h2>

        <div class="alerts-actions">
          <!-- Simular solo en Estudiantil / Familiar -->
          <button
              v-if="plan !== 'basic'"
              class="btn-outline"
              @click="simulateAlert"
              :disabled="loading"
              :title="t('alerts.simulateAlert')"
          >
            <span class="add-icon">+</span>
            {{ t('alerts.simulateAlert') }}
          </button>

          <button
              class="btn-outline"
              @click="markAllAsRead"
              :disabled="loading || unreadCount === 0"
          >
            <span class="mark-icon">✓</span>
            {{ t('alerts.markAllAsRead') }}
          </button>
        </div>
      </div>

      <!-- Contador -->
      <div v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount }} {{ unreadCount > 1 ? t('alerts.unreadPlural') : t('alerts.unreadSingular') }}
      </div>

      <!-- Lista -->
      <div class="alerts-list" :class="{ loading }">
        <template v-if="alerts.length">
          <div
              v-for="a in alerts"
              :key="a.id"
              class="alert-item"
              :class="[{ read: a.isRead }, a.type === 'warning' ? 'alert-warning' : 'alert-info']"
              tabindex="0"
              @click="markAsRead(a.id)"
          >
            <div class="alert-content">
              <div class="alert-header-row">
                <div class="alert-badge" :class="{ 'alert-badge-info': a.type === 'info' }">
                  {{ a.badge }}
                </div>
                <div class="alert-timestamp">{{ formatDate(a.timestamp) }}</div>
              </div>
              <div class="alert-message">{{ a.message }}</div>
              <div class="alert-details">{{ a.details }}</div>
            </div>
            <div v-if="!a.isRead" class="unread-indicator"></div>
          </div>
        </template>

        <div v-else-if="!loading" class="alerts-empty">
          <h3>{{ t('alerts.noAlerts') }}</h3>
          <p>{{ t('alerts.noAlertsDescription') }}</p>
        </div>

        <div v-if="loading" class="alerts-loading">
          <div class="spinner"></div>
          <p>{{ t('common.loading') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertsApi } from '@/alert/infrastructure/alerts.endpoint.js'

const { t } = useI18n()

// Estado
const loading = ref(false)
const alerts = ref([])
const currentUser = ref(null)
const plan = ref('basic')

// Helpers
function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('energix-user') || 'null')
  } catch {
    return null
  }
}

const unreadCount = computed(() => alerts.value.filter(a => !a.isRead).length)

// Cargar alertas
async function loadAlerts () {
  loading.value = true
  try {
    currentUser.value = getCurrentUser()
    plan.value = currentUser.value?.plan || 'basic'

    if (!currentUser.value) {
      alerts.value = []
      return
    }

    const data = await AlertsApi.getByUserId(currentUser.value.id)

    // no leídas primero, luego por fecha desc
    alerts.value = data.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
      return new Date(b.timestamp) - new Date(a.timestamp)
    })
  } finally {
    loading.value = false
  }
}

// Formateo fecha
function formatDate (ts) {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'medium' })
      .format(new Date(ts))
}

// Acciones
async function markAsRead (id) {
  const alert = alerts.value.find(a => a.id === id)
  if (!alert || alert.isRead) return
  try {
    await AlertsApi.markAsRead(id)
    alert.isRead = true
  } catch (e) {
    console.error('markAsRead error:', e)
  }
}

async function markAllAsRead () {
  if (!currentUser.value || unreadCount.value === 0) return
  try {
    await AlertsApi.markAllAsRead(currentUser.value.id)
    alerts.value.forEach(a => { a.isRead = true })
  } catch (e) {
    console.error('markAllAsRead error:', e)
  }
}

// Solo para probar en Estudiantil/Familiar
async function simulateAlert () {
  if (!currentUser.value || plan.value === 'basic') return
  const candidates = [
    { type: 'high_consumption', data: { percentage: 85, current: 255, limit: 300 } },
    { type: 'new_device',       data: { deviceType: 'enchufe inteligente' } },
    { type: 'peak_hours',       data: {} },
    { type: 'monthly_report',   data: { month: 'septiembre' } }
  ]
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  try {
    await AlertsApi.generateSystemAlert(currentUser.value.id, pick.type, pick.data)
    await loadAlerts()
  } catch (e) {
    console.error('simulateAlert error:', e)
  }
}

onMounted(loadAlerts)
</script>


<style scoped>
.alerts-container {
  flex: 1;
  padding: 32px;
  background-color: #f9fafb;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.alerts-content {
  max-width: 1024px;
  margin: 0 auto;
}

.alerts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.alerts-title {
  font-size: 28px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.alerts-actions {
  display: flex;
  gap: 12px;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mark-icon, .add-icon {
  font-size: 14px;
  font-weight: bold;
  color: #6b7280;
}

.unread-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.alerts-list {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  min-height: 200px;
}

.alert-item {
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.15s ease;
  cursor: pointer;
  position: relative;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-item:hover {
  background-color: #fafafa;
  transform: translateX(2px);
}

.alert-content {
  padding: 20px 24px;
}

.alert-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.alert-badge {
  background-color: #fef3c7;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.alert-badge-info {
  background-color: #dbeafe;
  color: #1e40af;
}

.alert-timestamp {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 400;
}

.alert-message {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
  line-height: 1.4;
}

.alert-details {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
}

/* Indicador de no leída */
.unread-indicator {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.alert-warning {
  border-left: 4px solid #f59e0b;
}

.alert-info {
  border-left: 4px solid #3b82f6;
}

.alert-item.read {
  opacity: 0.6;
}

.alert-item.read .alert-message {
  color: #6b7280;
}

.alert-item.read:hover {
  opacity: 0.8;
}

.alerts-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.alerts-empty {
  text-align: center;
  padding: 64px 24px;
  color: #6b7280;
}

.alerts-empty h3 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.alerts-empty p {
  font-size: 14px;
}

@media (max-width: 768px) {
  .alerts-container {
    padding: 16px;
  }

  .alerts-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .alerts-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .btn-outline {
    flex: 1;
    min-width: 140px;
  }
}
</style>