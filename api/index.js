// Router that receives rewrites from Vercel: /api/:path* -> /api?path=:path*
// It dispatches to handlers in src/features/*/api based on the original subpath.

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
            const mod = await import('../src/features/auth/api/create-profile.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/username-availability') {
            const mod = await import('../src/features/auth/api/username-availability.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/update-username') {
            const mod = await import('../src/features/auth/api/update-username.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/events') {
            const mod = await import('../src/features/photodrop/api/events.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/compress') {
            const mod = await import('../src/features/file-tools/api/compress.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-video-to-mp3') {
            const mod = await import('../src/features/file-tools/api/convert-video-to-mp3.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-heic') {
            const mod = await import('../src/features/file-tools/api/convert-heic.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-rar-to-zip') {
            const mod = await import('../src/features/file-tools/api/convert-rar-to-zip.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/convert-epub-to-mobi') {
            const mod = await import('../src/features/file-tools/api/convert-epub-to-mobi.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/file-tools/runtime-status') {
            const mod = await import('../src/features/file-tools/api/file-tools-runtime-status.js')
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


        if (originalPath === '/api/split/groups') {
            const mod = await import('../src/features/split-expense/api/groups.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/join') {
            const mod = await import('../src/features/split-expense/api/join.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/group') {
            const mod = await import('../src/features/split-expense/api/group.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/claim-guest') {
            const mod = await import('../src/features/split-expense/api/claim-guest.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/recovery-code') {
            const mod = await import('../src/features/split-expense/api/recovery-code.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/recover') {
            const mod = await import('../src/features/split-expense/api/recover.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/recover-guest') {
            const mod = await import('../src/features/split-expense/api/recover-guest.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/export') {
            const mod = await import('../src/features/split-expense/api/export.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/members') {
            const mod = await import('../src/features/split-expense/api/members.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/expenses') {
            const mod = await import('../src/features/split-expense/api/expenses.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/receipts') {
            const mod = await import('../src/features/split-expense/api/receipts.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/settlements') {
            const mod = await import('../src/features/split-expense/api/settlements.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/payment-proofs') {
            const mod = await import('../src/features/split-expense/api/payment-proofs.js')
            return mod.default(req, res)
        }

        if (originalPath === '/api/split/reminders') {
            const mod = await import('../src/features/split-expense/api/reminders.js')
            return mod.default(req, res)
        }



        if (originalPath === '/api/upload-image') {
            const mod = await import('../src/features/photodrop/api/upload-image.js')
            return mod.default(req, res)
        }

        // ── CLI clipboard endpoints (must come before generic /api/clipboard) ──

        if (originalPath === '/api/clipboard/cli-health') {
            const mod = await import('../src/features/clipboard/api/cli-health.js')
            return mod.default(req, res)
        }

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

        // QR Tools — analytics aggregation
        if (forwarded && forwarded === 'qr/analytics') {
            const mod = await import('../src/features/qr-tools/api/analytics.js')
            return mod.default(req, res)
        }

        // QR Tools — dynamic codes CRUD
        if (forwarded && (forwarded === 'qr/codes' || forwarded.startsWith('qr/codes/'))) {
            const mod = await import('../src/features/qr-tools/api/dynamic-codes.js')
            return mod.default(req, res)
        }

        // QR Tools — redirect & scan tracking
        if (forwarded && forwarded.startsWith('qr/r/')) {
            const mod = await import('../src/features/qr-tools/api/qr-redirect.js')
            return mod.default(req, res)
        }

        // Online Compiler — proxy to HuggingFace
        if (forwarded && forwarded.startsWith('compiler')) {
            const mod = await import('../src/features/compiler/api/execute.js')
            return mod.default(req, res)
        }

        return res.status(404).json({ error: 'Not found' })
    } catch (err) {
        console.error('[api/index] dispatch error', err)
        return res.status(500).json({ error: String(err?.message || err) })
    }
}
