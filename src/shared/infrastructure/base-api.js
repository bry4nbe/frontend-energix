// shared/infrastructure/base-api.js
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

async function parseJsonSafely(res) {
    // Algunas rutas (DELETE en json-server) devuelven 200/204 sin cuerpo.
    const text = await res.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
}

async function handleError(res) {
    let message = res.statusText || 'Error de red';
    try {
        const txt = await res.text();
        if (txt) {
            const json = JSON.parse(txt);
            message = json?.message || message;
        }
    } catch { /* ignore */ }
    const err = new Error(message);
    err.status = res.status;
    throw err;
}

export const http = {
    async get(url) {
        const res = await fetch(BASE + url);
        if (!res.ok) return handleError(res);
        return await res.json();
    },

    async post(url, body) {
        const res = await fetch(BASE + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) return handleError(res);
        return await res.json();
    },

    async put(url, body) {
        const res = await fetch(BASE + url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) return handleError(res);
        return await res.json();
    },

    async patch(url, body) {
        const res = await fetch(BASE + url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!res.ok) return handleError(res);
        return await res.json();
    },

    // ✅ TOLERA respuestas sin cuerpo (200/204) → no rompe la UI
    async delete(url) {
        const res = await fetch(BASE + url, { method: 'DELETE' });
        if (!res.ok) return handleError(res);
        // Si no hay JSON, devolvemos true para indicar éxito
        const json = await parseJsonSafely(res);
        return json ?? true;
    },
};
