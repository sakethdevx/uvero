import { createClient } from '@supabase/supabase-js'
import { getImageBuffer } from '../../src/services/githubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const HF_SPACE_URL = process.env.HF_SPACE_URL   // e.g. https://saketh-005-faceprocessing.hf.space

const THRESHOLD = 0.35   // cosine distance threshold

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !HF_SPACE_URL) {
        return res.status(500).json({ error: 'Server not configured properly' })
    }

    try {
        const { image_id } = req.body
        if (!image_id) return res.status(400).json({ error: 'Missing image_id' })

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        // 1️⃣ Get image record
        const { data: image, error: imgErr } = await supabase
            .from('images')
            .select('*')
            .eq('id', image_id)
            .single()

        if (imgErr || !image) {
            return res.status(404).json({ error: 'Image not found' })
        }

        const event_id = image.event_id

        // 2️⃣ Fetch image buffer from GitHub
        const buffer = await getImageBuffer(image.github_path, event_id)

        // 3️⃣ Send to Hugging Face Space
        const hfRes = await fetch(HF_SPACE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: buffer
        })

        if (!hfRes.ok) {
            const text = await hfRes.text()
            return res.status(502).json({ error: 'HF error', body: text })
        }

        const faces = await hfRes.json()

        const results = []

        for (const face of faces) {
            const embedding = face.embedding

            // 4️⃣ Find nearest embedding in same event
            const { data: nearest, error: searchErr } = await supabase.rpc(
                'match_face',
                {
                    query_embedding: embedding,
                    match_event_id: event_id,
                    match_threshold: THRESHOLD,
                    match_count: 1
                }
            )

            if (searchErr) {
                console.error('Search error:', searchErr)
                continue
            }

            let person_id

            if (nearest && nearest.length > 0) {
                // Existing person found
                person_id = nearest[0].person_id
            } else {
                // Create new person
                const { data: newPerson, error: personErr } = await supabase
                    .from('persons')
                    .insert({ event_id })
                    .select()
                    .single()

                if (personErr) continue

                person_id = newPerson.id
            }

            // 5️⃣ Insert embedding
            await supabase.from('face_embeddings').insert({
                person_id,
                image_id,
                descriptor: embedding
            })

            results.push({
                person_id,
                box: face.box
            })
        }

        return res.status(200).json({
            processed: results.length,
            results
        })

    } catch (err) {
        console.error('[process-faces] crash', err)
        return res.status(500).json({ error: String(err) })
    }
}