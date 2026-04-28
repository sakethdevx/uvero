import { createClient } from '@supabase/supabase-js'
import { deleteImage } from '../services/photodropGithubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    try {
        const authHeader = req.headers.authorization || ''
        const token = authHeader.replace('Bearer ', '')
        if (!token) return res.status(401).json({ error: 'Missing access token' })

        const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
        if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })
        const user = userData.user

        const { id } = req.body || {}
        if (!id) return res.status(400).json({ error: 'Missing image id' })

        // fetch image metadata
        const { data: imgs, error } = await serverSupabase.from('images').select('*').eq('id', id).limit(1)
        if (error) return res.status(500).json({ error: error.message })
        const image = imgs && imgs[0]
        if (!image) return res.status(404).json({ error: 'Image not found' })

        // only uploader can delete their image
        if (image.uploaded_by !== user.id) return res.status(403).json({ error: 'Forbidden' })

        // delete file from GitHub (files stored in branch named after event id)
        try {
            await deleteImage(image.github_path, image.event_id)
        } catch (ghErr) {
            console.error('[api/delete-image] github delete error', ghErr?.message || String(ghErr))
            return res.status(500).json({ error: 'Failed to delete file from GitHub: ' + String(ghErr) })
        }

        // remove DB row
        const { error: delErr } = await serverSupabase.from('images').delete().eq('id', id)
        if (delErr) return res.status(500).json({ error: delErr.message })

        // Cleanup: delete any `persons` for this event that no longer have embeddings
        try {
            const { data: personsForEvent, error: pErr } = await serverSupabase.from('persons').select('id').eq('event_id', image.event_id)
            if (!pErr && personsForEvent && personsForEvent.length) {
                const personIds = personsForEvent.map(p => p.id)
                const { data: embRows, error: embErr } = await serverSupabase.from('face_embeddings').select('person_id').in('person_id', personIds)
                if (embErr) throw embErr

                const haveEmbSet = new Set((embRows || []).map(r => r.person_id))
                const orphanIds = personIds.filter(pid => !haveEmbSet.has(pid))
                if (orphanIds.length) {
                    const { error: delPersonsErr } = await serverSupabase.from('persons').delete().in('id', orphanIds)
                    if (delPersonsErr) console.warn('[api/delete-image] failed to delete orphan persons', delPersonsErr.message)
                }
            }
        } catch (cleanupErr) {
            console.warn('[api/delete-image] cleanup error', cleanupErr?.message || String(cleanupErr))
        }

        return res.status(200).json({ success: true })
    } catch (err) {
        console.error('[api/delete-image] unexpected', err?.message || String(err))
        return res.status(500).json({ error: String(err) })
    }
}
