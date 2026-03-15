const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on'])

function isEnabled(value) {
    return TRUTHY_VALUES.has(String(value || '').trim().toLowerCase())
}

function readText(value, fallback = '') {
    const text = typeof value === 'string' ? value.trim() : ''
    return text || fallback
}

export function getMaintenanceConfig() {
    return {
        enabled: isEnabled(import.meta.env.VITE_MAINTENANCE_MODE),
        title: readText(import.meta.env.VITE_MAINTENANCE_TITLE, 'Uvero is getting a careful tune-up'),
        message: readText(
            import.meta.env.VITE_MAINTENANCE_MESSAGE,
            'We are updating core systems right now so your next session feels stable and smooth.'
        ),
        eta: readText(import.meta.env.VITE_MAINTENANCE_ETA, 'We will be back soon'),
        details: readText(
            import.meta.env.VITE_MAINTENANCE_DETAILS,
            'New sessions, uploads, clipboard updates, and data changes are temporarily paused during maintenance.'
        ),
    }
}
