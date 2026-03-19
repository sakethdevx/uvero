/* global process */

// Single-repo GitHub storage for PaySplit receipts.
import { Buffer } from 'buffer'

const API_BASE = 'https://api.github.com'
const OWNER = process.env.PAYSPLIT_RECEIPTS_GITHUB_OWNER || process.env.TRIPSPLIT_RECEIPTS_GITHUB_OWNER || process.env.GITHUB_RECEIPTS_OWNER
const REPO = process.env.PAYSPLIT_RECEIPTS_GITHUB_REPO || process.env.TRIPSPLIT_RECEIPTS_GITHUB_REPO || process.env.GITHUB_RECEIPTS_REPO
const TOKEN = process.env.PAYSPLIT_RECEIPTS_GITHUB_TOKEN || process.env.TRIPSPLIT_RECEIPTS_GITHUB_TOKEN || process.env.GITHUB_RECEIPTS_TOKEN
const BRANCH = process.env.PAYSPLIT_RECEIPTS_GITHUB_BRANCH || process.env.TRIPSPLIT_RECEIPTS_GITHUB_BRANCH || process.env.GITHUB_RECEIPTS_BRANCH || 'main'
const MAX_UPLOAD_BYTES = Number(process.env.PAYSPLIT_RECEIPT_MAX_UPLOAD_BYTES || process.env.TRIPSPLIT_RECEIPT_MAX_UPLOAD_BYTES || 5 * 1024 * 1024)

const MIME_EXTENSION_MAP = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/gif': '.gif'
}

function ensureEnv() {
  if (!OWNER || !REPO || !TOKEN) {
    throw new Error('GitHub receipts storage is not configured. Set PAYSPLIT_RECEIPTS_GITHUB_OWNER, PAYSPLIT_RECEIPTS_GITHUB_REPO, and PAYSPLIT_RECEIPTS_GITHUB_TOKEN (legacy TRIPSPLIT_RECEIPTS_* and GITHUB_RECEIPTS_* also work).')
  }
}

function sanitizeFileName(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return 'receipt'
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 200) || 'receipt'
}

function extensionFromFileName(fileName) {
  const normalized = String(fileName || '').trim()
  const dot = normalized.lastIndexOf('.')
  if (dot <= 0 || dot === normalized.length - 1) return ''
  return normalized.slice(dot).toLowerCase()
}

function extensionFromMimeType(mimeType) {
  const normalized = String(mimeType || '').trim().toLowerCase()
  return MIME_EXTENSION_MAP[normalized] || ''
}

function normalizeBase64Content(input) {
  const raw = String(input || '').trim()
  if (!raw) return ''

  const dataUrlMatch = raw.match(/^data:.*;base64,(.+)$/i)
  const content = dataUrlMatch?.[1] || raw
  return content.replace(/\s+/g, '')
}

function getDecodedByteLength(base64Content) {
  const normalized = String(base64Content || '')
  if (!normalized) return 0

  const padding = normalized.endsWith('==') ? 2 : normalized.endsWith('=') ? 1 : 0
  return Math.floor((normalized.length * 3) / 4) - padding
}

async function githubPutFile(path, contentBase64, message) {
  ensureEnv()

  const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'uvero-paysplit-receipts'
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: BRANCH
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}: ${text}`)
  }

  return response.json()
}

async function storeReceiptUpload({ groupId, expenseId, fileName, fileContentBase64, fileMimeType }) {
  ensureEnv()

  const normalizedBase64 = normalizeBase64Content(fileContentBase64)
  if (!normalizedBase64) {
    throw new Error('Receipt file content is empty')
  }

  const decodedBytes = getDecodedByteLength(normalizedBase64)
  if (!Number.isFinite(decodedBytes) || decodedBytes <= 0) {
    throw new Error('Invalid base64 content for receipt upload')
  }

  if (decodedBytes > MAX_UPLOAD_BYTES) {
    throw new Error(`Receipt upload exceeds max size of ${MAX_UPLOAD_BYTES} bytes`)
  }

  try {
    Buffer.from(normalizedBase64, 'base64')
  } catch {
    throw new Error('Invalid base64 content for receipt upload')
  }

  const safeNameBase = sanitizeFileName(fileName)
  const hasExtension = !!extensionFromFileName(safeNameBase)
  const extension = hasExtension ? '' : extensionFromMimeType(fileMimeType)
  const finalFileName = `${safeNameBase}${extension}`
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
  const storagePath = `receipts/${groupId}/${expenseId}/${uniqueSuffix}_${finalFileName}`

  await githubPutFile(storagePath, normalizedBase64, `Add receipt ${groupId}/${expenseId}/${finalFileName}`)

  return {
    path: storagePath,
    url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${storagePath}`,
    file_name: finalFileName,
    size_bytes: decodedBytes
  }
}

export {
  MAX_UPLOAD_BYTES,
  getDecodedByteLength,
  normalizeBase64Content,
  storeReceiptUpload
}
