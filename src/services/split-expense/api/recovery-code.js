import crypto from 'crypto'
import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

function normalizeRecoveryCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function formatRecoveryCode(raw) {
    const cleaned = normalizeRecoveryCode(raw)
    if (cleaned.length <= 4) return cleaned
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`
}

function generateRecoveryCode() {
    const value = crypto.randomBytes(6).toString('hex').toUpperCase()
    return formatRecoveryCode(value)
}

function hashRecoveryCode(code) {
    return crypto
        .createHash('sha256')
        .update(normalizeRecoveryCode(code))
        .digest('hex')
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        const {
            group_id: groupId,
            expires_in_days: expiresInDaysInput = 30
        } = req.body || {}

        if (!groupId) throw createHttpError(400, 'group_id is required')

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        if (actorMember.role !== 'owner') {
            throw createHttpError(403, 'Only group owners can generate recovery codes')
        }

        const expiresInDays = Number(expiresInDaysInput)
        if (!Number.isFinite(expiresInDays) || expiresInDays < 1 || expiresInDays > 365) {
            throw createHttpError(400, 'expires_in_days must be between 1 and 365')
        }

        const code = generateRecoveryCode()
        const codeHash = hashRecoveryCode(code)
        const normalized = normalizeRecoveryCode(code)
        const codeHint = normalized.length >= 4 ? `••••${normalized.slice(-4)}` : null
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()

        const { data: inserted, error: insertError } = await supabase
            .from('split_group_recovery_codes')
            .insert([
                {
                    group_id: groupId,
                    code_hash: codeHash,
                    code_hint: codeHint,
                    created_by_member_id: actorMember.id,
                    expires_at: expiresAt
                }
            ])
            .select('id, group_id, code_hint, created_at, expires_at')
            .maybeSingle()

        if (insertError) throw insertError

        return res.status(201).json({
            data: {
                ...inserted,
                code
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/recovery-code]')
    }
}
