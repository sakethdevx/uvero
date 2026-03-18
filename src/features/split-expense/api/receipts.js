import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

const OCR_STATUS = new Set(['pending', 'completed', 'failed', 'not_requested'])

function deriveOcrStatus({ ocrRequested, ocrText, ocrPayload }) {
    const hasOcrOutput = !!(ocrText || ocrPayload)
    if (hasOcrOutput) return 'completed'
    if (ocrRequested) return 'pending'
    return 'not_requested'
}

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
                expense_id: expenseId,
                file_url: fileUrlInput,
                file_name: fileNameInput,
                ocr_requested: ocrRequested = false,
                ocr_text: ocrText,
                ocr_payload: ocrPayload
            } = req.body || {}

            const fileUrl = String(fileUrlInput || '').trim()
            if (!groupId || !expenseId || !fileUrl) {
                throw createHttpError(400, 'group_id, expense_id and file_url are required')
            }

            const actorMember = await requireActorMembership({
                supabase,
                groupId,
                actor
            })

            const { data: expense, error: expenseError } = await supabase
                .from('split_expenses')
                .select('id')
                .eq('id', expenseId)
                .eq('group_id', groupId)
                .maybeSingle()

            if (expenseError) throw expenseError
            if (!expense) throw createHttpError(404, 'Expense not found')

            const { data: inserted, error: insertError } = await supabase
                .from('split_expense_receipts')
                .insert([
                    {
                        group_id: groupId,
                        expense_id: expenseId,
                        uploaded_by_member_id: actorMember.id,
                        file_url: fileUrl,
                        file_name: fileNameInput ? String(fileNameInput).slice(0, 200) : null,
                        ocr_status: deriveOcrStatus({ ocrRequested, ocrText, ocrPayload }),
                        ocr_text: ocrText ? String(ocrText).slice(0, 10000) : null,
                        ocr_payload: ocrPayload && typeof ocrPayload === 'object' ? ocrPayload : null
                    }
                ])
                .select('*')
                .maybeSingle()

            if (insertError) throw insertError

            return res.status(201).json({ data: inserted })
        }

        const {
            group_id: groupId,
            receipt_id: receiptId,
            file_url: fileUrl,
            file_name: fileName,
            ocr_status: ocrStatus,
            ocr_text: ocrText,
            ocr_payload: ocrPayload
        } = req.body || {}

        if (!groupId || !receiptId) {
            throw createHttpError(400, 'group_id and receipt_id are required')
        }

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        const { data: receipt, error: receiptError } = await supabase
            .from('split_expense_receipts')
            .select('*')
            .eq('id', receiptId)
            .eq('group_id', groupId)
            .maybeSingle()

        if (receiptError) throw receiptError
        if (!receipt) throw createHttpError(404, 'Receipt not found')

        const canUpdate = actorMember.role === 'owner' || receipt.uploaded_by_member_id === actorMember.id
        if (!canUpdate) {
            throw createHttpError(403, 'Only uploader or owner can update this receipt')
        }

        const updates = {}

        if (fileUrl !== undefined) {
            const normalized = String(fileUrl || '').trim()
            if (!normalized) throw createHttpError(400, 'file_url cannot be empty')
            updates.file_url = normalized
        }

        if (fileName !== undefined) {
            updates.file_name = String(fileName || '').trim().slice(0, 200) || null
        }

        if (ocrStatus !== undefined) {
            const nextStatus = String(ocrStatus || '').trim().toLowerCase()
            if (!OCR_STATUS.has(nextStatus)) {
                throw createHttpError(400, 'Invalid ocr_status')
            }
            updates.ocr_status = nextStatus
        }

        if (ocrText !== undefined) {
            updates.ocr_text = String(ocrText || '').slice(0, 10000) || null
            if (updates.ocr_text && updates.ocr_status === undefined) {
                updates.ocr_status = 'completed'
            }
        }

        if (ocrPayload !== undefined) {
            updates.ocr_payload = ocrPayload && typeof ocrPayload === 'object' ? ocrPayload : null
            if (updates.ocr_payload && updates.ocr_status === undefined) {
                updates.ocr_status = 'completed'
            }
        }

        if (!Object.keys(updates).length) {
            throw createHttpError(400, 'No receipt updates provided')
        }

        const { data: updated, error: updateError } = await supabase
            .from('split_expense_receipts')
            .update(updates)
            .eq('id', receiptId)
            .eq('group_id', groupId)
            .select('*')
            .maybeSingle()

        if (updateError) throw updateError

        return res.status(200).json({ data: updated })
    } catch (error) {
        return sendApiError(res, error, '[api/split/receipts]')
    }
}
