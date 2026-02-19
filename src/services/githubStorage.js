// GitHub storage service for Phase-1: store images in a private GitHub repo
// Uses GitHub REST API to create/update files under event-images/{eventId}/{filename}
// Secrets (backend only): GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH

import { Buffer } from 'buffer'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
    console.warn('GitHub storage env vars are not set (GITHUB_TOKEN etc)')
}

function apiUrl(path) {
    return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURI(path)}`
}

async function uploadImage(eventId, filename, buffer, branch = GITHUB_BRANCH) {
    if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN')
    const safePath = `event-images/${eventId}/${filename}`
    const content = Buffer.from(buffer).toString('base64')

    const body = {
        message: `upload: ${eventId}/${filename}`,
        content,
        branch
    }

    const res = await fetch(apiUrl(safePath), {
        method: 'PUT',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'event-photo-organizer'
        },
        body: JSON.stringify(body)
    })

    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`GitHub upload failed: ${res.status} ${txt}`)
    }

    const json = await res.json()
    // return path and sha
    return { path: json.content.path, sha: json.content.sha }
}

async function createBranch(branchName, base = GITHUB_BRANCH) {
    if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN')
    // Get the SHA of the base branch
    const refUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/ref/heads/${encodeURIComponent(base)}`
    const refRes = await fetch(refUrl, {
        method: 'GET',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'event-photo-organizer' }
    })
    if (!refRes.ok) {
        const txt = await refRes.text()
        throw new Error(`Failed to get base ref: ${refRes.status} ${txt}`)
    }
    const refJson = await refRes.json()
    const sha = refJson.object?.sha
    if (!sha) throw new Error('Base branch SHA not found')

    // Create new ref for the branch
    const createUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs`
    const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'event-photo-organizer' },
        body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha })
    })
    if (!createRes.ok) {
        const txt = await createRes.text()
        throw new Error(`Failed to create branch: ${createRes.status} ${txt}`)
    }
    return true
}

async function deleteBranch(branchName) {
    if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN')
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/refs/heads/${encodeURIComponent(branchName)}`
    const res = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'event-photo-organizer' }
    })
    if (res.status === 204) return true
    const txt = await res.text()
    throw new Error(`Failed to delete branch: ${res.status} ${txt}`)
}

async function getImageBuffer(path, ref = GITHUB_BRANCH) {
    if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN')
    const res = await fetch(apiUrl(path) + `?ref=${encodeURIComponent(ref)}`, {
        method: 'GET',
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            'User-Agent': 'event-photo-organizer',
            Accept: 'application/vnd.github.v3.raw'
        }
    })

    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`GitHub fetch failed: ${res.status} ${txt}`)
    }

    // When Accept: raw, GitHub returns the raw bytes
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
}

async function deleteImage(path, ref = GITHUB_BRANCH) {
    if (!GITHUB_TOKEN) throw new Error('Missing GITHUB_TOKEN')
    // Need to get existing file SHA before deleting. Use ref to read metadata from the correct branch.
    const metaUrl = apiUrl(path) + `?ref=${encodeURIComponent(ref)}`
    const metaRes = await fetch(metaUrl, {
        method: 'GET',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'event-photo-organizer' }
    })
    if (!metaRes.ok) {
        const txt = await metaRes.text()
        throw new Error(`GitHub meta fetch failed: ${metaRes.status} ${txt}`)
    }
    const meta = await metaRes.json()
    const body = { message: `delete: ${path}`, sha: meta.sha, branch: ref }
    const res = await fetch(apiUrl(path), {
        method: 'DELETE',
        headers: { Authorization: `token ${GITHUB_TOKEN}`, 'Content-Type': 'application/json', 'User-Agent': 'event-photo-organizer' },
        body: JSON.stringify(body)
    })
    if (!res.ok) {
        const txt = await res.text()
        throw new Error(`GitHub delete failed: ${res.status} ${txt}`)
    }
    return true
}

export { uploadImage, getImageBuffer, deleteImage, createBranch, deleteBranch }
