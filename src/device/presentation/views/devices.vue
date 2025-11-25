<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import InputSwitch from 'primevue/inputswitch'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

import { DevicesApi } from '@/device/infrastructure/devices.endpoint.js'
import { AlertsApi } from '@/alert/infrastructure/alerts.endpoint.js'
import { getCurrentUser, getPlan } from '@/identity/domain/auth/plan.util.js'

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()

// ===== estado base =====
const user  = ref(getCurrentUser())
const plan  = ref(getPlan()) // 'basic' | 'student' | 'family'
const devices = ref([])
const loading = ref(false)

// ===== reglas por plan =====
const deviceTypeByPlan = computed(() => {
  if (plan.value === 'student') return 'plug'
  if (plan.value === 'family')  return 'sensor'
  return 'manual'
})
const limitByPlan = computed(() => {
  if (plan.value === 'student') return 2
  if (plan.value === 'family')  return Infinity
  return 2
})
const canAdd = computed(() => devices.value.filter(d => d.type === deviceTypeByPlan.value).length < limitByPlan.value)

// ===== ui =====
const search = ref('')
const selected = ref(null)
const newName = ref('')

// ===== modal manual (básico) =====
const deviceCatalog = computed(() => [
  { label: t('devices.catalog.refrigerator'), value: 'refrigerator' },
  { label: t('devices.catalog.washer'), value: 'washer' },
  { label: t('devices.catalog.tv'), value: 'tv' },
  { label: t('devices.catalog.pc'), value: 'pc' },
  { label: t('devices.catalog.other'), value: 'other' },
])
const showManualDialog = ref(false)
const manualForm = ref({ deviceKind:null, metrics:{ monthly:'', estimatedCost:'', tariff:'' } })
const autoManualName = computed(() => {
  const n = devices.value.filter(d => d.type === 'manual').length + 1
  return `${t('devices.manual.device')} ${n}`
})

// ===== zonas (solo familiar) =====
const zones = ref([])
const newZoneName = ref('')
async function loadZones(){
  if (plan.value !== 'family') return
  zones.value = await DevicesApi.getZones(user.value.id)
}
async function addZone(){
  const name = newZoneName.value.trim()
  if (!name) return
  const z = await DevicesApi.createZone(user.value.id, name)
  zones.value.push(z)
  newZoneName.value = ''
  await AlertsApi.generateSystemAlert(user.value.id, 'zone_created', { zoneName: z.name })
  toast.add({ severity:'success', summary: t('devices.zones.created'), life:1200 })
}
async function renameZone(z){
  const name = prompt(t('devices.zones.rename'), z.name)
  if (!name || name.trim() === z.name) return
  const patched = await DevicesApi.renameZone(z.id, name.trim())
  z.name = patched.name
  await AlertsApi.generateSystemAlert(user.value.id, 'zone_renamed', { zoneName: z.name })
  toast.add({ severity:'success', summary: t('devices.zones.updated'), life:1200 })
}
async function removeZone(z){
  confirm.require({
    header: t('common.confirmation'),
    message: t('devices.zones.delete', { name: z.name }),
    icon:'pi pi-exclamation-triangle',
    acceptClass:'p-button-danger',
    acceptLabel: t('common.delete'),
    rejectLabel: t('common.cancel'),
    accept: async () => {
      // quitar la zona a devices asignados
      const affected = devices.value.filter(d => d.zoneId === z.id)
      await Promise.all(affected.map(d => DevicesApi.setDeviceZone(d.id, null)))
      affected.forEach(d => d.zoneId = null)

      await DevicesApi.deleteZone(z.id)
      zones.value = zones.value.filter(x => x.id !== z.id)
      await AlertsApi.generateSystemAlert(user.value.id, 'zone_deleted', { zoneName: z.name })
      toast.add({ severity:'success', summary: t('devices.zones.deleted'), life:1200 })
    }
  })
}
async function updateDeviceZone(row){
  await DevicesApi.setDeviceZone(row.id, row.zoneId || null)
  const z = zones.value.find(x => x.id === row.zoneId)
  await AlertsApi.generateSystemAlert(user.value.id, 'device_zoned', {
    deviceName: row.name,
    zoneName: z?.name || t('devices.noZone')
  })
  toast.add({ severity:'success', summary: t('devices.zones.assigned'), life:1200 })
}

// ===== badge plan =====
const planBadge = computed(() => {
  const name = plan.value === 'student' ? t('devices.plans.student')
      : plan.value === 'family' ? t('devices.plans.family')
      : t('devices.plans.basic')
  const cap  = limitByPlan.value === Infinity ? '∞' : `${devices.value.length}/${limitByPlan.value}`
  return `${name} · ${cap}`
})

// ===== carga =====
async function load(){
  if (!user.value) return
  loading.value = true
  try {
    devices.value = await DevicesApi.getByUserId(user.value.id)
    await loadZones()
  } finally { loading.value = false }
}
onMounted(load)

// ===== tabla =====
const tableData = computed(() =>
    devices.value
        .filter(d => d.type === deviceTypeByPlan.value)
        .filter(d => d.name?.toLowerCase().includes(search.value.toLowerCase()))
)

// ===== acciones =====
async function addDevice(){
  if (!canAdd.value) return toast.add({ severity:'warn', summary: t('devices.limitReached'), life:1500 })

  if (plan.value === 'student' || plan.value === 'family'){
    const index = devices.value.filter(d => d.type === deviceTypeByPlan.value).length + 1
    const created = await DevicesApi.create(user.value.id, { name:`${t('devices.addDevice')} ${index}`, type:deviceTypeByPlan.value, status:'off', online:false })
    devices.value.push(created)
    await AlertsApi.generateSystemAlert(user.value.id, 'new_device', { deviceType: deviceTypeByPlan.value })
    toast.add({ severity:'success', summary: t('devices.messages.added'), life:1400 })
    return
  }

  // básico
  manualForm.value = { deviceKind:null, metrics:{ monthly:'', estimatedCost:'', tariff:'' } }
  showManualDialog.value = true
}

async function createManualDevice(){
  const m = manualForm.value.metrics
  if (!manualForm.value.deviceKind)
    return toast.add({ severity:'warn', summary: t('devices.manual.selectType'), life:1500 })
  if (!m.monthly || !m.estimatedCost)
    return toast.add({ severity:'warn', summary: t('devices.manual.fillFields'), life:1500 })

  const monthly       = Number(m.monthly)
  const estimatedCost = Number(m.estimatedCost)
  const tariff        = m.tariff ? Number(m.tariff) : null
  const dailyAvg      = monthly / 30

  const created = await DevicesApi.create(user.value.id, {
    name: autoManualName.value,
    type: 'manual',
    deviceKind: manualForm.value.deviceKind,
    status:'off', online:false,
    metrics: { monthly, estimatedCost, tariff, dailyAvg }
  })
  devices.value.push(created)
  showManualDialog.value = false

  await AlertsApi.generateSystemAlert(user.value.id, 'new_device', { deviceType:'manual' })
  toast.add({ severity:'success', summary:'Dispositivo manual agregado', life:1400 })
}

async function togglePower(row){
  if (plan.value === 'basic') return
  const next = row.status === 'on' ? 'off' : 'on'
  const patched = await DevicesApi.update(row.id, { status: next, online: next === 'on' })
  row.status = patched.status
  row.online = patched.online
  await AlertsApi.generateSystemAlert(user.value.id, 'power_changed', { deviceName: row.name, status: row.status })
}

async function rename(){
  if (plan.value === 'basic') return
  if (!selected.value || !newName.value.trim()) return
  const oldName = selected.value.name
  const patched = await DevicesApi.update(selected.value.id, { name: newName.value.trim() })
  selected.value.name = patched.name
  newName.value = ''
  await AlertsApi.generateSystemAlert(user.value.id, 'device_renamed', { oldName, newName: patched.name })
  toast.add({ severity:'success', summary:'Nombre actualizado', life:1200 })
}

async function unlink(){
  if (!selected.value) return
  const toRemove = { ...selected.value }
  confirm.require({
    header:'Confirmación',
    message:`¿Desvincular "${toRemove.name}"?`,
    icon:'pi pi-exclamation-triangle',
    acceptClass:'p-button-danger',
    acceptLabel:'Desvincular',
    rejectLabel:'Cancelar',
    accept: async () => {
      await DevicesApi.remove(toRemove.id)
      devices.value = devices.value.filter(x => x.id !== toRemove.id)
      selected.value = null
      await AlertsApi.generateSystemAlert(user.value.id, 'device_unlinked', {
        deviceName: toRemove.name,
        deviceType: toRemove.type || deviceTypeByPlan.value
      })
      toast.add({ severity:'success', summary:'Dispositivo desvinculado', life:1400 })
    }
  })
}

function severityForStatus(s){ return s === 'on' ? 'success' : 'danger' }
const deviceTypeByPlanLabel = computed(() =>
    deviceTypeByPlan.value === 'plug' ? 'Enchufe'
        : deviceTypeByPlan.value === 'sensor' ? 'Sensor'
            : 'Manual'
)
</script>

<template>
  <Toast />
  <ConfirmDialog />

  <div class="devices-wrap">
    <div class="header">
      <h2>{{ t('devices.title') }}</h2>
      <Tag :value="planBadge" severity="info" />
    </div>

    <!-- Agregar -->
    <Card class="mb-3">
      <template #title>{{ t('devices.addDevice') }}</template>
      <template #content>
        <div class="actions">
          <Button class="btn-oxford"
                  :label="plan === 'basic' ? t('devices.addManual') : deviceTypeByPlan === 'plug' ? t('devices.addPlug') : t('devices.addSensor')"
                  :disabled="!canAdd"
                  @click="addDevice" />
          <Tag v-if="!canAdd" :value="t('devices.limitReached')" severity="danger" />
        </div>
        <small class="hint">
          {{ t('devices.plan') }}: <b>{{ plan === 'basic' ? t('devices.plans.basic') : plan === 'student' ? t('devices.plans.student') : t('devices.plans.family') }}</b>.
          {{ t('devices.allowedType') }}: <b>{{ deviceTypeByPlanLabel }}</b>.
        </small>
      </template>
    </Card>

    <!-- Lista -->
    <Card class="mb-3">
      <template #title>{{ t('devices.list') }}</template>
      <template #content>
        <div class="filters">
          <IconField iconPosition="left" class="search-field w-20rem">
            <InputIcon class="pi pi-search" />
            <InputText v-model="search" :placeholder="t('devices.search')" />
          </IconField>
        </div>

        <DataTable :value="tableData" :loading="loading" dataKey="id" selectionMode="single" v-model:selection="selected">
          <Column field="name" :header="t('devices.name')" />
          <Column :header="t('devices.type')">
            <template #body="{ data }">
              {{ data.type === 'plug' ? t('devices.types.plug') : data.type === 'sensor' ? t('devices.types.sensor') : t('devices.types.manual') }}
            </template>
          </Column>

          <!-- Zona (solo familiar) -->
          <Column v-if="plan === 'family'" :header="t('devices.zone')">
            <template #body="{ data }">
              <Dropdown
                  v-model="data.zoneId"
                  :options="zones"
                  optionLabel="name"
                  optionValue="id"
                  :placeholder="t('devices.noZone')"
                  class="w-12rem"
                  appendTo="body"
                  @change="updateDeviceZone(data)"
              />
            </template>
          </Column>

          <!-- Power + Estado (no básico) -->
          <Column v-if="plan !== 'basic'" :header="t('devices.power')">
            <template #body="{ data }">
              <InputSwitch :modelValue="data.status === 'on'" @update:modelValue="() => togglePower(data)" />
            </template>
          </Column>
          <Column v-if="plan !== 'basic'" :header="t('devices.status')">
            <template #body="{ data }">
              <Tag :value="data.status === 'on' ? t('devices.turnOn') : t('devices.turnOff')"
                   :severity="severityForStatus(data.status)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Personalizar / Desvincular (no básico) -->
    <Card v-if="plan !== 'basic'">
      <template #title>{{ t('devices.customize') }}</template>
      <template #content>
        <div class="edit-row">
          <Dropdown v-model="selected" :options="tableData" optionLabel="name" :placeholder="t('devices.selectDevice')"
                    class="w-20rem drop-right" appendTo="self" />
          <InputText v-model="newName" :placeholder="t('devices.newName')" class="w-20rem" />
          <Button :label="t('common.save')" :disabled="!selected || !newName" @click="rename" class="btn-oxford" />
          <Button :label="t('devices.unlink')" severity="danger" :disabled="!selected" @click="unlink" class="btn-h31" />
        </div>
      </template>
    </Card>

    <!-- Solo Desvincular (básico) -->
    <Card v-else>
      <template #title>{{ t('devices.unlinkSection') }}</template>
      <template #content>
        <div class="edit-row">
          <Dropdown v-model="selected" :options="tableData" optionLabel="name" :placeholder="t('devices.selectDevice')"
                    class="w-20rem drop-right" appendTo="self" />
          <Button :label="t('devices.unlink')" severity="danger" :disabled="!selected" @click="unlink" class="btn-h31" />
        </div>
      </template>
    </Card>

    <!-- Zonas (solo familiar) -->
    <Card v-if="plan === 'family'" class="mt-3">
      <template #title>{{ t('devices.zones.title') }}</template>
      <template #content>
        <div class="edit-row">
          <InputText v-model="newZoneName" :placeholder="t('devices.zones.newZone')" class="w-20rem" />
          <Button :label="t('devices.zones.add')" class="btn-oxford" :disabled="!newZoneName" @click="addZone" />
        </div>

        <DataTable :value="zones" dataKey="id" class="mt-2">
          <Column field="name" :header="t('devices.name')" />
          <Column :header="t('devices.actions')" :style="{width:'200px'}">
            <template #body="{ data }">
              <div class="row-actions">
                <Button :label="t('common.edit')" size="small" text @click="renameZone(data)" />
                <Button :label="t('common.delete')" size="small" severity="danger" text @click="removeZone(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modal Manual -->
    <Dialog v-model:visible="showManualDialog" modal :header="t('devices.manual.title')" :style="{ width:'520px' }">
      <div class="form-grid">
        <label>{{ t('devices.name') }}</label>
        <div class="auto-name">{{ autoManualName }}</div>

        <label>{{ t('devices.manual.deviceType') }}</label>
        <Dropdown v-model="manualForm.deviceKind" :options="deviceCatalog" optionLabel="label" optionValue="value"
                  :placeholder="t('devices.selectDevice')" appendTo="body" :scrollHeight="'340px'" />

        <label>{{ t('devices.manual.monthlyConsumption') }}</label>
        <InputText v-model="manualForm.metrics.monthly" type="number" inputmode="decimal" />

        <label>{{ t('devices.manual.estimatedCost') }}</label>
        <InputText v-model="manualForm.metrics.estimatedCost" type="number" inputmode="decimal" />

        <label>{{ t('devices.manual.tariff') }}</label>
        <InputText v-model="manualForm.metrics.tariff" type="number" inputmode="decimal" />
      </div>

      <small class="hint">
        Calcularemos el <b>promedio diario</b> ≈ consumo mensual / 30. Con la <b>tarifa</b> puedes contrastar costo ≈ kWh × tarifa.
      </small>

      <template #footer>
        <Button :label="t('common.cancel')" severity="secondary" text class="btn-h31" @click="showManualDialog=false" />
        <Button :label="t('common.save')" class="btn-oxford" @click="createManualDevice" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
:root {
  --oxford: #002349;
}

.devices-wrap {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  margin-bottom: 12px;
}

.header h2 {
  margin: 0;
  color: var(--oxford);
}

.mb-3 {
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.hint {
  color: #64748b;
}

.btn-oxford {
  background: #002349 !important;
  border-color: #002349 !important;
  color: #fff !important;
  height: 31px;
  border-radius: 8px;
  font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 13px;
  font-weight: 400;
}

.btn-h31 {
  height: 31px;
  border-radius: 8px;
  font-family: 'Poppins', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  font-size: 13px;
  font-weight: 400;
}

.w-20rem {
  width: 20rem;
}

.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.edit-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 10px;
}

.form-grid label {
  align-self: center;
  font-weight: 600;
  color: var(--oxford);
}

.auto-name {
  align-self: center;
  font-weight: 600;
}

:deep(::placeholder) {
  color: #4a4a4a !important;
  opacity: 1 !important;
}

:deep(.drop-right) .p-dropdown-panel {
  left: auto !important;
  right: 0 !important;
  transform-origin: top right;
}

</style>
