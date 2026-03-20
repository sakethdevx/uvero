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
import {
    deriveOcrStatus,
    normalizeOcrStatus,
    OCR_STATUS
} from './ocrStatus.js'

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
                file_content: fileContentInput,
                file_mime_type: fileMimeTypeInput,
                ocr_requested: ocrRequested = false,
                ocr_text: ocrText,
                ocr_payload: ocrPayload
            } = req.body || {}
            const fileUrl = String(fileUrlInput || '').trim()
            const fileContent = normalizeBase64Content(fileContentInput)
            const hasDirectUpload = !!fileContent

            if (!groupId || !expenseId || !(fileUrl || hasDirectUpload)) {
                throw createHttpError(400, 'group_id, expense_id and (file_url or file_content) are required')
            }

            if (hasDirectUpload) {
                const decodedBytes = getDecodedByteLength(fileContent)
                if (!Number.isFinite(decodedBytes) || decodedBytes <= 0) {
                    throw createHttpError(400, 'file_content must be valid base64 data')
                }
                if (decodedBytes > MAX_UPLOAD_BYTES) {
                    const maxMb = Math.max(1, Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024)))
                    throw createHttpError(413, `Uploaded receipt is too large. Max allowed size is ${maxMb}MB`)
                }
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

            let persistedFileUrl = fileUrl
            let persistedFileName = fileNameInput ? String(fileNameInput).trim().slice(0, 200) : null
            let storageMode = 'external_link'
            let storageProvider = null
            let storagePath = null
            let sourceUrl = fileUrl || null
            let fileMimeType = fileMimeTypeInput ? String(fileMimeTypeInput).trim().toLowerCase().slice(0, 120) : null
            let sizeBytes = null

            if (hasDirectUpload) {
                const uploadResult = await storeReceiptUpload({
                    groupId,
                    expenseId,
                    fileName: persistedFileName,
                    fileContentBase64: fileContent,
                    fileMimeType: fileMimeTypeInput
                })

                persistedFileUrl = uploadResult.url
                if (!persistedFileName) {
                    persistedFileName = uploadResult.file_name
                }

                storageMode = 'github_upload'
                storageProvider = 'github'
                storagePath = uploadResult.path
                sourceUrl = null
                sizeBytes = uploadResult.size_bytes
            }

            const { data: inserted, error: insertError } = await supabase
                .from('split_expense_receipts')
                .insert([
                    {
                        group_id: groupId,
                        expense_id: expenseId,
                        uploaded_by_member_id: actorMember.id,
                        file_url: persistedFileUrl,
                        file_name: persistedFileName,
                        storage_mode: storageMode,
                        storage_provider: storageProvider,
                        storage_path: storagePath,
                        source_url: sourceUrl,
                        file_mime_type: fileMimeType,
                        size_bytes: sizeBytes,
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
        }

        if (ocrPayload !== undefined) {
            updates.ocr_payload = ocrPayload && typeof ocrPayload === 'object' ? ocrPayload : null
        }

        if (ocrStatus !== undefined || ocrText !== undefined || ocrPayload !== undefined) {
            updates.ocr_status = normalizeOcrStatus({
                ocrStatus: updates.ocr_status ?? receipt.ocr_status,
                ocrText: updates.ocr_text !== undefined ? updates.ocr_text : receipt.ocr_text,
                ocrPayload: updates.ocr_payload !== undefined ? updates.ocr_payload : receipt.ocr_payload
            })
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
