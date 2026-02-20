const HF_SPACE_URL = process.env.HF_SPACE_URL

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    if (!HF_SPACE_URL) {
        return res.status(500).json({ error: 'HF_SPACE_URL not configured' })
    }

    try {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const buffer = Buffer.concat(chunks)

        if (!buffer.length) {
            return res.status(400).json({ error: 'Empty image body' })
        }

        const base64Image = buffer.toString("base64")

        const hfRes = await fetch(`${HF_SPACE_URL}/gradio_api/run/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: [`data:image/jpeg;base64,${base64Image}`]
            })
        })

        if (!hfRes.ok) {
            const text = await hfRes.text()
            console.error("[api/detect] HF error", hfRes.status, text)
            return res.status(502).json({
                error: "HF Space error",
                status: hfRes.status,
                body: text
            })
        }

        const hfJson = await hfRes.json()
        const result = hfJson.data?.[0]

        return res.status(200).json(result)

    } catch (err) {
        console.error("[api/detect] crash", err)
        return res.status(500).json({ error: String(err) })
    }
}