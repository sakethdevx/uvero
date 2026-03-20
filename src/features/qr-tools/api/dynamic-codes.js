// Dynamic QR Codes API — CRUD
// Routes:
//   GET  /api/qr/codes        list user's dynamic QR codes
//   POST /api/qr/codes        create a new dynamic QR code
//   GET  /api/qr/codes/:id    get one code + analytics summary
//   PATCH /api/qr/codes/:id   update destination / title
//   DELETE /api/qr/codes/:id  delete code

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

function sendError(res, status, message) {
    return res.status(status).json({ error: message })
}

async function resolveUser(req, supabase) {
    const auth = (req.headers?.authorization || '').replace('Bearer ', '').trim()
    if (!auth) return null
    const { data, error } = await supabase.auth.getUser(auth)
    if (error || !data?.user) return null
    return data.user
}

function makeShortCode() {
    return crypto.randomBytes(6).toString('hex') // 12 hex chars, 48 bits of entropy
}

function isValidUrl(str) {
    try {
        const u = new URL(str)
        return u.protocol === 'https:'
    } catch {
        return false
    }
}

export default async function handler(req, res) {
    const allowedMethods = ['GET', 'POST', 'PATCH', 'DELETE']
    if (!allowedMethods.includes(req.method)) {
        return sendError(res, 405, 'Method not allowed')
    }

    let supabase
    try {
        supabase = getSupabase()
    } catch (e) {
        return sendError(res, e.status || 500, e.message)
    }

    const user = await resolveUser(req, supabase)
    if (!user) return sendError(res, 401, 'Authentication required')

    // Extract sub-resource path from the original URL
    const url = new URL(req.url, `http://${req.headers.host}`)
    const forwarded = url.searchParams.get('path') || ''
    // forwarded looks like "qr/codes" or "qr/codes/abc123"
    const parts = forwarded.split('/').filter(Boolean) // ['qr','codes'] or ['qr','codes','abc123']
    const resourceId = parts[2] || null // code id or short_code

    try {
        if (req.method === 'GET' && !resourceId) {
            // List all codes for this user
            const { data, error } = await supabase
                .from('qr_dynamic_codes')
                .select('id, title, short_code, destination_url, scan_count, is_active, created_at, updated_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            return res.status(200).json({ codes: data || [] })
        }

        if (req.method === 'GET' && resourceId) {
            const { data, error } = await supabase
                .from('qr_dynamic_codes')
                .select('id, title, short_code, destination_url, scan_count, is_active, created_at, updated_at')
                .eq('id', resourceId)
                .eq('user_id', user.id)
                .single()
            if (error || !data) return sendError(res, 404, 'Not found')

            // Last 30 days scan trend
            const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            const { data: scans } = await supabase
                .from('qr_scans')
                .select('scanned_at, country')
                .eq('code_id', data.id)
                .gte('scanned_at', since)
                .order('scanned_at', { ascending: false })
                .limit(500)

            return res.status(200).json({ code: data, scans: scans || [] })
        }

        if (req.method === 'POST') {
            const { title, destination_url } = req.body || {}
            if (!destination_url || !isValidUrl(destination_url)) {
                return sendError(res, 400, 'A valid HTTPS destination URL is required')
            }
            const truncatedTitle = typeof title === 'string' ? title.trim().slice(0, 120) : ''

            // Generate a unique short code, with collision retry
            let short_code = makeShortCode()
            let collided = false
            for (let attempts = 0; attempts < 5; attempts++) {
                const { data: existing } = await supabase
                    .from('qr_dynamic_codes')
                    .select('id')
                    .eq('short_code', short_code)
                    .maybeSingle()
                if (!existing) { collided = false; break }
                short_code = makeShortCode()
                collided = true
            }
            if (collided) return sendError(res, 503, 'Failed to generate unique code, please try again')

            const { data, error } = await supabase
                .from('qr_dynamic_codes')
                .insert({
                    user_id: user.id,
                    title: truncatedTitle || destination_url.slice(0, 80),
                    short_code,
                    destination_url,
                    scan_count: 0,
                    is_active: true,
                })
                .select('id, title, short_code, destination_url, scan_count, is_active, created_at, updated_at')
                .single()
            if (error) throw error
            return res.status(201).json({ code: data })
        }

        if (req.method === 'PATCH') {
            if (!resourceId) return sendError(res, 400, 'Missing code id')

            // Ownership check
            const { data: existing, error: fetchErr } = await supabase
                .from('qr_dynamic_codes')
                .select('id, user_id')
                .eq('id', resourceId)
                .single()
            if (fetchErr || !existing) return sendError(res, 404, 'Not found')
            if (existing.user_id !== user.id) return sendError(res, 403, 'Forbidden')

            const updates = {}
            const { title, destination_url, is_active } = req.body || {}
            if (title !== undefined) updates.title = String(title).trim().slice(0, 120)
            if (destination_url !== undefined) {
                if (!isValidUrl(destination_url)) return sendError(res, 400, 'Invalid destination URL')
                updates.destination_url = destination_url
            }
            if (is_active !== undefined) updates.is_active = Boolean(is_active)
            updates.updated_at = new Date().toISOString()

            const { data, error } = await supabase
                .from('qr_dynamic_codes')
                .update(updates)
                .eq('id', resourceId)
                .select('id, title, short_code, destination_url, scan_count, is_active, updated_at')
                .single()
            if (error) throw error
            return res.status(200).json({ code: data })
        }

        if (req.method === 'DELETE') {
            if (!resourceId) return sendError(res, 400, 'Missing code id')
            const { data: existing } = await supabase
                .from('qr_dynamic_codes')
                .select('id, user_id')
                .eq('id', resourceId)
                .single()
            if (!existing) return sendError(res, 404, 'Not found')
            if (existing.user_id !== user.id) return sendError(res, 403, 'Forbidden')

            const { error } = await supabase
                .from('qr_dynamic_codes')
                .delete()
                .eq('id', resourceId)
            if (error) throw error
            return res.status(200).json({ success: true })
        }

        return sendError(res, 400, 'Invalid request')
    } catch (e) {
        console.error('[qr/codes]', e)
        return sendError(res, e.status || 500, e.message || 'Internal server error')
    }
}
