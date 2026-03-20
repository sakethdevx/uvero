// Analytics API — aggregated stats for the authenticated user's dynamic QR codes
// GET /api/qr/analytics

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

export default async function handler(req, res) {
    if (req.method !== 'GET') return sendError(res, 405, 'Method not allowed')

    const supabase = getSupabase()
    const user = await resolveUser(req, supabase)
    if (!user) return sendError(res, 401, 'Unauthorized')

    // All codes for this user
    const { data: codes, error: codesErr } = await supabase
        .from('qr_dynamic_codes')
        .select('id, title, short_code, scan_count, is_active, created_at')
        .eq('user_id', user.id)
        .order('scan_count', { ascending: false })

    if (codesErr) return sendError(res, 500, codesErr.message)

    const codeList = codes || []
    const codeIds = codeList.map((c) => c.id)

    if (codeIds.length === 0) {
        return res.json({
            total_codes: 0,
            active_codes: 0,
            total_scans: 0,
            scans_last_30d: 0,
            daily_counts: buildEmptyDailyBins(30),
            country_breakdown: [],
            top_codes: [],
        })
    }

    // Scans in the last 30 days
    const since = new Date()
    since.setDate(since.getDate() - 29)
    since.setHours(0, 0, 0, 0)

    const { data: scans, error: scansErr } = await supabase
        .from('qr_scans')
        .select('code_id, scanned_at, country')
        .in('code_id', codeIds)
        .gte('scanned_at', since.toISOString())

    if (scansErr) return sendError(res, 500, scansErr.message)

    const scanList = scans || []

    // Build 30-day daily bins
    const dailyMap = buildEmptyDailyBinsMap(30)
    const countryMap = {}

    for (const s of scanList) {
        const day = s.scanned_at.slice(0, 10)
        if (day in dailyMap) dailyMap[day]++
        const country = s.country || 'N/A'
        countryMap[country] = (countryMap[country] || 0) + 1
    }

    const daily_counts = Object.entries(dailyMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }))

    const country_breakdown = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }))

    const total_scans = codeList.reduce((s, c) => s + (c.scan_count || 0), 0)
    const active_codes = codeList.filter((c) => c.is_active).length

    return res.json({
        total_codes: codeList.length,
        active_codes,
        total_scans,
        scans_last_30d: scanList.length,
        daily_counts,
        country_breakdown,
        top_codes: codeList.slice(0, 10),
    })
}

function buildEmptyDailyBinsMap(days) {
    const map = {}
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        map[d.toISOString().slice(0, 10)] = 0
    }
    return map
}

function buildEmptyDailyBins(days) {
    return Object.entries(buildEmptyDailyBinsMap(days))
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }))
}
