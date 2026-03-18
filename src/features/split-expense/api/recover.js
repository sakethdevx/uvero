import crypto from 'crypto'
import {
    createHttpError,
    defaultDisplayName,
    getServerSupabase,
    resolveActor,
    sendApiError
} from './_server.js'

function normalizeRecoveryCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function hashRecoveryCode(code) {
    return crypto
        .createHash('sha256')
        .update(normalizeRecoveryCode(code))
        .digest('hex')
}

function isExpired(value) {
    if (!value) return false
    const expiresAt = new Date(value).getTime()
    if (Number.isNaN(expiresAt)) return false
    return expiresAt <= Date.now()
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        if (actor.type !== 'user') {
            throw createHttpError(403, 'Sign in to recover a TripSplit group')
        }

        const {
            invite_code: inviteCodeInput,
            recovery_code: recoveryCodeInput,
            display_name: requestedDisplayName
        } = req.body || {}

        const inviteCode = String(inviteCodeInput || '').trim().toUpperCase()
        if (!inviteCode) throw createHttpError(400, 'invite_code is required')

        const normalizedRecoveryCode = normalizeRecoveryCode(recoveryCodeInput)
        if (!normalizedRecoveryCode || normalizedRecoveryCode.length < 8) {
            throw createHttpError(400, 'Valid recovery_code is required')
        }

        const { data: group, error: groupError } = await supabase
            .from('split_groups')
            .select('*')
            .eq('invite_code', inviteCode)
            .maybeSingle()

        if (groupError) throw groupError
        if (!group) throw createHttpError(404, 'Group not found for this invite code')

        const codeHash = hashRecoveryCode(normalizedRecoveryCode)

        const { data: recoveryCodeRow, error: codeError } = await supabase
            .from('split_group_recovery_codes')
            .select('*')
            .eq('group_id', group.id)
            .eq('code_hash', codeHash)
            .maybeSingle()

        if (codeError) throw codeError
        if (!recoveryCodeRow) throw createHttpError(404, 'Recovery code not found for this group')

        if (recoveryCodeRow.used_at) {
            throw createHttpError(409, 'Recovery code is already used')
        }

        if (isExpired(recoveryCodeRow.expires_at)) {
            throw createHttpError(410, 'Recovery code has expired')
        }

        const { data: existingMembership, error: existingMembershipError } = await supabase
            .from('split_group_members')
            .select('*')
            .eq('group_id', group.id)
            .eq('user_id', actor.user.id)
            .maybeSingle()

        if (existingMembershipError) throw existingMembershipError

        const shouldClaimOwnership = !group.created_by_user_id || group.created_by_guest_session
        const desiredRole = shouldClaimOwnership ? 'owner' : 'member'

        let member = existingMembership
        let alreadyJoined = false

        if (member) {
            alreadyJoined = true

            if (desiredRole === 'owner' && member.role !== 'owner') {
                const { data: upgradedMember, error: roleUpgradeError } = await supabase
                    .from('split_group_members')
                    .update({ role: 'owner' })
                    .eq('id', member.id)
                    .select('*')
                    .maybeSingle()

                if (roleUpgradeError) throw roleUpgradeError
                member = upgradedMember || member
            }
        } else {
            const { data: insertedMember, error: insertMemberError } = await supabase
                .from('split_group_members')
                .insert([
                    {
                        group_id: group.id,
                        user_id: actor.user.id,
                        guest_session: null,
                        display_name: defaultDisplayName(actor, requestedDisplayName),
                        email: actor.user.email || null,
                        role: desiredRole
                    }
                ])
                .select('*')
                .maybeSingle()

            if (insertMemberError) throw insertMemberError
            member = insertedMember
        }

        if (shouldClaimOwnership) {
            const { error: claimGroupOwnerError } = await supabase
                .from('split_groups')
                .update({
                    created_by_user_id: actor.user.id,
                    created_by_guest_session: null,
                    is_guest_group: false
                })
                .eq('id', group.id)

            if (claimGroupOwnerError) throw claimGroupOwnerError
        }

        const { error: consumeCodeError } = await supabase
            .from('split_group_recovery_codes')
            .update({
                used_by_user_id: actor.user.id,
                used_at: new Date().toISOString()
            })
            .eq('id', recoveryCodeRow.id)
            .is('used_at', null)

        if (consumeCodeError) throw consumeCodeError

        return res.status(200).json({
            data: {
                group,
                member,
                already_joined: alreadyJoined,
                claimed_owner: shouldClaimOwnership
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/recover]')
    }
}
