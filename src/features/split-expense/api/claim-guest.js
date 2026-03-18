import {
    createHttpError,
    getServerSupabase,
    resolveActor,
    sendApiError
} from './_server.js'

async function hasMemberReferences(supabase, memberId) {
    const checks = [
        supabase.from('split_expenses').select('id', { count: 'exact', head: true }).eq('paid_by_member_id', memberId),
        supabase.from('split_expenses').select('id', { count: 'exact', head: true }).eq('created_by_member_id', memberId),
        supabase.from('split_expense_shares').select('id', { count: 'exact', head: true }).eq('member_id', memberId),
        supabase.from('split_settlements').select('id', { count: 'exact', head: true }).or(`from_member_id.eq.${memberId},to_member_id.eq.${memberId},created_by_member_id.eq.${memberId}`),
        supabase.from('split_expense_receipts').select('id', { count: 'exact', head: true }).eq('uploaded_by_member_id', memberId),
        supabase.from('split_settlement_payment_proofs').select('id', { count: 'exact', head: true }).eq('uploaded_by_member_id', memberId),
        supabase.from('split_reminders').select('id', { count: 'exact', head: true }).or(`from_member_id.eq.${memberId},to_member_id.eq.${memberId}`)
    ]

    for (const check of checks) {
        const { count, error } = await check
        if (error) throw error
        if ((count || 0) > 0) return true
    }

    return false
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        if (actor.type !== 'user') {
            throw createHttpError(403, 'Only signed-in users can claim guest data')
        }

        const guestSession = String(req.body?.guest_session || '').trim()
        if (!guestSession) {
            throw createHttpError(400, 'guest_session is required')
        }

        if (!/^[a-zA-Z0-9_-]{8,128}$/.test(guestSession)) {
            throw createHttpError(400, 'Invalid guest session')
        }

        const { data: guestMemberships, error: guestMembershipError } = await supabase
            .from('split_group_members')
            .select('*')
            .eq('guest_session', guestSession)
            .order('joined_at', { ascending: true })

        if (guestMembershipError) throw guestMembershipError

        if (!guestMemberships?.length) {
            return res.status(200).json({
                data: {
                    claimed_groups: 0,
                    claimed_memberships: 0,
                    merged_groups: 0,
                    skipped_groups: [],
                    message: 'No guest data found for this browser session'
                }
            })
        }

        let claimedMemberships = 0
        let mergedGroups = 0
        const claimedGroupIds = new Set()
        const skippedGroups = []

        for (const guestMembership of guestMemberships) {
            const { data: existingUserMembership, error: existingUserMembershipError } = await supabase
                .from('split_group_members')
                .select('*')
                .eq('group_id', guestMembership.group_id)
                .eq('user_id', actor.user.id)
                .maybeSingle()

            if (existingUserMembershipError) throw existingUserMembershipError

            if (existingUserMembership) {
                if (guestMembership.role === 'owner' && existingUserMembership.role !== 'owner') {
                    const { error: roleUpdateError } = await supabase
                        .from('split_group_members')
                        .update({ role: 'owner' })
                        .eq('id', existingUserMembership.id)

                    if (roleUpdateError) throw roleUpdateError
                }

                const hasReferences = await hasMemberReferences(supabase, guestMembership.id)
                if (!hasReferences) {
                    const { error: deleteGuestMembershipError } = await supabase
                        .from('split_group_members')
                        .delete()
                        .eq('id', guestMembership.id)

                    if (deleteGuestMembershipError) throw deleteGuestMembershipError
                    mergedGroups += 1
                } else {
                    skippedGroups.push({
                        group_id: guestMembership.group_id,
                        reason: 'existing_account_membership_with_guest_activity'
                    })
                }

                claimedGroupIds.add(guestMembership.group_id)
                continue
            }

            const { error: claimMembershipError } = await supabase
                .from('split_group_members')
                .update({
                    user_id: actor.user.id,
                    guest_session: null,
                    email: actor.user.email || guestMembership.email || null
                })
                .eq('id', guestMembership.id)

            if (claimMembershipError) throw claimMembershipError
            claimedMemberships += 1
            claimedGroupIds.add(guestMembership.group_id)
        }

        const claimedGroupIdList = Array.from(claimedGroupIds)
        if (claimedGroupIdList.length) {
            const { error: groupOwnerError } = await supabase
                .from('split_groups')
                .update({
                    created_by_user_id: actor.user.id,
                    created_by_guest_session: null,
                    is_guest_group: false
                })
                .in('id', claimedGroupIdList)
                .eq('created_by_guest_session', guestSession)

            if (groupOwnerError) throw groupOwnerError
        }

        return res.status(200).json({
            data: {
                claimed_groups: claimedGroupIdList.length,
                claimed_memberships: claimedMemberships,
                merged_groups: mergedGroups,
                skipped_groups: skippedGroups,
                message: 'Guest TripSplit data linked to your account'
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/claim-guest]')
    }
}
