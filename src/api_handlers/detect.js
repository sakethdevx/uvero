// Server proxy for Hugging Face inference API (detect persons/faces)
const HF_API = 'https://api-inference.huggingface.co/models/facebook/detr-resnet-50'

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const HF_TOKEN = process.env.HF_TOKEN
    if (!HF_TOKEN) return res.status(500).json({ error: 'Missing HF_TOKEN in environment' })

    try {
        const contentType = req.headers['content-type'] || 'application/octet-stream'

        // collect raw request body
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks)

        const hfRes = await fetch(HF_API, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                'Content-Type': contentType
            },
            body
        })

        const json = await hfRes.json()

        // filter person detections and convert to centroid format
        const persons = (Array.isArray(json) ? json : [])
            .filter(r => r.label === 'person')
            .map(p => {
                const { box, score } = p
                const { xmin, ymin, xmax, ymax } = box
                return {
                    cx: (xmin + xmax) / 2,
                    cy: (ymin + ymax) / 2,
                    box,
                    score
                }
            })

        return res.status(200).json({ persons, raw: json })
    } catch (err) {
        console.error('[api/detect] error', err)
        return res.status(500).json({ error: String(err) })
    }
}
