// Single-entry API router that dispatches by full pathname to handlers
export default async function handler(req, res) {
    const { pathname } = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (pathname === '/api/create-profile') {
            const mod = await import('../src/api_handlers/create-profile.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/events') {
            const mod = await import('../src/api_handlers/events.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/compress') {
            const mod = await import('../src/api_handlers/compress.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/convert-video-to-mp3') {
            const mod = await import('../src/api_handlers/convert-video-to-mp3.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/delete-event') {
            const mod = await import('../src/api_handlers/delete-event.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/delete-image') {
            const mod = await import('../src/api_handlers/delete-image.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/join-event') {
            const mod = await import('../src/api_handlers/join-event.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/persons') {
            const mod = await import('../src/api_handlers/persons.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/process-faces') {
            const mod = await import('../src/api_handlers/process-faces.js')
            return mod.default(req, res)
        }

        if (pathname === '/api/upload-image') {
            const mod = await import('../src/api_handlers/upload-image.js')
            return mod.default(req, res)
        }

        // images collection and single image
        if (pathname === '/api/images') {
            const mod = await import('../src/api_handlers/images/index.js')
            return mod.default(req, res)
        }

        if (pathname.startsWith('/api/images/')) {
            // normalize id into req.query for handlers that expect it
            const parts = pathname.split('/')
            const id = parts[parts.length - 1]
            req.query = req.query || {}
            req.query.id = id
            const mod = await import('../src/api_handlers/images/[id].js')
            return mod.default(req, res)
        }

        return res.status(404).json({ error: 'Not found' })
    } catch (err) {
        console.error('[api/index] dispatch error', err)
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
