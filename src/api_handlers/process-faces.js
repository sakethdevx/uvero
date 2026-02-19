// Receive face descriptor(s) for an image, cluster into persons and store embeddings
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// simple cosine similarity
function cosineSimilarity(a, b) {
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10)
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    if (!SUPABASE_SERVICE_KEY) return res.status(500).json({ error: 'Missing server supabase key' })

    const authHeader = req.headers.authorization || ''
    const token = authHeader.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const { data: userData, error: userError } = await serverSupabase.auth.getUser(token)
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' })

    const { image_id, event_id, descriptors } = req.body || {}
    if (!image_id || !event_id || !descriptors || !Array.isArray(descriptors)) {
        return res.status(400).json({ error: 'image_id, event_id, descriptors[] required' })
    }

    try {
        // fetch existing persons and their centroid embeddings
        const { data: persons } = await serverSupabase.from('persons').select('*').eq('event_id', event_id)

        // load embeddings for persons
        const personEmbeddings = {}
        if (persons?.length) {
            const personIds = persons.map(p => p.id)
            const { data: embRows } = await serverSupabase.from('face_embeddings').select('person_id, descriptor').in('person_id', personIds)
            for (const row of embRows || []) {
                personEmbeddings[row.person_id] = personEmbeddings[row.person_id] || []
                personEmbeddings[row.person_id].push(row.descriptor)
            }
        }

        const THRESHOLD = 0.55 // cosine similarity threshold; tune as needed
        const results = []

        for (const desc of descriptors) {
            let assignedPerson = null
            let bestScore = -1
            // compare to each existing person by averaging stored embeddings
            for (const pid of Object.keys(personEmbeddings)) {
                const embeddings = personEmbeddings[pid]
                // compute centroid
                const centroid = new Array(embeddings[0].length).fill(0)
                for (const e of embeddings) for (let i = 0; i < e.length; i++) centroid[i] += e[i]
                for (let i = 0; i < centroid.length; i++) centroid[i] /= embeddings.length
                const score = cosineSimilarity(desc, centroid)
                if (score > bestScore) { bestScore = score; assignedPerson = pid }
            }

            if (!assignedPerson || bestScore < THRESHOLD) {
                // create new person
                const label = `Person ${crypto.randomBytes(3).toString('hex')}`
                const { data: newPerson } = await serverSupabase.from('persons').insert([{ event_id, label }]).select()
                assignedPerson = newPerson[0].id
                personEmbeddings[assignedPerson] = []
            }

            // store embedding
            await serverSupabase.from('face_embeddings').insert([{ person_id: assignedPerson, image_id, descriptor: desc }])
            personEmbeddings[assignedPerson].push(desc)
            results.push({ descriptorId: crypto.randomUUID?.() || crypto.randomBytes(8).toString('hex'), person_id: assignedPerson })
        }

        return res.status(200).json({ results })
    } catch (err) {
        return res.status(500).json({ error: err.message || String(err) })
    }
}
