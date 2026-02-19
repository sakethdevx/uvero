import { createClient } from '@supabase/supabase-js'
import { getImageBuffer } from '../../src/services/githubStorage.js'
import mime from 'mime'
import path from 'path'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    const { id } = req.query || {}
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    try {
        if (!id) return res.status(400).json({ error: 'Missing id' })

        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'Missing access token' })

        const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
        if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })

        const { data: imgs, error } = await serverSupabase.from('images').select('*').eq('id', id).limit(1)
        if (error) return res.status(500).json({ error: error.message })
        const image = imgs && imgs[0]
        if (!image) return res.status(404).json({ error: 'Image not found' })

        const { data: ev } = await serverSupabase.from('events').select('created_by').eq('id', image.event_id).single()
        if (!ev || ev.created_by !== userData.user.id) return res.status(403).json({ error: 'Forbidden' })

        // Files are uploaded to a branch named after the event id.
        // Use the event branch as the ref when fetching the raw content.
        const ref = image.event_id || process.env.GITHUB_BRANCH
        console.log('[api/images] fetching from github', { path: image.github_path, ref })
        const buffer = await getImageBuffer(image.github_path, ref)

        const filenameOrPath = image.filename || image.github_path || ''
        let type = mime.getType(filenameOrPath)
        if (!type) {
            const ext = path.extname(filenameOrPath || '').replace('.', '')
            type = mime.getType('.' + ext) || 'application/octet-stream'
        }

        res.setHeader('Content-Type', type)
        if (buffer && buffer.length) res.setHeader('Content-Length', buffer.length)

        if (req.query.download) {
            res.setHeader('Content-Disposition', `attachment; filename="${image.filename || 'image'}"`)
        }

        return res.status(200).send(buffer)
    } catch (err) {
        console.error('[api/images] error fetching image', err)
        const msg = String(err.message || err)
        // Detect GitHub rate limit / API quota errors and return 429 to the client
        if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('api rate limit') || msg.includes('403')) {
            return res.status(429).json({ error: 'GitHub API rate limit exceeded. Please try again later or set a GITHUB_TOKEN in env.' })
        }
        return res.status(500).json({ error: msg })
    }
}
