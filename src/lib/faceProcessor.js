import { createClient } from '@supabase/supabase-js'
import { getImageBuffer } from '../services/githubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const HF_SPACE_URL = process.env.HF_SPACE_URL

const THRESHOLD = 0.35

export async function processImage(image_id) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !HF_SPACE_URL) {
        throw new Error('Server not configured for face processing')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { data: image, error: imgErr } = await supabase.from('images').select('*').eq('id', image_id).single()
    if (imgErr || !image) throw new Error('Image not found')

    const buffer = await getImageBuffer(image.github_path, image.event_id)

    const hfRes = await fetch(`${HF_SPACE_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer
    })

    if (!hfRes.ok) {
        const body = await hfRes.text()
        const err = new Error(`HF error ${hfRes.status}`)
        err.hfBody = body
        throw err
    }

    const faces = await hfRes.json()

    const processed = []

    for (const face of faces) {
        const embedding = face.embedding

        const { data: nearest, error: searchErr } = await supabase.rpc('match_face', {
            query_embedding: embedding,
            match_event_id: image.event_id,
            match_threshold: THRESHOLD,
            match_count: 1
        })

        let person_id
        if (!searchErr && nearest && nearest.length > 0) {
            person_id = nearest[0].person_id
        } else {
            const { data: newPerson, error: personErr } = await supabase.from('persons').insert({ event_id: image.event_id }).select().single()
            if (personErr) continue
            person_id = newPerson.id
        }

        await supabase.from('face_embeddings').insert({ person_id, image_id, descriptor: embedding })

        processed.push({ person_id, box: face.box })
    }

    return { processed_count: processed.length, processed }
}
