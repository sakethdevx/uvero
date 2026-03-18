import {
    buildUpiAppLinks,
    buildUpiDeepLink,
    computeLedger
} from '../shared/splitLogic.js'
import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

function enrichSuggestedSettlements(suggestedSettlements, membersById, currency) {
    return suggestedSettlements.map(item => {
        const toMember = membersById[item.to_member_id]
        const fromMember = membersById[item.from_member_id]

        const upiAddress = toMember?.upi_id || null
        const upiLink = buildUpiDeepLink({
            upiAddress,
            payeeName: toMember?.display_name || 'Trip member',
            amountPaise: item.amount_paise,
            note: `Settlement for group share`,
            currency
        })

        return {
            ...item,
            from_member_name: fromMember?.display_name || 'Member',
            to_member_name: toMember?.display_name || 'Member',
            upi_link: upiLink,
            upi_app_links: buildUpiAppLinks(upiLink)
        }
    })
}

export default async function handler(req, res) {
    if (!['GET', 'PATCH'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        const groupId = String(req.query?.group_id || req.body?.group_id || '').trim()
        if (!groupId) {
            throw createHttpError(400, 'group_id is required')
        }

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        if (req.method === 'PATCH') {
            if (actorMember.role !== 'owner') {
                throw createHttpError(403, 'Only owner can update group settings')
            }

            const updates = {}
            const { name, description } = req.body || {}

            if (name !== undefined) {
                const normalizedName = String(name || '').trim()
                if (!normalizedName) throw createHttpError(400, 'Group name cannot be empty')
                updates.name = normalizedName.slice(0, 120)
            }

            if (description !== undefined) {
                updates.description = String(description || '').trim().slice(0, 400) || null
            }

            if (!Object.keys(updates).length) {
                throw createHttpError(400, 'No group updates provided')
            }

            const { data: updated, error: updateError } = await supabase
                .from('split_groups')
                .update(updates)
                .eq('id', groupId)
                .select('*')
                .maybeSingle()

            if (updateError) throw updateError

            return res.status(200).json({ data: updated })
        }

        const { data: group, error: groupError } = await supabase
            .from('split_groups')
            .select('*')
            .eq('id', groupId)
            .maybeSingle()

        if (groupError) throw groupError
        if (!group) throw createHttpError(404, 'Group not found')

        const { data: members, error: memberError } = await supabase
            .from('split_group_members')
            .select('*')
            .eq('group_id', groupId)
            .order('joined_at', { ascending: true })

        if (memberError) throw memberError

        const { data: expenses, error: expenseError } = await supabase
            .from('split_expenses')
            .select('*')
            .eq('group_id', groupId)
            .order('incurred_on', { ascending: false })
            .order('created_at', { ascending: false })

        if (expenseError) throw expenseError

        const expenseIds = (expenses || []).map(expense => expense.id)

        let shares = []
        if (expenseIds.length) {
            const { data: shareRows, error: shareError } = await supabase
                .from('split_expense_shares')
                .select('*')
                .in('expense_id', expenseIds)

            if (shareError) throw shareError
            shares = shareRows || []
        }

        const { data: settlements, error: settlementError } = await supabase
            .from('split_settlements')
            .select('*')
            .eq('group_id', groupId)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })

        if (settlementError) throw settlementError

        const membersById = (members || []).reduce((acc, member) => {
            acc[member.id] = member
            return acc
        }, {})

        const ledger = computeLedger({
            members: members || [],
            expenses: expenses || [],
            shares,
            settlements: settlements || []
        })

        const balances = ledger.balances.map(row => ({
            ...row,
            member: membersById[row.member_id] || null
        }))

        const suggestedSettlements = enrichSuggestedSettlements(
            ledger.suggested_settlements,
            membersById,
            group.currency || 'INR'
        )

        return res.status(200).json({
            data: {
                group,
                current_member: actorMember,
                members,
                expenses,
                shares,
                settlements,
                ledger: {
                    ...ledger,
                    balances,
                    suggested_settlements: suggestedSettlements
                }
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/group]')
    }
}
