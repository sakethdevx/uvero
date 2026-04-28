export const OCR_STATUS = new Set(['pending', 'completed', 'failed', 'not_requested'])

function hasPayloadData(value) {
    if (!value || typeof value !== 'object') return false
    if (Array.isArray(value)) return value.length > 0
    return Object.keys(value).length > 0
}

export function hasOcrOutput({ ocrText, ocrPayload }) {
    const normalizedText = String(ocrText || '').trim()
    if (normalizedText) return true
    return hasPayloadData(ocrPayload)
}

export function deriveOcrStatus({ ocrRequested, ocrText, ocrPayload }) {
    if (hasOcrOutput({ ocrText, ocrPayload })) return 'completed'
    if (ocrRequested) return 'pending'
    return 'not_requested'
}

export function normalizeOcrStatus({ ocrStatus, ocrText, ocrPayload }) {
    if (hasOcrOutput({ ocrText, ocrPayload })) return 'completed'

    const normalized = String(ocrStatus || '').trim().toLowerCase()
    if (!OCR_STATUS.has(normalized)) return 'not_requested'

    return normalized
}
