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

        // Inspect response -- sometimes HF returns HTML error pages (HTML begins with '<')
        const respContentType = (hfRes.headers.get('content-type') || '').toLowerCase()
        let json = null

        if (!hfRes.ok) {
            // Try to read text body for debugging
            const text = await hfRes.text().catch(() => '')
            console.error('[api/detect] HF responded with error', hfRes.status, text.slice(0, 200))
            return res.status(502).json({ error: 'Hugging Face inference error', status: hfRes.status, body: text })
        }

        if (respContentType.includes('application/json')) {
            try {
                json = await hfRes.json()
            } catch (err) {
                const text = await hfRes.text().catch(() => '')
                console.error('[api/detect] Failed to parse JSON from HF response', err, 'body:', text.slice(0, 200))
                return res.status(502).json({ error: 'Invalid JSON from Hugging Face', body: text })
            }
        } else {
            // Non-JSON (HTML or plain text) -- return body as text for diagnostics
            const text = await hfRes.text().catch(() => '')
            console.error('[api/detect] Unexpected HF content-type', respContentType, 'body-snippet:', text.slice(0, 200))
            return res.status(502).json({ error: 'Unexpected Hugging Face response', contentType: respContentType, body: text.slice(0, 200) })
        }

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
