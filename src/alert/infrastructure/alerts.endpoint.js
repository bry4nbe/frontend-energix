import { http } from '../../shared/infrastructure/base-api.js';

const ALERTS = (import.meta.env.VITE_ALERTS_ENDPOINT_PATH || '/alerts').replace(/\/+$/, '');

export const AlertsApi = {
    async getAll() {
        return await http.get(ALERTS);
    },

    async getByUserId(userId) {
        return await http.get(`${ALERTS}?userId=${userId}`);
    },

    async markAsRead(id) {
        return await http.patch(`${ALERTS}/${id}`, { isRead: true });
    },

    async markAllAsRead(userId) {
        const alerts = await this.getByUserId(userId);
        const updates = alerts
            .filter(a => !a.isRead)
            .map(a => http.patch(`${ALERTS}/${a.id}`, { isRead: true }));
        return await Promise.all(updates);
    },

    async create(alert) {
        return await http.post(ALERTS, alert);
    },

    async generateSystemAlert(userId, type, data = {}) {
        const templates = {
            high_consumption: () => ({
                badge: 'Advertencia',
                message: 'Consumo elevado detectado',
                details: `Tu consumo superó el ${data.percentage}% del límite mensual (${data.current}/${data.limit} kWh)`,
                uiType: 'warning'
            }),
            new_device: () => ({
                badge: 'Info',
                message: 'Nuevo dispositivo conectado',
                details: `Se vinculó un ${data.deviceType || 'dispositivo'}`,
                uiType: 'info'
            }),
            device_unlinked: () => ({
                badge: 'Info',
                message: 'Dispositivo desvinculado',
                details: `Se desvinculó ${data.deviceName || 'un dispositivo'}${data.deviceType ? ` (${data.deviceType})` : ''}`,
                uiType: 'info'
            }),
            power_changed: () => ({
                badge: 'Info',
                message: `Dispositivo ${data.status === 'on' ? 'encendido' : 'apagado'}`,
                details: `${data.deviceName || 'El dispositivo'} ahora está ${data.status === 'on' ? 'encendido' : 'apagado'}`,
                uiType: 'info'
            }),
            peak_hours: () => ({
                badge: 'Advertencia',
                message: 'Horario pico de consumo',
                details: 'Reduce uso entre 18:00–22:00 para ahorrar',
                uiType: 'warning'
            }),
            monthly_report: () => ({
                badge: 'Info',
                message: 'Reporte mensual disponible',
                details: `Tu reporte de consumo de ${data.month || ''} ya está disponible`,
                uiType: 'info'
            })
        };

        const t = templates[type];
        if (!t) return null;
        const tpl = t();

        return await this.create({
            userId,
            type: tpl.uiType === 'warning' ? 'warning' : 'info',
            badge: tpl.badge,
            message: tpl.message,
            details: tpl.details,
            timestamp: new Date().toISOString(),
            isRead: false
        });
    }
};
