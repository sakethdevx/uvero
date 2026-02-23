// Upload image to GitHub repo and record metadata in Supabase
import { createClient } from '@supabase/supabase-js'
import { uploadImage } from '../../src/services/photodropGithubStorage.js'
import path from 'path'
import sanitize from 'sanitize-filename'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']

function validateFilename(name) {
    const base = path.basename(name)
    const safe = sanitize(base).replace(/\s+/g, '_')
    return safe
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'Missing access token' })

        const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
        if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })

        const payload = req.body || {}
        const { event_id, filename, content } = payload
        if (!event_id || !filename || !content) return res.status(400).json({ error: 'event_id, filename, content required' })

        const safeName = validateFilename(filename)
        let ext = path.extname(safeName).toLowerCase()
        if (!ALLOWED.includes(ext)) return res.status(400).json({ error: 'Invalid file type' })

        // decode base64
        let buffer = Buffer.from(content, 'base64')
        if (buffer.length > MAX_BYTES) return res.status(400).json({ error: 'File too large (max 10MB)' })

        // Duplicate filename handling: append _1, _2, etc. if needed
        let finalName = safeName
        const branchName = event_id
        try {
            // Query Supabase for existing filenames in this event
            const { data: existingImages, error: queryError } = await serverSupabase
                .from('images')
                .select('filename')
                .eq('event_id', event_id)
            if (queryError) throw queryError
            const existingNames = (existingImages || []).map(img => img.filename)
            if (existingNames.includes(finalName)) {
                // Find next available suffix
                const base = finalName.replace(/(\.[a-z0-9]+)$/i, '')
                const extPart = finalName.match(/(\.[a-z0-9]+)$/i)?.[0] || ''
                let idx = 1
                let candidate = `${base}_${idx}${extPart}`
                while (existingNames.includes(candidate)) {
                    idx++
                    candidate = `${base}_${idx}${extPart}`
                }
                finalName = candidate
            }
        } catch (e) {
            console.warn('[api/upload-image] duplicate check failed', e?.message || String(e))
            // fallback: use original name
        }

        // upload to GitHub (keep original file for downstream processing)
        console.log('[api/upload-image] upload request', { event_id, filename: finalName, size: buffer.length })
        const result = await uploadImage(event_id, finalName, buffer, branchName)
        console.log('[api/upload-image] github upload result', { path: result.path, sha: result.sha })

        // insert into images table
        const { data, error } = await serverSupabase
            .from('images')
            .insert([{ event_id, uploaded_by: userData.user.id, github_path: result.path, filename: finalName }])
            .select()

        if (error) {
            console.error('[api/upload-image] supabase insert error', { message: error.message })
            return res.status(500).json({ error: error.message })
        }

        // enqueue background face-processing job (best-effort)
        try {
            const { data: job } = await serverSupabase.from('face_jobs').insert([{ image_id: data[0].id, event_id }]).select().single()
            // trigger background processing (best-effort, non-blocking)
            try {
                // import processor and run in background
                const mod = await import('../lib/faceProcessor.js')
                // fire-and-forget with job id so job status will be updated
                mod.processImage(data[0].id, job?.id).catch(err => console.warn('[api/upload-image] background processing failed', err?.message || err))
            } catch (e) {
                // it's okay if dynamic import fails; job remains enqueued
                console.warn('[api/upload-image] could not start background processor', e?.message || String(e))
            }
        } catch (e) {
            console.warn('[api/upload-image] failed to enqueue face job', e?.message || String(e))
        }

        return res.status(200).json({ data: data[0] })
    } catch (err) {
        console.error('[api/upload-image] unexpected error', err?.message || String(err), err?.stack)
        return res.status(500).json({ error: String(err) })
    }
}
