export const config = {
    api: {
        bodyParser: false, // 🔥 critical for binary upload
    },
}

const HF_SPACE_URL = process.env.HF_SPACE_URL

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" })
    }

    if (!HF_SPACE_URL) {
        return res.status(500).json({ error: "HF_SPACE_URL not configured" })
    }

    try {
        const chunks = []
        for await (const chunk of req) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)

        if (!buffer.length) {
            return res.status(400).json({ error: "Empty request body" })
        }

        const hfRes = await fetch(`${HF_SPACE_URL}/detect`, {
            method: "POST",
            headers: {
                "Content-Type": "application/octet-stream",
            },
            body: buffer,
        })

        if (!hfRes.ok) {
            const text = await hfRes.text()
            console.error("[api/detect] HF error:", text)
            return res.status(502).json({
                error: "HF error",
                body: text,
            })
        }

        const data = await hfRes.json()

        return res.status(200).json(data)

    } catch (err) {
        console.error("[api/detect] crash:", err)
        return res.status(500).json({ error: String(err) })
    }
}