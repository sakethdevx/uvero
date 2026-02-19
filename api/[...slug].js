// Dispatcher catch-all to consolidate all API handlers into a single serverless function.
// It routes incoming requests under /api/* to handlers located in `src/api_handlers/`.

export default async function dispatcher(req, res) {
    const slug = req.query?.slug || []
    if (!Array.isArray(slug)) {
        // when not using catch-all, normalize
        return res.status(400).json({ error: 'Invalid API path' })
    }

    if (slug.length === 0) {
        return res.status(404).json({ error: 'API root - handler not found' })
    }

    // Determine module path under src/api_handlers
    let modulePath = null
    const top = slug[0]
    try {
        if (top === 'images') {
            // images/:id  -> src/api_handlers/images/[id].js
            if (slug[1]) modulePath = `images/[id].js`
            else modulePath = `images/index.js`
        } else {
            // map other top-level files directly: e.g., /api/events -> src/api_handlers/events.js
            modulePath = `${top}.js`
        }

        const mod = await import(`../src/api_handlers/${modulePath}`)
        const handler = mod.default || mod.handler
        if (!handler || typeof handler !== 'function') return res.status(500).json({ error: 'Handler not found or invalid' })
        return await handler(req, res)
    } catch (err) {
        console.error('[api/dispatcher] routing error', modulePath, err?.message || String(err))
        return res.status(404).json({ error: 'Not found' })
    }
}
