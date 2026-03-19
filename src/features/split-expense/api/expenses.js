import { computeShares, toPaise } from '../shared/splitLogic.js'
import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'
import {
    MAX_UPLOAD_BYTES,
    getDecodedByteLength,
    normalizeBase64Content,
    storeReceiptUpload
} from './receiptsGithubStorage.js'

function normalizeTitle(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
}

async function mapReceiptInsertPayload({ receipt, groupId, expenseId }) {
    const fileUrlInput = String(receipt?.file_url || '').trim()
    const fileContent = normalizeBase64Content(receipt?.file_content)
    const hasDirectUpload = !!fileContent

    if (!fileUrlInput && !hasDirectUpload) return null

    let fileUrl = fileUrlInput
    let fileName = receipt?.file_name ? String(receipt.file_name).trim().slice(0, 200) : null
    let storageMode = 'external_link'
    let storageProvider = null
    let storagePath = null
    let sourceUrl = fileUrlInput || null
    let fileMimeType = receipt?.file_mime_type ? String(receipt.file_mime_type).trim().toLowerCase().slice(0, 120) : null
    let sizeBytes = null

    if (hasDirectUpload) {
        const decodedBytes = getDecodedByteLength(fileContent)
        if (!Number.isFinite(decodedBytes) || decodedBytes <= 0) {
            throw createHttpError(400, 'receipt.file_content must be valid base64 data')
        }
        if (decodedBytes > MAX_UPLOAD_BYTES) {
            const maxMb = Math.max(1, Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024)))
            throw createHttpError(413, `Receipt upload exceeds max size of ${maxMb}MB`)
        }

        const uploadResult = await storeReceiptUpload({
            groupId,
            expenseId,
            fileName,
            fileContentBase64: fileContent,
            fileMimeType: receipt?.file_mime_type
        })

        fileUrl = uploadResult.url
        if (!fileName) {
            fileName = uploadResult.file_name
        }

        storageMode = 'github_upload'
        storageProvider = 'github'
        storagePath = uploadResult.path
        sourceUrl = null
        sizeBytes = uploadResult.size_bytes
    }

    if (!fileUrl) return null

    const hasOcrOutput = !!(receipt?.ocr_text || receipt?.ocr_payload)
    const ocrRequested = !!receipt?.ocr_requested

    let ocrStatus = 'not_requested'
    if (hasOcrOutput) ocrStatus = 'completed'
    else if (ocrRequested) ocrStatus = 'pending'

    return {
        group_id: groupId,
        expense_id: expenseId,
        file_url: fileUrl,
        file_name: fileName,
        storage_mode: storageMode,
        storage_provider: storageProvider,
        storage_path: storagePath,
        source_url: sourceUrl,
        file_mime_type: fileMimeType,
        size_bytes: sizeBytes,
        ocr_status: ocrStatus,
        ocr_text: receipt?.ocr_text ? String(receipt.ocr_text).slice(0, 10000) : null,
        ocr_payload: receipt?.ocr_payload && typeof receipt.ocr_payload === 'object'
            ? receipt.ocr_payload
            : null
    }
}

function normalizeParticipants(rawParticipants, allMembers) {
    if (!Array.isArray(rawParticipants) || !rawParticipants.length) {
        return allMembers.map(member => ({ member_id: member.id }))
    }

    return rawParticipants
        .map(participant => {
            if (typeof participant === 'string') {
                return { member_id: participant }
            }

            if (!participant || typeof participant !== 'object') {
                return null
            }

            const memberId = participant.member_id || participant.memberId
            if (!memberId) return null

            return {
                ...participant,
                member_id: memberId
            }
        })
        .filter(Boolean)
}

export default async function handler(req, res) {
    if (!['POST', 'DELETE'].includes(req.method)) {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        if (req.method === 'DELETE') {
            const groupId = String(req.body?.group_id || '').trim()
            const expenseId = String(req.body?.expense_id || '').trim()

            if (!groupId || !expenseId) {
                throw createHttpError(400, 'group_id and expense_id are required')
            }

            const actorMember = await requireActorMembership({
                supabase,
                groupId,
                actor
            })

            const { data: expense, error: expenseError } = await supabase
                .from('split_expenses')
                .select('*')
                .eq('id', expenseId)
                .eq('group_id', groupId)
                .maybeSingle()

            if (expenseError) throw expenseError
            if (!expense) throw createHttpError(404, 'Expense not found')

            if (actorMember.role !== 'owner' && expense.created_by_member_id !== actorMember.id) {
                throw createHttpError(403, 'Only owner or expense creator can delete this expense')
            }

            const { error: deleteError } = await supabase
                .from('split_expenses')
                .delete()
                .eq('id', expenseId)
                .eq('group_id', groupId)

            if (deleteError) throw deleteError

            return res.status(200).json({ success: true })
        }

        const {
            group_id: groupId,
            title,
            note = null,
            amount,
            amount_paise: amountPaiseInput,
            currency,
            split_mode: splitModeInput = 'equal',
            paid_by_member_id: paidByMemberIdInput,
            participants: rawParticipants,
            incurred_on: incurredOn,
            allow_duplicate: allowDuplicate = false,
            receipt = null
        } = req.body || {}

        if (!groupId) throw createHttpError(400, 'group_id is required')

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        const { data: members, error: membersError } = await supabase
            .from('split_group_members')
            .select('*')
            .eq('group_id', groupId)

        if (membersError) throw membersError

        if (!members?.length) {
            throw createHttpError(400, 'No members found in this group')
        }

        const splitMode = String(splitModeInput || 'equal').trim().toLowerCase()
        const normalizedTitle = normalizeTitle(title)
        const amountPaise = amountPaiseInput !== undefined && amountPaiseInput !== null
            ? Math.round(Number(amountPaiseInput))
            : toPaise(amount)

        if (!title || !String(title).trim()) {
            throw createHttpError(400, 'Expense title is required')
        }

        if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
            throw createHttpError(400, 'Amount must be greater than 0')
        }

        if (actor.type === 'guest') {
            const { count, error: countError } = await supabase
                .from('split_expenses')
                .select('id', { count: 'exact', head: true })
                .eq('group_id', groupId)

            if (countError) throw countError

            if ((count || 0) >= 15) {
                throw createHttpError(403, 'Guest groups can add up to 15 expenses. Sign in for unlimited expenses.')
            }

            if (!['equal', 'exact'].includes(splitMode)) {
                throw createHttpError(403, 'Guest mode supports equal and exact splits. Sign in for advanced split modes.')
            }
        }

        const memberIdSet = new Set(members.map(member => member.id))
        const paidByMemberId = paidByMemberIdInput || actorMember.id
        const normalizedIncurredOn = incurredOn || new Date().toISOString().slice(0, 10)

        if (!memberIdSet.has(paidByMemberId)) {
            throw createHttpError(400, 'paid_by_member_id does not belong to this group')
        }

        const { data: possibleDuplicates, error: duplicateQueryError } = await supabase
            .from('split_expenses')
            .select('id, title, amount_paise, incurred_on, paid_by_member_id, created_at')
            .eq('group_id', groupId)
            .eq('amount_paise', amountPaise)
            .eq('incurred_on', normalizedIncurredOn)
            .eq('paid_by_member_id', paidByMemberId)
            .order('created_at', { ascending: false })
            .limit(12)

        if (duplicateQueryError) throw duplicateQueryError

        const duplicateExpense = (possibleDuplicates || []).find(row => normalizeTitle(row.title) === normalizedTitle)
        if (duplicateExpense && !allowDuplicate) {
            return res.status(409).json({
                error: 'Possible duplicate expense detected for same payer, amount, date and title',
                duplicate_expense: duplicateExpense
            })
        }

        const normalizedParticipants = normalizeParticipants(rawParticipants, members)

        if (!normalizedParticipants.length) {
            throw createHttpError(400, 'At least one participant is required')
        }

        const invalidParticipant = normalizedParticipants.find(participant => !memberIdSet.has(participant.member_id))
        if (invalidParticipant) {
            throw createHttpError(400, 'One or more participant ids are invalid for this group')
        }

        const shareRows = computeShares({
            splitMode,
            amountPaise,
            participants: normalizedParticipants
        })

        const { data: expense, error: insertExpenseError } = await supabase
            .from('split_expenses')
            .insert([
                {
                    group_id: groupId,
                    title: String(title).trim().slice(0, 160),
                    note: note ? String(note).slice(0, 800) : null,
                    amount_paise: amountPaise,
                    currency: String(currency || 'INR').toUpperCase().slice(0, 6),
                    split_mode: splitMode,
                    paid_by_member_id: paidByMemberId,
                    incurred_on: normalizedIncurredOn,
                    created_by_member_id: actorMember.id
                }
            ])
            .select('*')
            .maybeSingle()

        if (insertExpenseError) throw insertExpenseError

        const rowsToInsert = shareRows.map(row => ({
            expense_id: expense.id,
            member_id: row.member_id,
            share_paise: row.amount_paise,
            meta: {
                split_mode: splitMode
            }
        }))

        const { data: insertedShares, error: insertSharesError } = await supabase
            .from('split_expense_shares')
            .insert(rowsToInsert)
            .select('*')

        if (insertSharesError) {
            await supabase.from('split_expenses').delete().eq('id', expense.id)
            throw insertSharesError
        }

        const receiptInsert = await mapReceiptInsertPayload({
            receipt,
            groupId,
            expenseId: expense.id
        })

        let insertedReceipt = null
        if (receiptInsert) {
            const { data: receiptRow, error: receiptError } = await supabase
                .from('split_expense_receipts')
                .insert([{ ...receiptInsert, uploaded_by_member_id: actorMember.id }])
                .select('*')
                .maybeSingle()

            if (receiptError) {
                await supabase.from('split_expenses').delete().eq('id', expense.id)
                throw receiptError
            }

            insertedReceipt = receiptRow
        }

        return res.status(201).json({
            data: {
                expense,
                shares: insertedShares || [],
                receipt: insertedReceipt
            }
        })
    } catch (error) {
        return sendApiError(res, error, '[api/split/expenses]')
    }
}
