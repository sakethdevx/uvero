// GitHub storage service for Online Clipboard
// Stores board content as text files in a private GitHub repo
// Uses CLIPBOARD_STORAGE_GITHUB_* env vars (separate from PhotoDrop)

import { Buffer } from 'buffer'

const GITHUB_TOKEN = process.env.CLIPBOARD_STORAGE_GITHUB_TOKEN
const GITHUB_OWNER = process.env.CLIPBOARD_STORAGE_GITHUB_OWNER
const GITHUB_REPO = process.env.CLIPBOARD_STORAGE_GITHUB_REPO
const GITHUB_BRANCH = process.env.CLIPBOARD_STORAGE_GITHUB_BRANCH || 'main'

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.warn('Clipboard GitHub storage env vars are not set (CLIPBOARD_STORAGE_GITHUB_TOKEN etc)')
}

function apiUrl(path) {
    return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURI(path)}`
}

const headers = () => ({
    Authorization: `token ${GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'uvero-clipboard'
})

/**
 * Save board content to GitHub.
 * Stores as boards/{boardId}.json containing { content, metadata }
 * If file already exists, fetches its SHA first to update.
 */
async function saveBoard(boardId, content, metadata = {}) {
    if (!GITHUB_TOKEN) throw new Error('Missing CLIPBOARD_STORAGE_GITHUB_TOKEN')
    const path = `boards/${boardId}.json`
    const payload = JSON.stringify({ content, metadata, updated_at: new Date().toISOString() })
    const base64 = Buffer.from(payload).toString('base64')

    // Check if file already exists to get SHA (required for updates)
    let sha = null
    try {
        const existingRes = await fetch(apiUrl(path) + `?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
            method: 'GET',
            headers: headers()
        })
        if (existingRes.ok) {
            const existing = await existingRes.json()
            sha = existing.sha
        }
    } catch (e) {
        // File doesn't exist yet, that's fine
    }

    const body = {
        message: sha ? `update board: ${boardId}` : `create board: ${boardId}`,
        content: base64,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {})
    }

    const res = await fetch(apiUrl(path), {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`GitHub save board failed: ${res.status} ${txt}`)
    }

    return { path, boardId }
}

/**
 * Get board content from GitHub.
 * Returns { content, metadata } or null if not found.
 */
async function getBoard(boardId) {
    if (!GITHUB_TOKEN) throw new Error('Missing CLIPBOARD_STORAGE_GITHUB_TOKEN')
    const path = `boards/${boardId}.json`

    const res = await fetch(apiUrl(path) + `?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
        method: 'GET',
        headers: {
            ...headers(),
            Accept: 'application/vnd.github.v3.raw'
        }
    })

    if (res.status === 404) return null
    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`GitHub fetch board failed: ${res.status} ${txt}`)
    }

    const text = await res.text()
    try {
        return JSON.parse(text)
    } catch {
        return { content: text, metadata: {} }
    }
}

/**
 * Delete board content from GitHub.
 */
async function deleteBoard(boardId) {
    if (!GITHUB_TOKEN) throw new Error('Missing CLIPBOARD_STORAGE_GITHUB_TOKEN')
    const path = `boards/${boardId}.json`

    // Get SHA first
    const metaRes = await fetch(apiUrl(path) + `?ref=${encodeURIComponent(GITHUB_BRANCH)}`, {
        method: 'GET',
        headers: headers()
    })
    if (!metaRes.ok) {
        if (metaRes.status === 404) return true // already gone
        const txt = await metaRes.text()
        throw new Error(`GitHub meta fetch failed: ${metaRes.status} ${txt}`)
    }
    const meta = await metaRes.json()

    const res = await fetch(apiUrl(path), {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({
            message: `delete board: ${boardId}`,
            sha: meta.sha,
            branch: GITHUB_BRANCH
        })
    })

    if (!res.ok && res.status !== 404) {
        const txt = await res.text()
        throw new Error(`GitHub delete board failed: ${res.status} ${txt}`)
    }
    return true
}

export { saveBoard, getBoard, deleteBoard }
