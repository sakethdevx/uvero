// Generate ZIP for event or person and stream it back
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import archiver from 'archiver'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET = process.env.R2_BUCKET
const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const s3 = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY } })

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })

    const { event_id, person_id } = req.body || {}
    if (!event_id) return res.status(400).json({ error: 'event_id required' })

    try {
        let imagesRes
        if (person_id) {
            // join images belonging to person via face_embeddings
            const { data } = await serverSupabase.rpc('get_images_for_person', { p_person_id: person_id })
            imagesRes = data
        } else {
            const { data } = await serverSupabase.from('images').select('*').eq('event_id', event_id)
            imagesRes = data
        }

        if (!imagesRes || imagesRes.length === 0) return res.status(404).json({ error: 'No images found' })

        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename="event-${event_id}.zip"`)

        const archive = archiver('zip')
        archive.on('error', err => { throw err })
        archive.pipe(res)

        for (const img of imagesRes) {
            const key = img.r2_key
            const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: key })
            const object = await s3.send(command)
            // object.Body is a stream
            archive.append(object.Body, { name: key.split('/').pop() })
        }

        await archive.finalize()
    } catch (err) {
        console.error(err)
        return res.status(500).json({ error: err.message || String(err) })
    }
}
