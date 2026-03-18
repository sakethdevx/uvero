import {
    createHttpError,
    defaultDisplayName,
    getServerSupabase,
    makeInviteCode,
    resolveActor,
    sendApiError,
    withActorFilter
} from './_server.js'

export default async function handler(req, res) {
    if (!['GET', 'POST'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        if (req.method === 'GET') {
            const { data: memberships, error: membershipError } = await withActorFilter(
                supabase
                    .from('split_group_members')
                    .select('*')
                    .order('joined_at', { ascending: false }),
                actor
            )

            if (membershipError) throw membershipError

            if (!memberships?.length) {
                return res.status(200).json({ data: [] })
            }

            const groupIds = [...new Set(memberships.map(item => item.group_id))]

            const { data: groups, error: groupError } = await supabase
                .from('split_groups')
                .select('*')
                .in('id', groupIds)
                .order('updated_at', { ascending: false })

            if (groupError) throw groupError

            const { data: membersForCount, error: countError } = await supabase
                .from('split_group_members')
                .select('group_id')
                .in('group_id', groupIds)

            if (countError) throw countError

            const { data: expensesForCount, error: expenseCountError } = await supabase
                .from('split_expenses')
                .select('group_id')
                .in('group_id', groupIds)

            if (expenseCountError) throw expenseCountError

            const memberCountByGroup = (membersForCount || []).reduce((acc, row) => {
                acc[row.group_id] = (acc[row.group_id] || 0) + 1
                return acc
            }, {})

            const expenseCountByGroup = (expensesForCount || []).reduce((acc, row) => {
                acc[row.group_id] = (acc[row.group_id] || 0) + 1
                return acc
            }, {})

            const memberByGroupId = memberships.reduce((acc, row) => {
                acc[row.group_id] = row
                return acc
            }, {})

            const payload = (groups || []).map(group => ({
                ...group,
                current_member: memberByGroupId[group.id] || null,
                members_count: memberCountByGroup[group.id] || 0,
                expenses_count: expenseCountByGroup[group.id] || 0
            }))

            return res.status(200).json({ data: payload })
        }

        const {
            name,
            description = null,
            currency = 'INR',
            display_name: requestedDisplayName
        } = req.body || {}

        const groupName = String(name || '').trim()
        if (!groupName) {
            throw createHttpError(400, 'Group name is required')
        }

        if (actor.type === 'guest') {
            const { count, error: guestGroupCountError } = await supabase
                .from('split_groups')
                .select('id', { count: 'exact', head: true })
                .eq('created_by_guest_session', actor.guest_session)

            if (guestGroupCountError) throw guestGroupCountError

            if ((count || 0) >= 2) {
                throw createHttpError(403, 'Guest users can create up to 2 groups. Sign in for unlimited groups.')
            }
        }

        let createdGroup = null

        for (let attempt = 0; attempt < 6; attempt += 1) {
            const inviteCode = makeInviteCode()
            const { data, error } = await supabase
                .from('split_groups')
                .insert([
                    {
                        name: groupName.slice(0, 120),
                        description: description ? String(description).slice(0, 400) : null,
                        currency: String(currency || 'INR').toUpperCase().slice(0, 6),
                        invite_code: inviteCode,
                        created_by_user_id: actor.type === 'user' ? actor.user.id : null,
                        created_by_guest_session: actor.type === 'guest' ? actor.guest_session : null,
                        is_guest_group: actor.type === 'guest'
                    }
                ])
                .select('*')
                .maybeSingle()

            if (!error && data) {
                createdGroup = data
                break
            }

            if (error?.code === '23505') {
                continue
            }

            throw error
        }

        if (!createdGroup) {
            throw createHttpError(500, 'Could not create group. Please try again.')
        }

        const { data: ownerMember, error: memberError } = await supabase
            .from('split_group_members')
            .insert([
                {
                    group_id: createdGroup.id,
                    user_id: actor.type === 'user' ? actor.user.id : null,
                    guest_session: actor.type === 'guest' ? actor.guest_session : null,
                    display_name: defaultDisplayName(actor, requestedDisplayName),
                    email: actor.type === 'user' ? actor.user.email : null,
                    role: 'owner'
                }
            ])
            .select('*')
            .maybeSingle()

        if (memberError) {
            await supabase.from('split_groups').delete().eq('id', createdGroup.id)
            throw memberError
        }

        return res.status(201).json({
            data: {
                ...createdGroup,
                current_member: ownerMember,
                members_count: 1,
                expenses_count: 0
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/groups]')
    }
}
