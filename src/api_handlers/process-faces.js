import { processImage } from '../lib/faceProcessor.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
    try {
        const { image_id } = req.body || {}
        if (!image_id) return res.status(400).json({ error: 'Missing image_id' })

        const result = await processImage(image_id)
        return res.status(200).json({ processed: result.processed_count, results: result.processed })
    } catch (err) {
        console.error('[process-faces] error', err)
        const body = err?.hfBody || null
        return res.status(500).json({ error: String(err.message || err), hf: body && String(body).slice(0, 1000) })
    }
}