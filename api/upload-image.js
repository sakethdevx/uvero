// Upload image to GitHub repo and record metadata in Supabase
import { createClient } from '@supabase/supabase-js'
import { uploadImage } from '../src/services/githubStorage.js'
import path from 'path'
import sanitize from 'sanitize-filename'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MAX_BYTES = 10 * 1024 * 1024 // 10MB
const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp']

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
        const ext = path.extname(safeName).toLowerCase()
        if (!ALLOWED.includes(ext)) return res.status(400).json({ error: 'Invalid file type' })

        // decode base64
        const buffer = Buffer.from(content, 'base64')
        if (buffer.length > MAX_BYTES) return res.status(400).json({ error: 'File too large (max 10MB)' })

        // upload to GitHub
        console.log('[api/upload-image] upload request', { event_id, filename: safeName, size: buffer.length })
        // upload to branch named after the event id so each event stores images in its own branch
        const branchName = event_id
        const result = await uploadImage(event_id, safeName, buffer, branchName)
        console.log('[api/upload-image] github upload result', { path: result.path, sha: result.sha })

        // insert into images table
        const { data, error } = await serverSupabase
            .from('images')
            .insert([{ event_id, uploaded_by: userData.user.id, github_path: result.path, filename: safeName }])
            .select()

        if (error) {
            console.error('[api/upload-image] supabase insert error', { message: error.message })
            return res.status(500).json({ error: error.message })
        }

        return res.status(200).json({ data: data[0] })
    } catch (err) {
        console.error('[api/upload-image] unexpected error', err?.message || String(err), err?.stack)
        return res.status(500).json({ error: String(err) })
    }
}
