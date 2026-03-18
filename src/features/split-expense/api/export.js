import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

function csvCell(value) {
    if (value === null || value === undefined) return ''
    const text = String(value)
    if (!/[",\n\r]/.test(text)) return text
    return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows) {
    return rows.map(row => row.map(csvCell).join(',')).join('\n')
}

function safeJson(value) {
    try {
        return JSON.stringify(value ?? {})
    } catch {
        return '{}'
    }
}

function formatDate(value) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toISOString()
}

function memberNameById(members = []) {
    return members.reduce((acc, member) => {
        acc[member.id] = member.display_name || 'Member'
        return acc
    }, {})
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        const groupId = String(req.query?.group_id || '').trim()
        if (!groupId) {
            throw createHttpError(400, 'group_id is required')
        }

        await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        const { data: group, error: groupError } = await supabase
            .from('split_groups')
            .select('id, name, currency')
            .eq('id', groupId)
            .maybeSingle()

        if (groupError) throw groupError
        if (!group) throw createHttpError(404, 'Group not found')

        const { data: members, error: memberError } = await supabase
            .from('split_group_members')
            .select('id, display_name')
            .eq('group_id', groupId)

        if (memberError) throw memberError

        const memberName = memberNameById(members || [])

        const { data: expenses, error: expenseError } = await supabase
            .from('split_expenses')
            .select('*')
            .eq('group_id', groupId)
            .order('incurred_on', { ascending: false })
            .order('created_at', { ascending: false })

        if (expenseError) throw expenseError

        const expenseIds = (expenses || []).map(expense => expense.id)

        let shares = []
        let receipts = []

        if (expenseIds.length) {
            const { data: shareRows, error: shareError } = await supabase
                .from('split_expense_shares')
                .select('*')
                .in('expense_id', expenseIds)

            if (shareError) throw shareError
            shares = shareRows || []

            const { data: receiptRows, error: receiptError } = await supabase
                .from('split_expense_receipts')
                .select('*')
                .eq('group_id', groupId)
                .in('expense_id', expenseIds)

            if (receiptError) throw receiptError
            receipts = receiptRows || []
        }

        const { data: settlements, error: settlementError } = await supabase
            .from('split_settlements')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })

        if (settlementError) throw settlementError

        const settlementIds = (settlements || []).map(settlement => settlement.id)

        let paymentProofs = []
        if (settlementIds.length) {
            const { data: proofRows, error: proofError } = await supabase
                .from('split_settlement_payment_proofs')
                .select('*')
                .eq('group_id', groupId)
                .in('settlement_id', settlementIds)
                .order('created_at', { ascending: false })

            if (proofError) throw proofError
            paymentProofs = proofRows || []
        }

        const { data: reminders, error: reminderError } = await supabase
            .from('split_reminders')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false })

        if (reminderError) throw reminderError

        const sharesByExpenseId = shares.reduce((acc, row) => {
            if (!acc[row.expense_id]) acc[row.expense_id] = []
            acc[row.expense_id].push(row)
            return acc
        }, {})

        const receiptsByExpenseId = receipts.reduce((acc, row) => {
            if (!acc[row.expense_id]) acc[row.expense_id] = []
            acc[row.expense_id].push(row)
            return acc
        }, {})

        const settlementById = (settlements || []).reduce((acc, settlement) => {
            acc[settlement.id] = settlement
            return acc
        }, {})

        const rows = [[
            'section',
            'group_id',
            'group_name',
            'record_id',
            'record_date',
            'title',
            'amount_paise',
            'currency',
            'status',
            'from_member',
            'to_member',
            'paid_by_member',
            'created_by_member',
            'note',
            'meta_json'
        ]]

            ; (expenses || []).forEach(expense => {
                const expenseShares = sharesByExpenseId[expense.id] || []
                const expenseReceipts = receiptsByExpenseId[expense.id] || []

                rows.push([
                    'expense',
                    group.id,
                    group.name,
                    expense.id,
                    formatDate(expense.incurred_on || expense.created_at),
                    expense.title,
                    expense.amount_paise,
                    expense.currency || group.currency,
                    expense.split_mode,
                    '',
                    '',
                    memberName[expense.paid_by_member_id] || expense.paid_by_member_id,
                    memberName[expense.created_by_member_id] || expense.created_by_member_id,
                    expense.note || '',
                    safeJson({
                        participants: expenseShares.map(share => ({
                            member: memberName[share.member_id] || share.member_id,
                            share_paise: share.share_paise
                        })),
                        receipt_count: expenseReceipts.length
                    })
                ])
            })

            ; (settlements || []).forEach(settlement => {
                rows.push([
                    'settlement',
                    group.id,
                    group.name,
                    settlement.id,
                    formatDate(settlement.created_at),
                    'settlement',
                    settlement.amount_paise,
                    settlement.currency || group.currency,
                    settlement.status,
                    memberName[settlement.from_member_id] || settlement.from_member_id,
                    memberName[settlement.to_member_id] || settlement.to_member_id,
                    '',
                    memberName[settlement.created_by_member_id] || settlement.created_by_member_id,
                    settlement.reference_note || '',
                    safeJson({
                        upi_link: settlement.upi_link,
                        confirmed_at: settlement.confirmed_at
                    })
                ])
            })

        paymentProofs.forEach(proof => {
            const settlement = settlementById[proof.settlement_id]

            rows.push([
                'payment_proof',
                group.id,
                group.name,
                proof.id,
                formatDate(proof.created_at),
                proof.file_name || 'payment proof',
                settlement?.amount_paise || '',
                settlement?.currency || group.currency,
                proof.proof_status,
                memberName[proof.uploaded_by_member_id] || proof.uploaded_by_member_id,
                settlement ? (memberName[settlement.to_member_id] || settlement.to_member_id) : '',
                '',
                '',
                proof.note || '',
                safeJson({
                    settlement_id: proof.settlement_id,
                    file_url: proof.file_url,
                    reviewed_at: proof.reviewed_at
                })
            ])
        })

            ; (reminders || []).forEach(reminder => {
                rows.push([
                    'reminder',
                    group.id,
                    group.name,
                    reminder.id,
                    formatDate(reminder.created_at),
                    `reminder_${reminder.channel}`,
                    '',
                    group.currency,
                    reminder.status,
                    memberName[reminder.from_member_id] || reminder.from_member_id,
                    memberName[reminder.to_member_id] || reminder.to_member_id,
                    '',
                    '',
                    reminder.message || '',
                    safeJson({
                        settlement_id: reminder.settlement_id,
                        expense_id: reminder.expense_id
                    })
                ])
            })

        const csv = `\uFEFF${toCsv(rows)}\n`
        const dateStamp = new Date().toISOString().slice(0, 10)
        const fileName = `tripsplit-${group.id}-${dateStamp}.csv`

        res.setHeader('Content-Type', 'text/csv; charset=utf-8')
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
        return res.status(200).send(csv)
    } catch (error) {
        return sendApiError(res, error, '[api/split/export]')
    }
}
