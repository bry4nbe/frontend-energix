// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from "./i18n.js";

// ✅ PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

// (opcional) si sigues usando feather icons en tu views
import * as feather from 'feather-icons'

// Tus estilos
import './style.css'
import './identity/presentation/styles/tokens.css'
import './identity/presentation/styles/auth.css'
import { createPinia } from 'pinia'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)

app.use(router)
app.use(i18n)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.dark-mode',
            cssLayer: false
        }
    }
})

app.use(ToastService)
app.use(ConfirmationService)

app.mount('#app')

router.afterEach(() => setTimeout(() => feather.replace(), 0))
