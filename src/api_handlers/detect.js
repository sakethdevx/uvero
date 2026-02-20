const HF_SPACE_URL = process.env.HF_SPACE_URL

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    try {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        const buffer = Buffer.concat(chunks)

        const hfRes = await fetch(`${HF_SPACE_URL}/detect`, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream"
            },
            body: buffer
        })

        if (!hfRes.ok) {
            const text = await hfRes.text()
            return res.status(502).json({
                error: "HF error",
                body: text
            })
        }

        const data = await hfRes.json()
        return res.status(200).json(data)

    } catch (err) {
        return res.status(500).json({ error: String(err) })
    }
}