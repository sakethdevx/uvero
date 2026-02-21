import { createClient } from '@supabase/supabase-js'
import { getImageBuffer } from '../services/githubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const HF_SPACE_URL = process.env.HF_SPACE_URL

const THRESHOLD = Number(process.env.FACE_MATCH_THRESHOLD) || 0.5

export async function processImage(image_id, jobId = null) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !HF_SPACE_URL) {
        throw new Error('Server not configured for face processing')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // if a jobId is provided, mark job as processing
    if (jobId) {
        try {
            await supabase.from('face_jobs').update({ status: 'processing', started_at: new Date().toISOString() }).eq('id', jobId)
        } catch (e) {
            console.warn('[faceProcessor] failed to mark job processing', e?.message || e)
        }
    }

    const { data: image, error: imgErr } = await supabase.from('images').select('*').eq('id', image_id).single()
    if (imgErr || !image) {
        if (jobId) await supabase.from('face_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), result: JSON.stringify({ error: 'Image not found' }) }).eq('id', jobId)
        throw new Error('Image not found')
    }

    const buffer = await getImageBuffer(image.github_path, image.event_id)

    const hfRes = await fetch(`${HF_SPACE_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer
    })

    if (!hfRes.ok) {
        const body = await hfRes.text()
        if (jobId) await supabase.from('face_jobs').update({ status: 'failed', finished_at: new Date().toISOString(), result: JSON.stringify({ status: hfRes.status, body: String(body).slice(0, 1000) }) }).eq('id', jobId)
        const err = new Error(`HF error ${hfRes.status}`)
        err.hfBody = body
        throw err
    }

    const faces = await hfRes.json()

    const processed = []

    function normalizeBoxForStorage(box) {
        if (!box) return null
        if (Array.isArray(box) && box.length >= 4) {
            const [x, y, w, h] = box
            return { x, y, width: w, height: h }
        }
        if (typeof box === 'object') {
            // xmin/xmax/ymin/ymax format
            if (box.xmin != null && box.xmax != null && box.ymin != null && box.ymax != null) {
                const x = Number(box.xmin)
                const y = Number(box.ymin)
                const width = Number(box.xmax) - Number(box.xmin)
                const height = Number(box.ymax) - Number(box.ymin)
                return { x, y, width, height }
            }
            // x,y,width,height or left/top/w/h
            const xVal = box.x ?? box.left
            const yVal = box.y ?? box.top
            const wVal = box.width ?? box.w
            const hVal = box.height ?? box.h
            if (xVal != null && yVal != null && wVal != null && hVal != null) {
                return { x: Number(xVal), y: Number(yVal), width: Number(wVal), height: Number(hVal) }
            }
            // center cx,cy with width/height
            if (box.cx != null && box.cy != null && (box.w != null || box.width != null)) {
                const w = box.w ?? box.width
                const h = box.h ?? box.height
                const x = Number(box.cx) - Number(w) / 2
                const y = Number(box.cy) - Number(h) / 2
                return { x, y, width: Number(w), height: Number(h) }
            }
        }
        return null
    }

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

        const boxToStore = normalizeBoxForStorage(face.box)
        await supabase.from('face_embeddings').insert({ person_id, image_id, descriptor: embedding, box: boxToStore })

        processed.push({ person_id, box: face.box })
    }

    if (jobId) {
        try {
            await supabase.from('face_jobs').update({ status: 'done', finished_at: new Date().toISOString(), result: JSON.stringify({ processed_count: processed.length, processed }) }).eq('id', jobId)
        } catch (e) {
            console.warn('[faceProcessor] failed to mark job done', e?.message || e)
        }
    }

    // mark image as processed (even if zero faces found)
    try {
        await supabase.from('images').update({ processed: true, processed_at: new Date().toISOString(), processed_count: processed.length }).eq('id', image_id)
    } catch (e) {
        console.warn('[faceProcessor] failed to mark image processed', e?.message || e)
    }

    return { processed_count: processed.length, processed }
}
