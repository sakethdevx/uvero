import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

const PROOF_STATUS = new Set(['submitted', 'verified', 'rejected'])

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
                file_url: fileUrlInput,
                file_name: fileName,
                note
            } = req.body || {}

            const fileUrl = String(fileUrlInput || '').trim()

            if (!groupId || !settlementId || !fileUrl) {
                throw createHttpError(400, 'group_id, settlement_id and file_url are required')
            }

            const actorMember = await requireActorMembership({
                supabase,
                groupId,
                actor
            })

            const { data: settlement, error: settlementError } = await supabase
                .from('split_settlements')
                .select('*')
                .eq('id', settlementId)
                .eq('group_id', groupId)
                .maybeSingle()

            if (settlementError) throw settlementError
            if (!settlement) throw createHttpError(404, 'Settlement not found')

            const canUploadProof = actorMember.role === 'owner' || actorMember.id === settlement.from_member_id
            if (!canUploadProof) {
                throw createHttpError(403, 'Only payer or owner can upload payment proof')
            }

            const { data: inserted, error: insertError } = await supabase
                .from('split_settlement_payment_proofs')
                .insert([
                    {
                        group_id: groupId,
                        settlement_id: settlementId,
                        uploaded_by_member_id: actorMember.id,
                        file_url: fileUrl,
                        file_name: fileName ? String(fileName).slice(0, 200) : null,
                        note: note ? String(note).slice(0, 300) : null,
                        proof_status: 'submitted'
                    }
                ])
                .select('*')
                .maybeSingle()

            if (insertError) throw insertError

            if (settlement.status === 'pending') {
                await supabase
                    .from('split_settlements')
                    .update({ status: 'paid' })
                    .eq('id', settlementId)
                    .eq('group_id', groupId)
            }

            return res.status(201).json({ data: inserted })
        }

        const {
            group_id: groupId,
            payment_proof_id: paymentProofId,
            proof_status: proofStatus,
            note
        } = req.body || {}

        if (!groupId || !paymentProofId) {
            throw createHttpError(400, 'group_id and payment_proof_id are required')
        }

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        const { data: proof, error: proofError } = await supabase
            .from('split_settlement_payment_proofs')
            .select('*')
            .eq('id', paymentProofId)
            .eq('group_id', groupId)
            .maybeSingle()

        if (proofError) throw proofError
        if (!proof) throw createHttpError(404, 'Payment proof not found')

        const { data: settlement, error: settlementError } = await supabase
            .from('split_settlements')
            .select('*')
            .eq('id', proof.settlement_id)
            .eq('group_id', groupId)
            .maybeSingle()

        if (settlementError) throw settlementError
        if (!settlement) throw createHttpError(404, 'Settlement not found')

        const canReviewProof = actorMember.role === 'owner' || actorMember.id === settlement.to_member_id
        const isUploader = proof.uploaded_by_member_id === actorMember.id

        if (!canReviewProof && !isUploader) {
            throw createHttpError(403, 'Not allowed to update this payment proof')
        }

        const updates = {}

        if (note !== undefined) {
            updates.note = String(note || '').trim().slice(0, 300) || null
        }

        if (proofStatus !== undefined) {
            const nextStatus = String(proofStatus || '').trim().toLowerCase()
            if (!PROOF_STATUS.has(nextStatus)) {
                throw createHttpError(400, 'Invalid proof_status')
            }

            if (!canReviewProof) {
                throw createHttpError(403, 'Only receiver or owner can review proof status')
            }

            updates.proof_status = nextStatus
            updates.reviewed_at = nextStatus === 'submitted' ? null : new Date().toISOString()
        }

        if (!Object.keys(updates).length) {
            throw createHttpError(400, 'No payment proof updates provided')
        }

        const { data: updated, error: updateError } = await supabase
            .from('split_settlement_payment_proofs')
            .update(updates)
            .eq('id', paymentProofId)
            .eq('group_id', groupId)
            .select('*')
            .maybeSingle()

        if (updateError) throw updateError

        if (updates.proof_status === 'verified') {
            await supabase
                .from('split_settlements')
                .update({
                    status: 'confirmed',
                    confirmed_at: new Date().toISOString()
                })
                .eq('id', settlement.id)
                .eq('group_id', groupId)
        }

        if (updates.proof_status === 'rejected' && settlement.status === 'confirmed') {
            await supabase
                .from('split_settlements')
                .update({
                    status: 'paid',
                    confirmed_at: null
                })
                .eq('id', settlement.id)
                .eq('group_id', groupId)
        }

        return res.status(200).json({ data: updated })
    } catch (error) {
        return sendApiError(res, error, '[api/split/payment-proofs]')
    }
}
