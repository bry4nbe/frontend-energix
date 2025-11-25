<template>
  <div class="plans-wrap">
    <h2 class="title">{{ t('subscriptions.title') }}</h2>
    <div class="options-bar">
      <button
          v-for="option in options"
          :key="option"
          :class="{ active: selectedOption === option }"
          @click="selectedOption = option"
      >
        {{ t(`subscriptions.options.${option}`) }}
      </button>
    </div>
    <p class="subtitle">{{ t('subscriptions.subtitle') }}</p>
    <p class="description">{{ t('subscriptions.description') }}</p>

    <div v-if="selectedOption === 'change'" class="plans-grid">
      <!-- Plan Básico -->
      <article class="plan-card basic" :class="{ 'is-current': user?.plan === 'basic' }">
        <header class="plan-head">
          <h3>{{ t('subscriptions.plans.basic.name') }}</h3>
          <p class="meta">{{ t('subscriptions.plans.basic.meta') }}</p>
        </header>
        <ul class="bullets">
          <li>{{ t('subscriptions.plans.basic.features.history') }}</li>
          <li>{{ t('subscriptions.plans.basic.features.alerts') }}</li>
          <li>{{ t('subscriptions.plans.basic.features.manual') }}</li>
        </ul>
        <button
            v-if="user?.plan === 'basic'"
            class="btn btn-muted" disabled>{{ t('subscriptions.buttons.current') }}</button>
        <button
            v-else
            class="btn btn-primary"
            @click="changePlan('basic')">{{ t('subscriptions.buttons.choose', { plan: t('subscriptions.plans.basic.name') }) }}</button>
      </article>

      <!-- Plan Estudiantil (actual) -->
      <article class="plan-card student" :class="{ 'is-current': user?.plan === 'student' }">
        <header class="plan-head">
          <h3>{{ t('subscriptions.plans.student.name') }}</h3>
          <p class="meta">{{ t('subscriptions.plans.student.meta') }}</p>
        </header>
        <ul class="bullets">
          <li>{{ t('subscriptions.plans.student.features.basic') }}</li>
          <li>{{ t('subscriptions.plans.student.features.extendedHistory') }}</li>
          <li>{{ t('subscriptions.plans.student.features.recommendations') }}</li>
          <li>{{ t('subscriptions.plans.student.features.smartAlerts') }}</li>
          <li>{{ t('subscriptions.plans.student.features.deviceLimit') }}</li>
        </ul>
        <button
            v-if="user?.plan === 'student'"
            class="btn btn-muted" disabled>{{ t('subscriptions.buttons.current') }}</button>
        <button
            v-else
            class="btn btn-primary"
            @click="changePlan('student')">{{ t('subscriptions.buttons.choose', { plan: t('subscriptions.plans.student.name') }) }}</button>
      </article>

      <!-- Plan Familiar -->
      <article class="plan-card family" :class="{ 'is-current': user?.plan === 'family' }">
        <header class="plan-head">
          <h3>{{ t('subscriptions.plans.family.name') }}</h3>
          <p class="meta">{{ t('subscriptions.plans.family.meta') }}</p>
        </header>
        <ul class="bullets">
          <li>{{ t('subscriptions.plans.family.features.student') }}</li>
          <li>{{ t('subscriptions.plans.family.features.unlimitedHistory') }}</li>
          <li>{{ t('subscriptions.plans.family.features.forecast') }}</li>
          <li>{{ t('subscriptions.plans.family.features.export') }}</li>
        </ul>
        <button
            v-if="user?.plan === 'family'"
            class="btn btn-muted" disabled>{{ t('subscriptions.buttons.current') }}</button>
        <button
            v-else
            class="btn btn-primary"
            @click="changePlan('family')">{{ t('subscriptions.buttons.choose', { plan: t('subscriptions.plans.family.name') }) }}</button>
      </article>

    </div>
    <div v-else-if="selectedOption === 'renew'" class="plans-grid">
      <article class="plan-card student is-current">
        <header class="plan-head">
          <h3>{{ t('subscriptions.plans.student.name') }}</h3>
          <p class="meta">{{ t('subscriptions.plans.student.meta') }}</p>
        </header>
        <ul class="bullets">
          <li>{{ t('subscriptions.plans.student.features.basic') }}</li>
          <li>{{ t('subscriptions.plans.student.features.extendedHistory') }}</li>
          <li>{{ t('subscriptions.plans.student.features.recommendations') }}</li>
          <li>{{ t('subscriptions.plans.student.features.smartAlerts') }}</li>
        </ul>
        <button class="btn btn-primary">{{ t('subscriptions.buttons.renew') }}</button>
      </article>
    </div>

    <div v-else-if="selectedOption === 'cancel'" class="plans-grid">
      <article class="plan-card student is-current">
        <header class="plan-head">
          <h3>{{ t('subscriptions.plans.student.name') }}</h3>
          <p class="meta">{{ t('subscriptions.plans.student.meta') }}</p>
        </header>
        <ul class="bullets">
          <li>{{ t('subscriptions.plans.student.features.basic') }}</li>
          <li>{{ t('subscriptions.plans.student.features.extendedHistory') }}</li>
          <li>{{ t('subscriptions.plans.student.features.recommendations') }}</li>
          <li>{{ t('subscriptions.plans.student.features.smartAlerts') }}</li>
        </ul>
        <button class="btn btn-primary">{{ t('subscriptions.buttons.cancel') }}</button>
      </article>
    </div>
    <!-- Divider -->
    <hr class="divider" />

    <section class="billing-wrap">
      <h3 class="billing-title">{{ t('subscriptions.billing.title') }}</h3>
      <p class="billing-subtitle">{{ t('subscriptions.billing.subtitle') }}</p>

      <form class="card-form" @submit.prevent="saveCard">
        <div class="row">
          <label>
            {{ t('subscriptions.billing.cardholder') }}
            <input v-model.trim="cardholder" type="text" :placeholder="t('subscriptions.billing.cardholderPlaceholder')" />
          </label>
        </div>

        <div class="row two">
          <label>
            {{ t('subscriptions.billing.cardNumber') }}
            <input
                v-model="cardnumber"
                @input="formatCardNumber"
                inputmode="numeric"
                autocomplete="cc-number"
                :placeholder="t('subscriptions.billing.cardNumberPlaceholder')"
            />
          </label>

          <label>
            {{ t('subscriptions.billing.expiry') }}
            <input
                v-model="expiry"
                @input="formatExpiry"
                inputmode="numeric"
                autocomplete="cc-exp"
                :placeholder="t('subscriptions.billing.expiryPlaceholder')"
                maxlength="5"
            />
          </label>

          <label>
            {{ t('subscriptions.billing.cvv') }}
            <input
                v-model="cvv"
                @input="onlyDigits('cvv', 4)"
                inputmode="numeric"
                autocomplete="cc-csc"
                :placeholder="t('subscriptions.billing.cvvPlaceholder')"
                maxlength="4"
            />
          </label>
        </div>

        <label class="chk">
          <input type="checkbox" v-model="asDefault" />
          {{ t('subscriptions.billing.saveAsDefault') }}
        </label>

        <div class="actions">
          <button class="btn btn-primary" type="submit">{{ t('subscriptions.billing.saveButton') }}</button>
          <span v-if="saveMsg" class="success">{{ saveMsg }}</span>
          <span v-if="errorMsg" class="error">{{ errorMsg }}</span>
        </div>
      </form>
    </section>
  </div>
  <!-- Separador -->
  <hr class="divider" />
  <!-- TARJETAS GUARDADAS -->
  <section class="saved-cards-wrap">
    <h3 class="billing-title">{{ t('subscriptions.billing.savedCards') }}</h3>
    <p class="billing-subtitle" v-if="!savedCards.length">{{ t('subscriptions.billing.noCards') }}</p>

    <ul class="saved-list" v-else>
      <li v-for="c in savedCards" :key="c.id" class="saved-item">
        <div class="left">
          <div class="brand">{{ c.brand }}</div>
          <div class="meta">•••• •••• •••• {{ c.last4 }} · {{ c.exp }}</div>
          <span v-if="c.default" class="badge-default">{{ t('subscriptions.billing.default') }}</span>
        </div>
        <div class="right">
          <button class="btn btn-danger" @click="removeCard(c.id)">{{ t('subscriptions.billing.remove') }}</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const user = ref(null)
const loading = ref(true)
const error = ref(null)

// Id del usuario actual simulado
const userId = 3

onMounted(async () => {
  try {
    const res = await fetch(`http://localhost:3001/users/${userId}`)
    if (!res.ok) throw new Error('Error al obtener datos del usuario')
    user.value = await res.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function changePlan(newPlan) {
  if (!user.value) return
  try {
    const res = await fetch(`http://localhost:3001/users/${user.value.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: newPlan })
    })
    if (!res.ok) throw new Error(t('subscriptions.messages.errors.changePlan'))
    user.value.plan = newPlan
    alert(t('subscriptions.messages.planChanged', { plan: newPlan.toUpperCase() }))
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

// Opciones de la barra superior
const options = ['change', 'renew', 'cancel']
const selectedOption = ref('change')

// --------- Estado tarjeta ----------
const cardholder = ref('')
const cardnumber = ref('')   // mostrado con espacios
const expiry = ref('')       // MM/AA
const cvv = ref('')
const asDefault = ref(true)

const saveMsg = ref('')
const errorMsg = ref('')

// --------- Helpers de formato/validación ----------
function onlyDigits(key, max = 4) {
  const v = cvv; // por ahora solo tenemos CVV
  v.value = v.value.replace(/\D/g, '').slice(0, max);
}

function formatCardNumber() {
  const digits = cardnumber.value.replace(/\D/g, '').slice(0, 16)
  cardnumber.value = digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry() {
  const d = expiry.value.replace(/\D/g, '').slice(0, 4)
  expiry.value = d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d
}

function luhnValid(num) {
  // num sin espacios
  const s = num.replace(/\s+/g, '')
  if (!/^\d{13,19}$/.test(s)) return false
  let sum = 0, dbl = false
  for (let i = s.length - 1; i >= 0; i--) {
    let n = parseInt(s[i], 10)
    if (dbl) { n *= 2; if (n > 9) n -= 9 }
    sum += n; dbl = !dbl
  }
  return sum % 10 === 0
}

function expiryValid(mmYY) {
  if (!/^\d{2}\/\d{2}$/.test(mmYY)) return false
  const [mm, yy] = mmYY.split('/').map(n => parseInt(n, 10))
  if (mm < 1 || mm > 12) return false
  const year = 2000 + yy
  const now = new Date()
  const lastDay = new Date(year, mm, 0) // último día del mes
  return lastDay >= new Date(now.getFullYear(), now.getMonth(), 1)
}

function saveCard() {
  saveMsg.value = ''
  errorMsg.value = ''

  if (!cardholder.value.trim()) { errorMsg.value = t('subscriptions.messages.errors.cardholderRequired'); return }
  if (!luhnValid(cardnumber.value)) { errorMsg.value = t('subscriptions.messages.errors.invalidCard'); return }
  if (!expiryValid(expiry.value)) { errorMsg.value = t('subscriptions.messages.errors.invalidExpiry'); return }
  if (!/^\d{3,4}$/.test(cvv.value)) { errorMsg.value = t('subscriptions.messages.errors.invalidCvv'); return }

  // Aquí llamarías a tu backend: POST /billing/payment-methods
  // fetch('/api/payment-methods', { method:'POST', body: JSON.stringify({...}) })

  saveMsg.value = t('subscriptions.messages.cardSaved')
}

// Lista mock de tarjetas (cámbialo cuando conectes tu backend)
const savedCards = ref([
  { id: 'card_1', brand: 'Visa',       last4: '4242', exp: '12/27', default: true  },
  { id: 'card_2', brand: 'Mastercard', last4: '4444', exp: '08/26', default: false },
])

function removeCard(id) {
  if (!confirm(t('subscriptions.billing.confirmRemove'))) return
  const idx = savedCards.value.findIndex(c => c.id === id)
  if (idx !== -1) savedCards.value.splice(idx, 1)

}

</script>

<style scoped>
/* Contenedor */
.saved-cards-wrap{
  background:#fff;
  border:2px solid var(--border);
  border-radius:16px;
  padding:18px 20px;
  box-shadow:var(--shadow);
  margin-top:16px;
}

/* Lista */
.saved-list{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px }
.saved-item{
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  border:1px solid #e5e7eb; border-radius:12px; padding:12px 14px; background:#fafafa;
}
.saved-item .left{ display:flex; align-items:center; gap:12px; flex-wrap:wrap }
.saved-item .brand{ font-weight:700; color:#0f172a }
.saved-item .meta{ color:#6b7280 }
.badge-default{
  background:#e7eff9; color:#0e2c4a; border:1px solid #bfd4f3;
  padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600;
}

/* Botón eliminar */
.btn-danger{
  background:#dc2626; color:#fff; border:none; border-radius:10px;
  padding:8px 14px; font-weight:600; cursor:pointer;
  box-shadow:0 2px 4px rgba(0,0,0,.12); transition:background .15s ease;
}
.btn-danger:hover{ background:#b91c1c }

.divider{
  border:0; height:1px; background:#e5e7eb; margin:28px 0 16px;
}

.billing-wrap{
  background:#fff;
  border:2px solid var(--border);
  border-radius:16px;
  padding:18px 20px;
  box-shadow:var(--shadow);
  margin-top:8px;
}

.billing-title{
  margin:0 0 2px; color:var(--ink); font-weight:800; font-size:1.2rem;
}
.billing-subtitle{ margin:0 0 14px; color:var(--muted) }

.card-form{ display:flex; flex-direction:column; gap:12px; }
.row{ display:flex; gap:12px; flex-wrap:wrap }
.row.two > label{ flex:1 1 180px }

label{ color:#111; font-weight:600; font-size:.9rem; display:flex; flex-direction:column; gap:6px }
input{
  background:#f9fafb; border:1px solid #d1d5db; border-radius:10px;
  padding:10px 12px; font-size:0.95rem; color:#0f172a; outline:none;
}
input:focus{ border-color:#001f49; box-shadow:0 0 0 3px rgba(0,31,73,.12) }

.chk{ display:flex; align-items:center; gap:8px; font-weight:600; color:#374151 }
.actions{ display:flex; align-items:center; gap:12px; margin-top:4px }
.success{ color:#059669; font-weight:600 }
.error{ color:#b91c1c; font-weight:600 }

:root{
  --navy:#0e2c4a;
  --navy-hover:#0b2239;
  --ink:#0f172a;
  --muted:#6b7280;
  --border:#e5e7eb;
  --blue-soft:#e7eff9;
  --blue-soft-border:#bfd4f3;
  --yellow-soft:#fff7da;
  --yellow-soft-border:#f2e4a6;
  --card-radius:14px;
  --shadow:0 2px 10px rgba(0,0,0,.06);
}

.plans-wrap{padding:32px;background:#f9fafb;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.title{margin:0;color:var(--ink);font-weight:800;font-size:1.8rem}
.subtitle{margin:4px 0 2px;color:var(--ink);font-size:1.2rem;font-weight:600}
.description{margin:0 0 18px;color:var(--muted);font-size:.95rem}

.plans-grid{
  display:grid;
  grid-template-columns: repeat(auto-fit,minmax(260px,1fr));
  gap:20px;
}

/* Tarjetas base */
.plan-card{
  background:#fff;
  border:2px solid var(--border);
  border-radius: 16px;
  padding:18px 20px 16px;
  box-shadow:var(--shadow);
  display:flex;flex-direction:column;justify-content:space-between;
  transition:transform .15s ease, box-shadow .15s ease;
}
.plan-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.08)}

.plan-head h3{margin:0;font-weight:700;color:var(--ink)}
.meta{margin:4px 0 0;font-size:.9rem;color:var(--muted)}
.bullets{margin:12px 0 16px;padding-left:18px;color:#1f2937}
.bullets li{margin:6px 0}

/* Variantes */
.plan-card.basic{background:#fff;border-color:var(--border)}
.plan-card.student{background:var(--blue-soft);border-color:var(--blue-soft-border)}
.plan-card.family{background:var(--yellow-soft);border-color:var(--yellow-soft-border)}
.plan-card.is-current{outline:2px solid var(--blue-soft-border);box-shadow:0 0 0 4px rgba(191,212,243,.35),var(--shadow)}

/* Botones */
.btn{
  align-self:flex-start;border-radius:10px;padding:10px 18px;
  border:none;cursor:pointer;font-weight:600;
  transition:background .15s ease,opacity .15s ease;
}
/* Botón azul */
.btn-primary {
  display: block;
  margin: 12px auto 0;        /* centra el botón */
  background: #001f49;        /* azul marino intenso */
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,.15);
  transition: background 0.2s ease, transform 0.1s ease;
}
.btn-primary:hover {
  background: #00163a;
  transform: translateY(-1px);
}

/* Botón gris del plan actual */
.btn-muted {
  display: block;
  margin: 12px auto 0;
  background: #9aa3ad;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: default;
  opacity: 0.9;
}


.options-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin: 24px 0 12px 0;
}
.options-bar button {
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 1em;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s, color 0.2s;
}
.options-bar button.active,
.options-bar button:hover {
  background: #001f49;
  color: #fff;
}


/* Responsive */
@media(max-width:980px){.plans-grid{grid-template-columns:1fr}}
</style>

