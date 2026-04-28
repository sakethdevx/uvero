import {
    createHttpError,
    getServerSupabase,
    requireActorMembership,
    resolveActor,
    sendApiError
} from './_server.js'

function normalizeNullableText(value, maxLength) {
    if (value === undefined) return undefined
    const text = String(value || '').trim()
    return text ? text.slice(0, maxLength) : null
}

export default async function handler(req, res) {
    if (req.method !== 'PATCH') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const supabase = getServerSupabase()
        const actor = await resolveActor(req, supabase)

        const {
            group_id: groupId,
            display_name: displayName,
            upi_id: upiId,
            upi_mobile: upiMobile,
            upi_qr_url: upiQrUrl,
            payment_note: paymentNote
        } = req.body || {}

        if (!groupId) {
            throw createHttpError(400, 'group_id is required')
        }

        const actorMember = await requireActorMembership({
            supabase,
            groupId,
            actor
        })

        const updates = {
            display_name: normalizeNullableText(displayName, 80),
            upi_id: normalizeNullableText(upiId, 120),
            upi_mobile: normalizeNullableText(upiMobile, 20),
            upi_qr_url: normalizeNullableText(upiQrUrl, 500),
            payment_note: normalizeNullableText(paymentNote, 160)
        }

        const updatePayload = Object.fromEntries(
            Object.entries(updates).filter(([, value]) => value !== undefined)
        )

        if (!Object.keys(updatePayload).length) {
            throw createHttpError(400, 'No profile fields provided')
        }

        if (updatePayload.display_name !== undefined && !updatePayload.display_name) {
            throw createHttpError(400, 'display_name cannot be empty')
        }

        const { data: updatedMember, error: updateError } = await supabase
            .from('split_group_members')
            .update(updatePayload)
            .eq('id', actorMember.id)
            .eq('group_id', groupId)
            .select('*')
            .maybeSingle()

        if (updateError) throw updateError

        return res.status(200).json({ data: updatedMember })
    } catch (error) {
        return sendApiError(res, error, '[api/split/members]')
    }
}
