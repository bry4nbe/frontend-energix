import { ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";

export function useDateTime() {
    const { t, locale } = useI18n();
    const day = ref('');
    const date = ref('');
    const month = ref('');
    const hour = ref('');
    let timer;

    function actualDate() {
        const now = new Date();
        const dayIndex = now.getDay();
        const monthIndex = now.getMonth();

        // Usar traducciones de i18n
        day.value = t(`time.days.${['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex]}`);
        date.value = now.getDate();
        month.value = t(`time.months.${['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'][monthIndex]}`);

        let h = now.getHours();
        let m = now.getMinutes();
        let sufijo = h >= 12 ? t('time.pm') : t('time.am');
        h = h % 12 || 12;
        hour.value = `${h}:${String(m).padStart(2, '0')} ${sufijo}`;
    }

    // Recargar cuando cambie el idioma
    const stopWatch = locale && typeof locale === 'object' && 'value' in locale
        ? (() => {
            const unwatch = typeof locale.value === 'string'
                ? null
                : null;
            return unwatch;
          })()
        : null;

    onMounted(() => {
        actualDate();
        timer = setInterval(actualDate, 5000);
    });

    onBeforeUnmount(() => {
        clearInterval(timer);
        if (stopWatch) stopWatch();
    });

    return { day, date, month, hour };
}
