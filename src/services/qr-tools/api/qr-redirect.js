// QR Redirect handler — resolves short_code → destination URL and records a scan
// Route: GET /api/qr/r/:short_code
// This endpoint is called from the redirect mini-page served by the front-end.
// It returns JSON: { destination_url, title } so the client can do the redirect.

import { createClient } from '@supabase/supabase-js'

const runtimeProcess = globalThis?.process
const SUPABASE_URL = runtimeProcess?.env?.VITE_SUPABASE_URL || runtimeProcess?.env?.SUPABASE_URL
const SUPABASE_SERVICE_KEY = runtimeProcess?.env?.SUPABASE_SERVICE_KEY

function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        const err = new Error('Missing Supabase credentials')
        err.status = 500
        throw err
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
}

function getHeader(req, key) {
    const lower = key.toLowerCase()
    for (const k of Object.keys(req.headers || {})) {
        if (k.toLowerCase() === lower) return String(req.headers[k] || '')
    }
    return ''
}

// Very simple country extraction from CF-IPCountry (Vercel/Cloudflare) header
function getCountry(req) {
    return getHeader(req, 'cf-ipcountry') || getHeader(req, 'x-vercel-ip-country') || null
}

export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    let supabase
    try {
        supabase = getSupabase()
    } catch (e) {
        return res.status(e.status || 500).json({ error: e.message })
    }

    const url = new URL(req.url, `http://${req.headers.host}`)
    const forwarded = url.searchParams.get('path') || ''
    const parts = forwarded.split('/').filter(Boolean) // ['qr', 'r', 'abc123']
    const short_code = parts[2] || null

    if (!short_code || !/^[a-f0-9]{12}$/.test(short_code)) {
        return res.status(400).json({ error: 'Invalid QR code' })
    }

    try {
        const { data: code, error } = await supabase
            .from('qr_dynamic_codes')
            .select('id, destination_url, title, is_active')
            .eq('short_code', short_code)
            .maybeSingle()

        if (error) throw error
        if (!code) return res.status(404).json({ error: 'QR code not found' })
        if (!code.is_active) return res.status(410).json({ error: 'This QR code has been deactivated' })

        // Record scan asynchronously (fire-and-forget, non-blocking)
        const country = getCountry(req)
        const userAgent = getHeader(req, 'user-agent').slice(0, 512)

        Promise.all([
            supabase.from('qr_scans').insert({ code_id: code.id, country, user_agent: userAgent }),
            supabase.rpc('qr_increment_scan_count', { code_id_arg: code.id }),
        ]).catch((err) => console.error('[qr/r] scan record error', err))

        return res.status(200).json({
            destination_url: code.destination_url,
            title: code.title,
        })
    } catch (e) {
        console.error('[qr/r]', e)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
