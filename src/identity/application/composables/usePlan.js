import { ref, computed, onMounted } from 'vue';

export function usePlan() {
    const currentPlan = ref('basic');
    const user = ref(null);

    // Obtener plan del usuario desde localStorage
    const loadUserPlan = () => {
        try {
            const userData = localStorage.getItem('energix-user');
            if (userData) {
                user.value = JSON.parse(userData);
                currentPlan.value = user.value.plan || 'basic';
            }
        } catch (error) {
            console.error('Error al cargar plan:', error);
            currentPlan.value = 'basic';
        }
    };

    // Permisos por plan
    const permissions = computed(() => ({
        // Historial
        historyDays: currentPlan.value === 'basic' ? 7
            : currentPlan.value === 'student' ? 90
                : 999,

        // Dispositivos
        maxDevices: currentPlan.value === 'basic' ? 1
            : currentPlan.value === 'student' ? 2
                : 999,

        // Características
        hasRealtimeMonitoring: true,
        hasBasicAlerts: true,
        hasSmartAlerts: currentPlan.value !== 'basic',
        hasRecommendations: currentPlan.value !== 'basic',
        hasForecast: currentPlan.value === 'family',
        hasExport: currentPlan.value === 'family',
        hasInvoiceIntegration: currentPlan.value === 'family',
        hasMultipleProfiles: currentPlan.value === 'family',
        hasUnlimitedHistory: currentPlan.value === 'family',

        // UI
        showUpgradeButton: currentPlan.value !== 'family',
    }));

    // Nombres de planes
    const planNames = {
        basic: 'Plan Básico',
        student: 'Plan Estudiantil',
        family: 'Plan Familiar'
    };

    const planName = computed(() => planNames[currentPlan.value] || 'Plan Básico');

    onMounted(() => {
        loadUserPlan();
    });

    return {
        currentPlan,
        user,
        permissions,
        planName,
        loadUserPlan
    };
}