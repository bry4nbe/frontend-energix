export function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('energix-user') || 'null'); } catch { return null; }
}
export function getPlan() { return localStorage.getItem('energix-plan') || 'basic'; }

export function deviceLimitByPlan(plan) {
    if (plan === 'student') return 2;
    if (plan === 'family') return Infinity;
    return 1;
}
export function allowedTypesByPlan(plan) {
    if (plan === 'student') return ['manual', 'plug'];
    if (plan === 'family')  return ['manual', 'plug', 'sensor'];
    return ['manual'];
}
