import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

const REMINDER_CHANNELS = new Set(['in_app', 'email', 'sms', 'whatsapp'])
const REMINDER_STATUS = new Set(['sent', 'acknowledged', 'dismissed'])

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
                settlement_id: settlementId,
                expense_id: expenseId,
                to_member_id: toMemberId,
                channel: channelInput = 'in_app',
                message: messageInput
            } = req.body || {}

            if (!groupId || !toMemberId) {
                throw createHttpError(400, 'group_id and to_member_id are required')
            }

            const actorMember = await requireActorMembership({
                supabase,
                groupId,
                actor
            })

            const { data: recipient, error: recipientError } = await supabase
                .from('split_group_members')
                .select('id, display_name')
                .eq('group_id', groupId)
                .eq('id', toMemberId)
                .maybeSingle()

            if (recipientError) throw recipientError
            if (!recipient) throw createHttpError(404, 'Recipient member not found')

            const channel = String(channelInput || 'in_app').trim().toLowerCase()
            if (!REMINDER_CHANNELS.has(channel)) {
                throw createHttpError(400, 'Invalid reminder channel')
            }

            let message = String(messageInput || '').trim()
            if (!message) {
                message = `Reminder: ${recipient.display_name}, please settle your pending amount in group ${groupId}.`
            }

            const { data: inserted, error: insertError } = await supabase
                .from('split_reminders')
                .insert([
                    {
                        group_id: groupId,
                        settlement_id: settlementId || null,
                        expense_id: expenseId || null,
                        from_member_id: actorMember.id,
                        to_member_id: toMemberId,
                        channel,
                        message: message.slice(0, 800),
                        status: 'sent'
                    }
                ])
                .select('*')
                .maybeSingle()

            if (insertError) throw insertError

            return res.status(201).json({ data: inserted })
        }

        const {
            group_id: groupId,
            reminder_id: reminderId,
            status: statusInput
        } = req.body || {}

        if (!groupId || !reminderId || !statusInput) {
            throw createHttpError(400, 'group_id, reminder_id and status are required')
        }

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        const { data: reminder, error: reminderError } = await supabase
            .from('split_reminders')
            .select('*')
            .eq('id', reminderId)
            .eq('group_id', groupId)
            .maybeSingle()

        if (reminderError) throw reminderError
        if (!reminder) throw createHttpError(404, 'Reminder not found')

        const nextStatus = String(statusInput || '').trim().toLowerCase()
        if (!REMINDER_STATUS.has(nextStatus)) {
            throw createHttpError(400, 'Invalid reminder status')
        }

        const canUpdate = actorMember.role === 'owner'
            || reminder.to_member_id === actorMember.id
            || reminder.from_member_id === actorMember.id

        if (!canUpdate) {
            throw createHttpError(403, 'Not allowed to update this reminder')
        }

        const { data: updated, error: updateError } = await supabase
            .from('split_reminders')
            .update({ status: nextStatus })
            .eq('id', reminderId)
            .eq('group_id', groupId)
            .select('*')
            .maybeSingle()

        if (updateError) throw updateError

        return res.status(200).json({ data: updated })
    } catch (error) {
        return sendApiError(res, error, '[api/split/reminders]')
    }
}
