<template>
  <aside class="sidebar">
    <div class="container-logo">
      <img src="@/assets/logo.png" alt="logo" class="logo-img" />
    </div>
    <Menu :model="items" :pt="menuPt" class="p-menu-custom" />
    <Button
      :label="t('nav.logout')"
      icon="pi pi-sign-out"
      class="logout-btn"
      @click="handleLogout"
      outlined
      severity="danger"
    />
  </aside>
  <div class="content">
    <header class="topbar">
      <div class="header-left">
        <LanguageSwitcher class="ml-3" />
        <span> {{ day }} · <b>{{ date }} de {{ month }}</b> · {{hour}}</span>
      </div>
      <div class="header-right">
        <span>{{ t('header.greeting') }}, <b>{{userName}} </b></span>
        <avatar icon="pi pi-user" class="ml-2" size="large" style="background-color: #dee9fc; color: #1a2551" shape="circle"  />
      </div>
    </header>
    <main class="main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Menu from 'primevue/menu'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'
import LanguageSwitcher from '@/shared/presentation/components/language-switcher.vue'
import { logout } from '@/identity/application/utils/mockAuth.js'
import { usePersonalizationStore } from '@/personalization/application/personalization.js'
import { useAuth } from '@/identity/application/composables/useAuth.js'
import { useDateTime } from '@/identity/application/composables/useDateTime.js'

const router = useRouter()
const personalizationStore = usePersonalizationStore()
const { userId, userName } = useAuth()
const { day, date, month, hour } = useDateTime();
const { t } = useI18n()


function handleLogout() {
  // Solo limpiar el store local, NO guardar defaults en db.json
  personalizationStore.clearStore()
  logout()
  router.push({ name: 'login' })
}

const items = [
  { label: t('nav.dashboard'), icon: 'pi pi-objects-column', command: () => router.push({ name: 'dashboard' }) },
  { label: t('nav.alerts'), icon: 'pi pi-bell', command: () => router.push({ name: 'alerts' }) },
  { label: t('nav.devices'), icon: 'pi pi-clipboard', command: () => router.push({ name: 'devices' }) },
  { label: t('nav.subscriptions'), icon: 'pi pi-credit-card', command: () => router.push({ name: 'subscriptions' }) },
  { label: t('nav.rewards'), icon: 'pi pi-gift', command: () => router.push({ name: 'rewards' }) },
  { label: t('nav.configuration'), icon: 'pi pi-cog', command: () => router.push('/configuration') }
]

const menuPt = {
  root: { class: 'my-menu-root' },
  list: { class: 'my-menu-list' },

}

</script>

<style scoped>
.sidebar {
  width: 15rem;
  background: #fff;
  min-height: 100vh;
  box-shadow: 2px 0 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  padding-top: 1rem;
  font-weight: 500;
}
.container-logo{
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.8em;
}
.logo-img{
  max-height: 5em;
  max-width: 5em;
  display: block;
}

:deep(.p-menu-item-icon) {
  color: #000 !important;
}

:deep(.my-menu-root) { border: none; }
:deep(.my-menu-list) { gap: 1em !important; }
:deep(.p-menu-custom .p-menu-item:not(.p-disabled) .p-menu-item-content:hover) {
  background: #002349;
  color: #ffffff;
}
:deep(.p-menu-custom .p-menu-item:not(.p-disabled) .p-menu-item-content:hover .p-menu-item-icon),
:deep(.p-menu-custom .p-menu-item:not(.p-disabled) .p-menu-item-content:hover a) {
  color: inherit !important;
  fill: currentColor !important;
}

.logout-btn {
  margin-top: auto;
  border: none !important;
}
.logout-btn:hover {
  background: none !important;
  box-shadow: none !important;
  text-decoration: underline;
}
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.topbar {
  height: 56px;
  background: #f5f5f5;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}
.header-left{
  display: flex;
  align-items: center;
  gap: 1rem;
}
.header-right{
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.main {
  flex: 1;
  padding: 2rem;
  background: #fafbfc;
}
</style>