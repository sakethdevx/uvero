// Router that receives rewrites from Vercel: /api/:path* -> /api?path=:path*
// It dispatches to handlers in src/api_handlers based on the original subpath.

export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const forwarded = url.searchParams.get('path') || '' // original subpath from rewrite
        const originalPath = forwarded ? `/api/${forwarded}` : '/api'

        // map originalPath to handlers
        if (originalPath === '/api/create-profile') {
            const mod = await import('../src/api_handlers/create-profile.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/events') {
            const mod = await import('../src/api_handlers/events.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/compress') {
            const mod = await import('../src/api_handlers/compress.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-video-to-mp3') {
            const mod = await import('../src/api_handlers/convert-video-to-mp3.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/delete-event') {
            const mod = await import('../src/api_handlers/delete-event.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/delete-image') {
            const mod = await import('../src/api_handlers/delete-image.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/join-event') {
            const mod = await import('../src/api_handlers/join-event.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/persons') {
            const mod = await import('../src/api_handlers/persons.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/process-faces') {
            const mod = await import('../src/api_handlers/process-faces.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/detect') {
            const mod = await import('../src/api_handlers/detect.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/upload-image') {
            const mod = await import('../src/api_handlers/upload-image.js')
            return mod.default(req, res)
        }

        // images collection
        if (originalPath === '/api/images') {
            const mod = await import('../src/api_handlers/images/index.js')
            return mod.default(req, res)
        }

        // single image: forwarded contains id when rewrite matched
        if (forwarded && forwarded.startsWith('images/')) {
            const id = forwarded.split('/')[1]
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
