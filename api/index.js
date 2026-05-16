// Router that receives rewrites from Vercel: /api/:path* -> /api?path=:path*
// It dispatches to handlers in src/services/*/api based on the original subpath.

import { getMaintenanceConfig, sendMaintenanceResponse } from './maintenance.js'

export default async function handler(req, res) {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`)
        const forwarded = url.searchParams.get('path') || '' // original subpath from rewrite
        const originalPath = forwarded ? `/api/${forwarded}` : '/api'
        const maintenance = getMaintenanceConfig()

        if (maintenance.enabled) {
            return sendMaintenanceResponse(res, maintenance)
        }

        // map originalPath to handlers
        if (originalPath === '/api/create-profile') {
            const mod = await import('../src/services/auth/api/create-profile.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/username-availability') {
            const mod = await import('../src/services/auth/api/username-availability.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/update-username') {
            const mod = await import('../src/services/auth/api/update-username.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/compress') {
            const mod = await import('../src/services/toolbox/api/compress.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-video-to-mp3') {
            const mod = await import('../src/services/toolbox/api/convert-video-to-mp3.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-heic') {
            const mod = await import('../src/services/toolbox/api/convert-heic.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/transform-image') {
            const mod = await import('../src/services/toolbox/api/transform-image.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/transform-audio') {
            const mod = await import('../src/services/toolbox/api/transform-audio.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/transform-video') {
            const mod = await import('../src/services/toolbox/api/transform-video.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-rar-to-zip') {
            const mod = await import('../src/services/toolbox/api/convert-rar-to-zip.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-epub-to-mobi') {
            const mod = await import('../src/services/toolbox/api/convert-epub-to-mobi.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/toolbox/runtime-status') {
            const mod = await import('../src/services/toolbox/api/toolbox-runtime-status.js')
            return mod.default(req, res)
        }

        // ── CLI clipboard endpoints (must come before generic /api/clipboard) ──

        if (originalPath === '/api/clipboard/cli-health') {
            const mod = await import('../src/services/clipboard/api/cli-health.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard/send') {
            const mod = await import('../src/services/clipboard/api/cli-send.js')
            return mod.default(req, res)
        }

        if (forwarded && forwarded.startsWith('clipboard/get/')) {
            req.query = req.query || {}
            req.query.code = forwarded.split('/')[2] || ''
            const mod = await import('../src/services/clipboard/api/cli-get.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard/board/create') {
            const mod = await import('../src/services/clipboard/api/cli-board-create.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard/board/send') {
            const mod = await import('../src/services/clipboard/api/cli-board-send.js')
            return mod.default(req, res)
        }

        if (forwarded && forwarded.startsWith('clipboard/board/get/')) {
            req.query = req.query || {}
            req.query.board = forwarded.split('/')[3] || ''
            const mod = await import('../src/services/clipboard/api/cli-board-get.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/clipboard') {
            const mod = await import('../src/services/clipboard/api/index.js')
            return mod.default(req, res)
        }

        // QR Tools — analytics aggregation
        if (forwarded && forwarded === 'qr/analytics') {
            const mod = await import('../src/services/qr-tools/api/analytics.js')
            return mod.default(req, res)
        }

        // QR Tools — dynamic codes CRUD
        if (forwarded && (forwarded === 'qr/codes' || forwarded.startsWith('qr/codes/'))) {
            const mod = await import('../src/services/qr-tools/api/dynamic-codes.js')
            return mod.default(req, res)
        }

        // QR Tools — redirect & scan tracking
        if (forwarded && forwarded.startsWith('qr/r/')) {
            const mod = await import('../src/services/qr-tools/api/qr-redirect.js')
            return mod.default(req, res)
        }

        // Online Compiler — proxy to HuggingFace
        if (forwarded && forwarded.startsWith('compiler')) {
            const mod = await import('../src/services/compiler/api/execute.js')
            return mod.default(req, res)
        }

        return res.status(404).json({ error: 'Not found' })
    } catch (err) {
        console.error('[api/index] dispatch error', err)
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
