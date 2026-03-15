/* global process */

// GitHub storage service for Online Clipboard
// Stores board content as text files in dedicated GitHub repos.
// Public and private boards use separate repo configs.

import { Buffer } from 'buffer'

const REPO_CONFIGS = {
    public: {
        token: process.env.CLIPBOARD_PUBLIC_STORAGE_GITHUB_TOKEN,
        owner: process.env.CLIPBOARD_PUBLIC_STORAGE_GITHUB_OWNER,
        repo: process.env.CLIPBOARD_PUBLIC_STORAGE_GITHUB_REPO,
    },
    private: {
        token: process.env.CLIPBOARD_PRIVATE_STORAGE_GITHUB_TOKEN,
        owner: process.env.CLIPBOARD_PRIVATE_STORAGE_GITHUB_OWNER,
        repo: process.env.CLIPBOARD_PRIVATE_STORAGE_GITHUB_REPO,
    }
}

if (!REPO_CONFIGS.public.token || !REPO_CONFIGS.public.owner || !REPO_CONFIGS.public.repo) {
    console.warn('Public clipboard GitHub storage env vars are not fully set')
}

if (!REPO_CONFIGS.private.token || !REPO_CONFIGS.private.owner || !REPO_CONFIGS.private.repo) {
    console.warn('Private clipboard GitHub storage env vars are not fully set')
}

function repoConfigForType(type) {
    return type === 'private' ? REPO_CONFIGS.private : REPO_CONFIGS.public
}

function apiUrl({ owner, repo }, path) {
    return `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURI(path)}`
}

function headers(token) {
    return {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'uvero-clipboard'
    }
}

/**
 * Save board content to GitHub.
 * Stores as boards/{boardId}.json containing { content, metadata }
 * If file already exists, fetches its SHA first to update.
 * @param {string} boardId
 * @param {string} content
 * @param {object} metadata
 * @param {string} type - 'public' or 'private', determines which repo to use
 */
async function saveBoard(boardId, content, metadata = {}, type = 'public') {
    const repoConfig = repoConfigForType(type)
    if (!repoConfig.token || !repoConfig.owner || !repoConfig.repo) {
        throw new Error(`Missing GitHub storage config for ${type} clipboard boards`)
    }
    const path = `boards/${boardId}.json`
    const payload = JSON.stringify({ content, metadata, updated_at: new Date().toISOString() })
    const base64 = Buffer.from(payload).toString('base64')

    // Check if file already exists to get SHA (required for updates)
    let sha = null
    try {
        const existingRes = await fetch(apiUrl(repoConfig, path), {
            method: 'GET',
            headers: headers(repoConfig.token)
        })
        if (existingRes.ok) {
            const existing = await existingRes.json()
            sha = existing.sha
        }
    } catch {
        // File doesn't exist yet, that's fine
    }

    const body = {
        message: sha ? `update board: ${boardId}` : `create board: ${boardId}`,
        content: base64,
        ...(sha ? { sha } : {})
    }

    const res = await fetch(apiUrl(repoConfig, path), {
        method: 'PUT',
        headers: headers(repoConfig.token),
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
 * @param {string} boardId
 * @param {string} type - 'public' or 'private', determines which repo to use
 */
async function getBoard(boardId, type = 'public') {
    const repoConfig = repoConfigForType(type)
    if (!repoConfig.token || !repoConfig.owner || !repoConfig.repo) {
        throw new Error(`Missing GitHub storage config for ${type} clipboard boards`)
    }
    const path = `boards/${boardId}.json`

    const res = await fetch(apiUrl(repoConfig, path), {
        method: 'GET',
        headers: {
            ...headers(repoConfig.token),
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
 * @param {string} boardId
 * @param {string} type - 'public' or 'private', determines which repo to use
 */
async function deleteBoard(boardId, type = 'public') {
    const repoConfig = repoConfigForType(type)
    if (!repoConfig.token || !repoConfig.owner || !repoConfig.repo) {
        throw new Error(`Missing GitHub storage config for ${type} clipboard boards`)
    }
    const path = `boards/${boardId}.json`

    // Get SHA first
    const metaRes = await fetch(apiUrl(repoConfig, path), {
        method: 'GET',
        headers: headers(repoConfig.token)
    })
    if (!metaRes.ok) {
        if (metaRes.status === 404) return true // already gone
        const txt = await metaRes.text()
        throw new Error(`GitHub meta fetch failed: ${metaRes.status} ${txt}`)
    }
    const meta = await metaRes.json()

    const res = await fetch(apiUrl(repoConfig, path), {
        method: 'DELETE',
        headers: headers(repoConfig.token),
        body: JSON.stringify({
            message: `delete board: ${boardId}`,
            sha: meta.sha
        })
    })

    if (!res.ok && res.status !== 404) {
        const txt = await res.text()
        throw new Error(`GitHub delete board failed: ${res.status} ${txt}`)
    }
    return true
}

export { saveBoard, getBoard, deleteBoard }
