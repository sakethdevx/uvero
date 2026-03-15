/* global process */

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on'])

function isEnabled(value) {
    return TRUTHY_VALUES.has(String(value || '').trim().toLowerCase())
}

function readText(...values) {
    for (const value of values) {
        const text = typeof value === 'string' ? value.trim() : ''
        if (text) return text
    }
    return ''
}

export function getMaintenanceConfig() {
    return {
        enabled: isEnabled(process.env.MAINTENANCE_MODE || process.env.VITE_MAINTENANCE_MODE),
        title: readText(
            process.env.MAINTENANCE_TITLE,
            process.env.VITE_MAINTENANCE_TITLE,
            'Uvero is temporarily unavailable'
        ),
        message: readText(
            process.env.MAINTENANCE_MESSAGE,
            process.env.VITE_MAINTENANCE_MESSAGE,
            'Maintenance is in progress. Please try again shortly.'
        ),
        eta: readText(
            process.env.MAINTENANCE_ETA,
            process.env.VITE_MAINTENANCE_ETA,
            'We will be back soon'
        ),
        retryAfter: readText(process.env.MAINTENANCE_RETRY_AFTER, '300')
    }
}

export function sendMaintenanceResponse(res, config) {
    res.setHeader('Retry-After', config.retryAfter)
    res.setHeader('X-Uvero-Maintenance-Mode', 'on')

    return res.status(503).json({
        error: 'Maintenance mode active',
        maintenance: {
            enabled: true,
            title: config.title,
            message: config.message,
            eta: config.eta
        }
    })
}
