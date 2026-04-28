import { buildUpiAppLinks, buildUpiDeepLink, toPaise } from '../shared/splitLogic.js'
import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

const ALLOWED_STATUS = new Set(['pending', 'paid', 'confirmed', 'cancelled'])

export default async function handler(req, res) {
    if (!['POST', 'PATCH'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        if (req.method === 'POST') {
            const {
                group_id: groupId,
                from_member_id: fromMemberId,
                to_member_id: toMemberId,
                amount,
                amount_paise: amountPaiseInput,
                currency = 'INR',
                status: statusInput = 'pending',
                reference_note: referenceNote
            } = req.body || {}

            if (!groupId || !fromMemberId || !toMemberId) {
                throw createHttpError(400, 'group_id, from_member_id and to_member_id are required')
            }

            if (fromMemberId === toMemberId) {
                throw createHttpError(400, 'from_member_id and to_member_id cannot be same')
            }

            const actorMember = await requireActorMembership({
                supabase,
                groupId,
                actor
            })

            const status = String(statusInput || 'pending').toLowerCase()
            if (!ALLOWED_STATUS.has(status)) {
                throw createHttpError(400, 'Invalid settlement status')
            }

            if (actorMember.role !== 'owner' && actorMember.id !== fromMemberId) {
                throw createHttpError(403, 'Only payer member can create this settlement')
            }

            const { data: members, error: membersError } = await supabase
                .from('split_group_members')
                .select('*')
                .eq('group_id', groupId)

            if (membersError) throw membersError

            const membersById = (members || []).reduce((acc, member) => {
                acc[member.id] = member
                return acc
            }, {})

            if (!membersById[fromMemberId] || !membersById[toMemberId]) {
                throw createHttpError(400, 'Settlement members must belong to the group')
            }

            const amountPaise = amountPaiseInput !== undefined && amountPaiseInput !== null
                ? Math.round(Number(amountPaiseInput))
                : toPaise(amount)

            if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
                throw createHttpError(400, 'Settlement amount must be greater than 0')
            }

            const toMember = membersById[toMemberId]
            const upiAddress = toMember?.upi_id || null
            const upiLink = buildUpiDeepLink({
                upiAddress,
                payeeName: toMember?.display_name || 'Trip member',
                amountPaise,
                note: referenceNote || 'Trip share settlement',
                currency
            })

            const { data: settlement, error: settlementError } = await supabase
                .from('split_settlements')
                .insert([
                    {
                        group_id: groupId,
                        from_member_id: fromMemberId,
                        to_member_id: toMemberId,
                        amount_paise: amountPaise,
                        currency: String(currency || 'INR').toUpperCase().slice(0, 6),
                        status,
                        upi_link: upiLink,
                        reference_note: referenceNote ? String(referenceNote).slice(0, 200) : null,
                        created_by_member_id: actorMember.id,
                        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
                    }
                ])
                .select('*')
                .maybeSingle()

            if (settlementError) throw settlementError

            return res.status(201).json({
                data: {
                    ...settlement,
                    upi_app_links: buildUpiAppLinks(upiLink)
                }
            })
        }

        const {
            settlement_id: settlementId,
            status: nextStatusInput,
            reference_note: referenceNote
        } = req.body || {}

        if (!settlementId || !nextStatusInput) {
            throw createHttpError(400, 'settlement_id and status are required')
        }

        const nextStatus = String(nextStatusInput).toLowerCase()
        if (!ALLOWED_STATUS.has(nextStatus)) {
            throw createHttpError(400, 'Invalid settlement status')
        }

        const { data: settlement, error: settlementError } = await supabase
            .from('split_settlements')
            .select('*')
            .eq('id', settlementId)
            .maybeSingle()

        if (settlementError) throw settlementError
        if (!settlement) throw createHttpError(404, 'Settlement not found')

        const actorMember = await requireActorMembership({
            supabase,
            groupId: settlement.group_id,
            actor
        })

        const isOwner = actorMember.role === 'owner'
        const isPayer = actorMember.id === settlement.from_member_id
        const isPayee = actorMember.id === settlement.to_member_id

        if (nextStatus === 'paid' && !isOwner && !isPayer) {
            throw createHttpError(403, 'Only payer can mark settlement as paid')
        }

        if (nextStatus === 'confirmed' && !isOwner && !isPayee) {
            throw createHttpError(403, 'Only receiver can confirm settlement')
        }

        if (nextStatus === 'cancelled' && !isOwner && !isPayer) {
            throw createHttpError(403, 'Only payer can cancel settlement')
        }

        const updates = {
            status: nextStatus,
            confirmed_at: nextStatus === 'confirmed' ? new Date().toISOString() : null
        }

        if (referenceNote !== undefined) {
            updates.reference_note = String(referenceNote || '').trim().slice(0, 200) || null
        }

        const { data: updated, error: updateError } = await supabase
            .from('split_settlements')
            .update(updates)
            .eq('id', settlementId)
            .select('*')
            .maybeSingle()

        if (updateError) throw updateError

        return res.status(200).json({
            data: {
                ...updated,
                upi_app_links: buildUpiAppLinks(updated.upi_link)
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/settlements]')
    }
}
