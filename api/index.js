// Router that receives rewrites from Vercel: /api/:path* -> /api?path=:path*
// It dispatches to handlers in src/features/*/api based on the original subpath.

export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const forwarded = url.searchParams.get('path') || '' // original subpath from rewrite
        const originalPath = forwarded ? `/api/${forwarded}` : '/api'

        // map originalPath to handlers
        if (originalPath === '/api/create-profile') {
            const mod = await import('../src/features/photodrop/api/create-profile.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/events') {
            const mod = await import('../src/features/photodrop/api/events.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/compress') {
            const mod = await import('../src/features/file-processing/api/compress.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-video-to-mp3') {
            const mod = await import('../src/features/file-processing/api/convert-video-to-mp3.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-heic') {
            const mod = await import('../src/features/file-processing/api/convert-heic.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/delete-event') {
            const mod = await import('../src/features/photodrop/api/delete-event.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/delete-image') {
            const mod = await import('../src/features/photodrop/api/delete-image.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/join-event') {
            const mod = await import('../src/features/photodrop/api/join-event.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/create-invite') {
            const mod = await import('../src/features/photodrop/api/create-invite.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/invite-info') {
            const mod = await import('../src/features/photodrop/api/invite-info.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/persons') {
            const mod = await import('../src/features/photodrop/api/persons.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/update-person-name') {
            const mod = await import('../src/features/photodrop/api/update-person-name.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/merge-persons') {
            const mod = await import('../src/features/photodrop/api/merge-persons.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/process-faces') {
            const mod = await import('../src/features/photodrop/api/process-faces.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/reprocess-faces') {
            const mod = await import('../src/features/photodrop/api/reprocess-faces.js')
            return mod.default(req, res)
        }



        if (originalPath === '/api/upload-image') {
            const mod = await import('../src/features/photodrop/api/upload-image.js')
            return mod.default(req, res)
        }

        // ── CLI clipboard endpoints (must come before generic /api/clipboard) ──

        if (originalPath === '/api/clipboard/send') {
            const mod = await import('../src/features/clipboard/api/cli-send.js')
            return mod.default(req, res)
        }

        if (forwarded && forwarded.startsWith('clipboard/get/')) {
            req.query = req.query || {}
            req.query.code = forwarded.split('/')[2] || ''
            const mod = await import('../src/features/clipboard/api/cli-get.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard/board/create') {
            const mod = await import('../src/features/clipboard/api/cli-board-create.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard/board/send') {
            const mod = await import('../src/features/clipboard/api/cli-board-send.js')
            return mod.default(req, res)
        }

        if (forwarded && forwarded.startsWith('clipboard/board/get/')) {
            req.query = req.query || {}
            req.query.board = forwarded.split('/')[3] || ''
            const mod = await import('../src/features/clipboard/api/cli-board-get.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard') {
            const mod = await import('../src/features/clipboard/api/index.js')
            return mod.default(req, res)
        }

        // images collection
        if (originalPath === '/api/images') {
            const mod = await import('../src/features/photodrop/api/images/index.js')
            return mod.default(req, res)
        }

        // single image: forwarded contains id when rewrite matched
        if (forwarded && forwarded.startsWith('images/')) {
            const id = forwarded.split('/')[1]
            req.query = req.query || {}
            req.query.id = id
            const mod = await import('../src/features/photodrop/api/images/[id].js')
            return mod.default(req, res)
        }

        return res.status(404).json({ error: 'Not found' })
    } catch (err) {
        console.error('[api/index] dispatch error', err)
        return res.status(500).json({ error: String(err?.message || err) })
    }
}

