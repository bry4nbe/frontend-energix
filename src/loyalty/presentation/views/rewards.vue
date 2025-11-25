<template>
  <section class="wrap">
    <h2 class="title">{{ t('rewards.title') }}</h2>
    <p class="subtitle">{{ t('rewards.subtitle') }}</p>

    <!-- ===== Plans Dashboard View ===== -->
    <div class="grid">
      <article class="card kpi">
        <div class="kpi-top">
          <h3>{{ t('rewards.kpi.totalPoints') }}</h3>
          <div class="points">{{ points }}</div>
        </div>
        <div class="progress">
          <div class="bar" :style="{ width: Math.min(levelProgress, 100) + '%' }"></div>
        </div>
        <p class="muted">{{ t('rewards.kpi.level', { level }) }} · {{ t('rewards.kpi.levelProgress', { progress: levelProgress.toFixed(0) }) }}</p>
      </article>

      <article class="card kpi">
        <h3>{{ t('rewards.kpi.referrals') }}</h3>
        <p class="big">{{ stats.total }}</p>
        <p class="muted">{{ t('rewards.kpi.active') }}: {{ stats.activated }} · {{ t('rewards.kpi.rewarded') }}: {{ stats.rewarded }}</p>
      </article>

      <article class="card kpi">
        <h3>{{ t('rewards.kpi.policy') }}</h3>
        <ul class="bullets">
          <li>{{ t('rewards.policy.activeCode') }}</li>
          <li v-html="t('rewards.policy.rewardPerReferral', { points: POLICY.rewardPoints })"></li>
          <li v-html="t('rewards.policy.maxUses', { max: POLICY.maxUsesPerCode })"></li>
          <li>{{ t('rewards.policy.requiresPlan') }}</li>
        </ul>
      </article>
    </div>

    <!-- ===== Generate Referral Code (+ policy) ===== -->
    <article class="card">
      <div class="row between">
        <h3>{{ t('rewards.code.title') }}</h3>
        <span v-if="activeCode" class="badge">{{ t('rewards.code.activeLabel') }}</span>
      </div>

      <div class="code-box" v-if="activeCode">
        <div class="code">{{ activeCode }}</div>
        <div class="code-actions">
          <button class="btn btn-primary" @click="copyCode">{{ t('rewards.code.copy') }}</button>
          <button class="btn outline" @click="shareLink">{{ t('rewards.code.share') }}</button>
          <button class="btn danger" @click="revokeCode">{{ t('rewards.code.revoke') }}</button>
        </div>
        <p class="muted">{{ t('rewards.code.expires', { date: expiresAtHuman }) }}</p>
      </div>

      <div v-else class="no-code">
        <p class="muted">{{ t('rewards.code.noActive') }}</p>
        <button class="btn btn-primary" :disabled="!canGenerate" @click="generateCode">{{ t('rewards.code.generate') }}</button>
        <p v-if="!hasActivePlan" class="error small">{{ t('rewards.code.requiresPlan') }}</p>
        <p v-if="cooldownMsg" class="muted small">{{ t('rewards.code.cooldown', { time: cooldownMsg }) }}</p>
      </div>
    </article>

    <!-- ===== Reward Referrer / Referrer Rewarded ===== -->
    <article class="card">
      <h3>{{ t('rewards.history.title') }}</h3>

      <table class="table" v-if="referrals.length">
        <thead>
        <tr>
          <th>{{ t('rewards.history.user') }}</th>
          <th>{{ t('rewards.history.code') }}</th>
          <th>{{ t('rewards.history.status') }}</th>
          <th>{{ t('rewards.history.date') }}</th>
          <th>{{ t('rewards.history.points') }}</th>
          <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="r in referrals" :key="r.id">
          <td>{{ r.user }}</td>
          <td>{{ r.code }}</td>
          <td>
            <span :class="['status', r.status]">{{ labelStatus(r.status) }}</span>
          </td>
          <td>{{ formatDate(r.date) }}</td>
          <td>{{ r.points }}</td>
          <td class="actions-td">
            <button
                v-if="r.status === 'activated'"
                class="btn tiny btn-primary"
                @click="rewardReferrer(r.id)"
            >
              {{ t('rewards.history.creditReward') }}
            </button>
          </td>
        </tr>
        </tbody>
      </table>

      <p v-else class="muted">{{ t('rewards.history.noReferrals') }}</p>
    </article>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { rewardsEndpoint } from '../../infrastructure/rewards_endpoint.js'
import { RewardsService } from '../../domain/rewards.service.js'
import { useAuth } from '../../../identity/application/composables/useAuth.js'

const { t } = useI18n()
const { currentUser, getCurrentUser } = useAuth()

/** ===== Estado de autenticación ===== */
const hasActivePlan = computed(() => currentUser.value?.plan && currentUser.value.plan !== 'none')

/** ===== Política ===== */
const POLICY = {
  rewardPoints: 50,
  maxUsesPerCode: 5,
  cooldownHours: 24,
}

/** ===== Estado ===== */
const points = ref(0)
const totalPoints = ref(0)
const level = computed(() => RewardsService.calculateLevel(totalPoints.value).level)
const levelProgress = computed(() => RewardsService.calculateLevel(totalPoints.value).progress)

const activeCode = ref('')
const codeExpiresAt = ref(null)
const lastGeneratedAt = ref(null)
const cooldownMsg = ref('')
const loading = ref(false)
const error = ref('')
const currentReward = ref(null)

const referrals = ref([])

const stats = computed(() => RewardsService.calculateReferralStats(referrals.value))

/** ===== Helpers ===== */
function formatDate(d) {
  const dt = new Date(d)
  return dt.toLocaleDateString()
}

const canGenerate = computed(() => {
  if (!hasActivePlan.value) return false
  if (activeCode.value) return false

  const result = RewardsService.canGenerateNewCode(currentReward.value, POLICY.cooldownHours)

  if (!result.canGenerate && result.remainingTime) {
    cooldownMsg.value = result.remainingTime
  } else {
    cooldownMsg.value = ''
  }

  return result.canGenerate
})

const expiresAtHuman = computed(() =>
    codeExpiresAt.value ? new Date(codeExpiresAt.value).toLocaleString() : ''
)

function labelStatus(s) {
  return t(`rewards.history.statuses.${s}`)
}

/** ===== Acciones ===== */
async function generateCode() {
  if (!canGenerate.value || !currentUser.value?.id) return

  loading.value = true
  error.value = ''

  try {
    const result = await rewardsEndpoint.generateCode(String(currentUser.value.id))
    currentReward.value = result
    activeCode.value = result.activeCode
    codeExpiresAt.value = result.expiresAt ? new Date(result.expiresAt) : null
    lastGeneratedAt.value = result.lastGeneratedAt ? new Date(result.lastGeneratedAt) : null
    totalPoints.value = result.totalPoints || 0
  } catch (err) {
    error.value = err.message || 'Error al generar código'
    console.error('Error generando código:', err)
  } finally {
    loading.value = false
  }
}

async function loadRewards() {
  if (!currentUser.value?.id) return

  try {
    const rewards = await rewardsEndpoint.getUserRewards(String(currentUser.value.id))
    currentReward.value = rewards

    if (rewards) {
      activeCode.value = rewards.activeCode || ''
      codeExpiresAt.value = rewards.expiresAt ? new Date(rewards.expiresAt) : null
      lastGeneratedAt.value = rewards.lastGeneratedAt ? new Date(rewards.lastGeneratedAt) : null
      totalPoints.value = rewards.totalPoints || 0

      // Verificar si el código ha expirado
      if (activeCode.value && !rewards.isCodeActive()) {
        activeCode.value = ''
        codeExpiresAt.value = null
      }
    }
  } catch (err) {
    // Si no existe el registro, es normal (404)
    if (err.status !== 404) {
      console.error('Error cargando rewards:', err)
    }
  }
}

async function loadReferrals() {
  if (!currentUser.value?.id) return

  try {
    const data = await rewardsEndpoint.getReferrals(String(currentUser.value.id))
    referrals.value = data || []
  } catch (err) {
    if (err.status !== 404) {
      console.error('Error cargando referidos:', err)
    }
  }
}

function copyCode() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(activeCode.value).then(() => {
      alert(t('rewards.code.copied'))
    }).catch(err => {
      console.error('Error al copiar:', err)
    })
  }
}

function shareLink() {
  const link = `${location.origin}/register?ref=${activeCode.value}`
  if (navigator.share) {
    navigator.share({
      title: t('rewards.share.title'),
      text: t('rewards.share.text'),
      url: link
    }).catch(err => console.error('Error al compartir:', err))
  } else {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        alert(t('rewards.code.linkCopied', { link }))
      })
    }
  }
}

async function revokeCode() {
  if (!currentUser.value?.id) return

  if (!confirm('¿Estás seguro de que deseas revocar tu código activo?')) return

  try {
    await rewardsEndpoint.revokeCode(String(currentUser.value.id))
    activeCode.value = ''
    codeExpiresAt.value = null
    if (currentReward.value) {
      currentReward.value.revokeCode()
    }
  } catch (err) {
    console.error('Error revocando código:', err)
  }
}

async function rewardReferrer(id) {
  try {
    const result = await rewardsEndpoint.rewardReferral(id)

    // Actualizar el referido en la lista
    const r = referrals.value.find(x => x.id === id)
    if (r) {
      r.status = 'rewarded'
      r.points = POLICY.rewardPoints
    }

    // Actualizar puntos totales
    if (result.reward) {
      totalPoints.value = result.reward.totalPoints
      currentReward.value = result.reward
    } else {
      totalPoints.value += POLICY.rewardPoints
    }

    alert('¡Recompensa acreditada exitosamente!')
  } catch (err) {
    console.error('Error recompensando referido:', err)
    alert('Error al acreditar la recompensa')
  }
}

onMounted(async () => {
  await getCurrentUser()
  await loadRewards()
  await loadReferrals()
})
</script>

<style scoped>
:root{
  --navy:#0e2c4a;
  --navy-hover:#0b2239;
  --ink:#0f172a;
  --muted:#6b7280;
  --border:#e5e7eb;
  --blue-soft:#e7eff9;
  --blue-soft-border:#bfd4f3;
  --card-radius:14px;
  --shadow:0 2px 10px rgba(0,0,0,.06);
}

.wrap{padding:32px;background:#f9fafb;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.title{margin:0;color:var(--ink);font-weight:800;font-size:1.8rem}
.subtitle{margin:6px 0 16px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.card{background:#fff;border:2px solid var(--border);border-radius:var(--card-radius);padding:16px 18px;box-shadow:var(--shadow)}
.kpi .points{font-size:28px;font-weight:800;color:var(--ink)}
.kpi .big{font-size:26px;font-weight:800;margin:2px 0}
.progress{height:8px;background:#eef2ff;border-radius:12px;margin:10px 0 4px}
.progress .bar{height:100%;background:#001f49;border-radius:12px}
.bullets{margin:8px 0 0; padding-left:18px}
.muted{color:var(--muted)}
.small{font-size:.9rem}

.row{display:flex;gap:10px;align-items:center}
.between{justify-content:space-between}

.badge{background:#dbeafe;border:1px solid var(--blue-soft-border);color:#1e3a8a;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:600}

.code-box{display:flex;flex-direction:column;gap:10px;margin-top:8px}
.code{font-family:ui-monospace, SFMono-Regular, Menlo, monospace;background:#f1f5f9;border:1px dashed #cbd5e1;border-radius:8px;padding:8px 10px;display:inline-block;width:max-content}
.code-actions{display:flex;gap:8px;flex-wrap:wrap}
.no-code{display:flex;gap:12px;align-items:center;margin-top:4px}

.table{width:100%;border-collapse:collapse;margin-top:8px}
.table th,.table td{border-bottom:1px solid #e5e7eb;padding:8px 6px;text-align:left}
.actions-td{width:1%;white-space:nowrap}

.status{padding:2px 8px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb}
.status.pending{background:#fff7ed;border-color:#fed7aa;color:#9a3412}
.status.activated{background:#ecfeff;border-color:#a5f3fc;color:#155e75}
.status.rewarded{background:#ecfdf5;border-color:#bbf7d0;color:#166534}

.btn{border:none;border-radius:10px;padding:10px 14px;font-weight:600;cursor:pointer}
.btn.tiny{padding:6px 10px;border-radius:8px}
.btn-primary{background:#001f49;color:#fff}
.btn-primary:hover{background:#00163a}
.btn.outline{background:#fff;border:1px solid #cbd5e1;color:#0f172a}
.btn.danger{background:#dc2626;color:#fff}
.btn.danger:hover{background:#b91c1c}
</style>
