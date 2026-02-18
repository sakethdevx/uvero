// Generate a presigned PUT URL for Cloudflare R2 (S3-compatible) using AWS SDK v3
// Required env: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID (for endpoint), R2_BUCKET

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import crypto from 'crypto'

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_BUCKET = process.env.R2_BUCKET

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET) {
    console.warn('Missing R2 environment variables for gen-upload-url')
}

const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const s3 = new S3Client({
    region: 'auto',
    endpoint,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY }
})

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { filename, contentType, event_id } = req.body || {}
    if (!filename || !contentType || !event_id) return res.status(400).json({ error: 'filename, contentType and event_id required' })

    try {
        // generate a safe key: events/{event_id}/{random}-{filename}
        const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_')
        const key = `events/${event_id}/${crypto.randomBytes(8).toString('hex')}-${safeName}`

        const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: key, ContentType: contentType, ACL: 'public-read' })
        const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 }) // 10 minutes

        // public URL (R2 public access must be configured or via Cloudflare Worker/URL)
        const publicUrl = `${endpoint}/${R2_BUCKET}/${key}`

        return res.status(200).json({ uploadUrl: url, key, publicUrl })
    } catch (err) {
        return res.status(500).json({ error: err.message || String(err) })
    }
}
