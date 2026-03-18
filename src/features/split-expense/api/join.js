import {
    createHttpError,
    defaultDisplayName,
    getServerSupabase,
    resolveActor,
    sendApiError,
    withActorFilter
} from './_server.js'

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        const { invite_code: rawInviteCode, display_name: requestedDisplayName } = req.body || {}
        const inviteCode = String(rawInviteCode || '').trim().toUpperCase()

        if (!inviteCode) {
            throw createHttpError(400, 'invite_code is required')
        }

        const { data: group, error: groupError } = await supabase
            .from('split_groups')
            .select('*')
            .eq('invite_code', inviteCode)
            .maybeSingle()

        if (groupError) throw groupError
        if (!group) throw createHttpError(404, 'Group not found for this invite code')

        const { data: existingMember, error: existingError } = await withActorFilter(
            supabase
                .from('split_group_members')
                .select('*')
                .eq('group_id', group.id),
            actor
        ).maybeSingle()

        if (existingError) throw existingError

        if (existingMember) {
            return res.status(200).json({ data: { group, member: existingMember, already_joined: true } })
        }

        const { data: member, error: insertError } = await supabase
            .from('split_group_members')
            .insert([
                {
                    group_id: group.id,
                    user_id: actor.type === 'user' ? actor.user.id : null,
                    guest_session: actor.type === 'guest' ? actor.guest_session : null,
                    display_name: defaultDisplayName(actor, requestedDisplayName),
                    email: actor.type === 'user' ? actor.user.email : null,
                    role: 'member'
                }
            ])
            .select('*')
            .maybeSingle()

        if (insertError) throw insertError

        return res.status(201).json({ data: { group, member, already_joined: false } })
    } catch (error) {
        return sendApiError(res, error, '[api/split/join]')
    }
}
