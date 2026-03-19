import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import { splitApiDownload, splitApiRequest } from '../api/client'
import { formatPaise } from '../shared/splitLogic'

const SPLIT_MODES = [
    { value: 'equal', label: 'Equal' },
    { value: 'exact', label: 'Exact amount' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'shares', label: 'Shares / weights' }
]

const UPI_APP_REFERENCE_LINKS = [
    {
        label: 'Google Pay',
        url: 'https://play.google.com/store/apps/details?id=com.google.android.apps.nbu.paisa.user'
    },
    {
        label: 'PhonePe',
        url: 'https://play.google.com/store/apps/details?id=com.phonepe.app'
    },
    {
        label: 'Paytm',
        url: 'https://play.google.com/store/apps/details?id=net.one97.paytm'
    },
    {
        label: 'BHIM',
        url: 'https://play.google.com/store/apps/details?id=in.org.npci.upiapp'
    }
]

const MAX_RECEIPT_UPLOAD_BYTES = 5 * 1024 * 1024

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Unable to read file'))
        reader.readAsDataURL(file)
    })
}

function extractBase64FromDataUrl(value) {
    const text = String(value || '')
    const marker = 'base64,'
    const index = text.indexOf(marker)
    if (index === -1) return text.trim()
    return text.slice(index + marker.length).trim()
}

function formatBytes(bytes) {
    const size = Number(bytes || 0)
    if (!Number.isFinite(size) || size <= 0) return ''
    if (size < 1024) return `${size} B`
    const kb = size / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(2)} MB`
}

function splitInputPlaceholder(mode) {
    if (mode === 'exact') return 'Amount'
    if (mode === 'percentage') return '%'
    if (mode === 'shares') return 'Units'
    return ''
}

function buildDefaultSplitInputs(memberIds, mode) {
    const next = {}

    if (mode === 'percentage') {
        const defaultPercent = memberIds.length ? (100 / memberIds.length).toFixed(2) : ''
        memberIds.forEach(id => {
            next[id] = defaultPercent
        })
        return next
    }

    if (mode === 'shares') {
        memberIds.forEach(id => {
            next[id] = '1'
        })
        return next
    }

    memberIds.forEach(id => {
        next[id] = ''
    })

    return next
}

export default function SplitExpenseGroup() {
    const { groupId } = useParams()
    const { user } = useAuth()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [data, setData] = useState(null)

    const [profileSaving, setProfileSaving] = useState(false)
    const [expenseSaving, setExpenseSaving] = useState(false)
    const [settlementLoading, setSettlementLoading] = useState('')
    const [exportLoading, setExportLoading] = useState(false)
    const [receiptSaving, setReceiptSaving] = useState('')
    const [proofSaving, setProofSaving] = useState('')
    const [proofReviewLoading, setProofReviewLoading] = useState('')
    const [reminderLoading, setReminderLoading] = useState('')
    const [recoveryCodeLoading, setRecoveryCodeLoading] = useState(false)
    const [generatedRecoveryCode, setGeneratedRecoveryCode] = useState('')
    const [generatedRecoveryExpiry, setGeneratedRecoveryExpiry] = useState('')

    const [profileForm, setProfileForm] = useState({
        display_name: '',
        upi_id: '',
        upi_mobile: '',
        upi_qr_url: '',
        payment_note: ''
    })

    const [expenseForm, setExpenseForm] = useState({
        title: '',
        amount: '',
        paid_by_member_id: '',
        split_mode: 'equal',
        note: '',
        incurred_on: new Date().toISOString().slice(0, 10),
        receipt_input_mode: 'link',
        receipt_file_url: '',
        receipt_file_name: '',
        receipt_file_content: '',
        receipt_file_mime_type: '',
        receipt_file_size_bytes: null,
        receipt_ocr_requested: false,
        receipt_ocr_text: ''
    })

    const [selectedMembers, setSelectedMembers] = useState([])
    const [splitInputs, setSplitInputs] = useState({})
    const [receiptDrafts, setReceiptDrafts] = useState({})
    const [proofDrafts, setProofDrafts] = useState({})

    const members = useMemo(() => data?.members || [], [data?.members])
    const expenses = useMemo(() => data?.expenses || [], [data?.expenses])
    const shares = useMemo(() => data?.shares || [], [data?.shares])
    const settlements = useMemo(() => data?.settlements || [], [data?.settlements])
    const receipts = useMemo(() => data?.receipts || [], [data?.receipts])
    const paymentProofs = useMemo(() => data?.payment_proofs || [], [data?.payment_proofs])
    const reminders = useMemo(() => data?.reminders || [], [data?.reminders])

    const membersById = useMemo(() => {
        return members.reduce((acc, member) => {
            acc[member.id] = member
            return acc
        }, {})
    }, [members])

    const sharesByExpenseId = useMemo(() => {
        return shares.reduce((acc, row) => {
            if (!acc[row.expense_id]) acc[row.expense_id] = []
            acc[row.expense_id].push(row)
            return acc
        }, {})
    }, [shares])

    const receiptsByExpenseId = useMemo(() => {
        return receipts.reduce((acc, row) => {
            if (!acc[row.expense_id]) acc[row.expense_id] = []
            acc[row.expense_id].push(row)
            return acc
        }, {})
    }, [receipts])

    const paymentProofsBySettlementId = useMemo(() => {
        return paymentProofs.reduce((acc, row) => {
            if (!acc[row.settlement_id]) acc[row.settlement_id] = []
            acc[row.settlement_id].push(row)
            return acc
        }, {})
    }, [paymentProofs])

    const balances = data?.ledger?.balances || []
    const suggestedSettlements = data?.ledger?.suggested_settlements || []

    const loadGroup = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const response = await splitApiRequest(`/api/split/group?group_id=${encodeURIComponent(groupId)}`, {
                method: 'GET',
                user
            })

            const nextData = response.data
            setData(nextData)

            const currentMember = nextData?.current_member
            if (currentMember) {
                setProfileForm({
                    display_name: currentMember.display_name || '',
                    upi_id: currentMember.upi_id || '',
                    upi_mobile: currentMember.upi_mobile || '',
                    upi_qr_url: currentMember.upi_qr_url || '',
                    payment_note: currentMember.payment_note || ''
                })
            }

            const memberIds = (nextData?.members || []).map(member => member.id)
            setSelectedMembers(memberIds)

            const defaultPaidBy = currentMember?.id || memberIds[0] || ''
            setExpenseForm(prev => ({
                ...prev,
                paid_by_member_id: defaultPaidBy
            }))

            setSplitInputs(buildDefaultSplitInputs(memberIds, 'equal'))
        } catch (err) {
            setError(err.message || 'Failed to load group')
        } finally {
            setLoading(false)
        }
    }, [groupId, user])

    useEffect(() => {
        loadGroup()
    }, [loadGroup])

    function updateReceiptDraft(expenseId, patch) {
        setReceiptDrafts(prev => ({
            ...prev,
            [expenseId]: {
                ...(prev[expenseId] || {
                    input_mode: 'link',
                    file_url: '',
                    file_name: '',
                    file_content: '',
                    file_mime_type: '',
                    file_size_bytes: null,
                    ocr_requested: false,
                    ocr_text: ''
                }),
                ...patch
            }
        }))
    }

    function updateProofDraft(settlementId, patch) {
        setProofDrafts(prev => ({
            ...prev,
            [settlementId]: {
                ...(prev[settlementId] || {
                    file_url: '',
                    file_name: '',
                    note: ''
                }),
                ...patch
            }
        }))
    }

    function formatDateTime(value) {
        if (!value) return ''
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return String(value)
        return date.toLocaleString()
    }

    function buildExpenseRequestBody(allowDuplicate = false) {
        const participants = selectedMembers.map(memberId => {
            const base = { member_id: memberId }

            if (expenseForm.split_mode === 'exact') {
                base.amount = Number(splitInputs[memberId] || 0)
            }

            if (expenseForm.split_mode === 'percentage') {
                base.percentage = Number(splitInputs[memberId] || 0)
            }

            if (expenseForm.split_mode === 'shares') {
                base.share_units = Number(splitInputs[memberId] || 0)
            }

            return base
        })

        const receiptInputMode = expenseForm.receipt_input_mode === 'upload' ? 'upload' : 'link'
        const receiptFileUrl = String(expenseForm.receipt_file_url || '').trim()
        const receiptFileContent = String(expenseForm.receipt_file_content || '').trim()

        const body = {
            group_id: groupId,
            title: expenseForm.title,
            amount: Number(expenseForm.amount),
            paid_by_member_id: expenseForm.paid_by_member_id,
            split_mode: expenseForm.split_mode,
            note: expenseForm.note,
            incurred_on: expenseForm.incurred_on,
            participants
        }

        if (allowDuplicate) {
            body.allow_duplicate = true
        }

        if (receiptInputMode === 'upload' && receiptFileContent) {
            body.receipt = {
                file_content: receiptFileContent,
                file_name: String(expenseForm.receipt_file_name || '').trim() || null,
                file_mime_type: String(expenseForm.receipt_file_mime_type || '').trim() || null,
                ocr_requested: !!expenseForm.receipt_ocr_requested,
                ocr_text: String(expenseForm.receipt_ocr_text || '').trim() || null
            }
        } else if (receiptInputMode === 'link' && receiptFileUrl) {
            body.receipt = {
                file_url: receiptFileUrl,
                file_name: String(expenseForm.receipt_file_name || '').trim() || null,
                ocr_requested: !!expenseForm.receipt_ocr_requested,
                ocr_text: String(expenseForm.receipt_ocr_text || '').trim() || null
            }
        }

        return body
    }

    function onSplitModeChange(nextMode) {
        const memberIds = members.map(member => member.id)

        setExpenseForm(prev => ({
            ...prev,
            split_mode: nextMode
        }))

        setSplitInputs(buildDefaultSplitInputs(memberIds, nextMode))
    }

    function toggleMember(memberId) {
        setSelectedMembers(prev => {
            if (prev.includes(memberId)) {
                return prev.filter(id => id !== memberId)
            }
            return [...prev, memberId]
        })
    }

    function setExpenseReceiptMode(mode) {
        const nextMode = mode === 'upload' ? 'upload' : 'link'

        setExpenseForm(prev => ({
            ...prev,
            receipt_input_mode: nextMode,
            receipt_file_url: nextMode === 'link' ? prev.receipt_file_url : '',
            receipt_file_content: nextMode === 'upload' ? prev.receipt_file_content : '',
            receipt_file_mime_type: nextMode === 'upload' ? prev.receipt_file_mime_type : '',
            receipt_file_size_bytes: nextMode === 'upload' ? prev.receipt_file_size_bytes : null
        }))
    }

    async function onExpenseReceiptFileSelected(event) {
        const file = event.target.files?.[0]
        if (!file) {
            setExpenseForm(prev => ({
                ...prev,
                receipt_file_content: '',
                receipt_file_mime_type: '',
                receipt_file_size_bytes: null
            }))
            return
        }

        if (file.size > MAX_RECEIPT_UPLOAD_BYTES) {
            const maxMb = Math.max(1, Math.floor(MAX_RECEIPT_UPLOAD_BYTES / (1024 * 1024)))
            setError(`Receipt file is too large. Max allowed size is ${maxMb}MB`)
            event.target.value = ''
            return
        }

        try {
            const dataUrl = await readFileAsDataUrl(file)
            const base64 = extractBase64FromDataUrl(dataUrl)

            setExpenseForm(prev => ({
                ...prev,
                receipt_input_mode: 'upload',
                receipt_file_url: '',
                receipt_file_name: prev.receipt_file_name || file.name,
                receipt_file_content: base64,
                receipt_file_mime_type: file.type || '',
                receipt_file_size_bytes: file.size
            }))
        } catch {
            setError('Failed to read selected receipt file')
        }
    }

    function setReceiptDraftMode(expenseId, mode) {
        const nextMode = mode === 'upload' ? 'upload' : 'link'

        updateReceiptDraft(expenseId, {
            input_mode: nextMode,
            file_url: nextMode === 'link' ? (receiptDrafts[expenseId]?.file_url || '') : '',
            file_content: nextMode === 'upload' ? (receiptDrafts[expenseId]?.file_content || '') : '',
            file_mime_type: nextMode === 'upload' ? (receiptDrafts[expenseId]?.file_mime_type || '') : '',
            file_size_bytes: nextMode === 'upload' ? (receiptDrafts[expenseId]?.file_size_bytes || null) : null
        })
    }

    async function onDraftReceiptFileSelected(expenseId, event) {
        const file = event.target.files?.[0]
        if (!file) {
            updateReceiptDraft(expenseId, {
                file_content: '',
                file_mime_type: '',
                file_size_bytes: null
            })
            return
        }

        if (file.size > MAX_RECEIPT_UPLOAD_BYTES) {
            const maxMb = Math.max(1, Math.floor(MAX_RECEIPT_UPLOAD_BYTES / (1024 * 1024)))
            setError(`Receipt file is too large. Max allowed size is ${maxMb}MB`)
            event.target.value = ''
            return
        }

        try {
            const dataUrl = await readFileAsDataUrl(file)
            const base64 = extractBase64FromDataUrl(dataUrl)

            updateReceiptDraft(expenseId, {
                input_mode: 'upload',
                file_url: '',
                file_name: (receiptDrafts[expenseId]?.file_name || file.name),
                file_content: base64,
                file_mime_type: file.type || '',
                file_size_bytes: file.size
            })
        } catch {
            setError('Failed to read selected receipt file')
        }
    }

    async function saveProfile(event) {
        event.preventDefault()

        setProfileSaving(true)
        setError('')

        try {
            await splitApiRequest('/api/split/members', {
                method: 'PATCH',
                user,
                body: {
                    group_id: groupId,
                    ...profileForm
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to save profile')
        } finally {
            setProfileSaving(false)
        }
    }

    async function addExpense(event) {
        event.preventDefault()

        if (!expenseForm.title.trim() || !expenseForm.amount) {
            setError('Expense title and amount are required')
            return
        }

        if (!selectedMembers.length) {
            setError('Select at least one participant')
            return
        }

        setExpenseSaving(true)
        setError('')

        try {
            const submitExpense = async allowDuplicate => {
                await splitApiRequest('/api/split/expenses', {
                    method: 'POST',
                    user,
                    body: buildExpenseRequestBody(allowDuplicate)
                })
            }

            try {
                await submitExpense(false)
            } catch (err) {
                const possibleDuplicate = err?.status === 409 && err?.payload?.duplicate_expense
                if (!possibleDuplicate) {
                    throw err
                }

                const duplicate = err.payload.duplicate_expense
                const duplicateDetails = [
                    `Title: ${duplicate.title}`,
                    `Amount: ${formatPaise(duplicate.amount_paise, data?.group?.currency || 'INR')}`,
                    `Date: ${duplicate.incurred_on}`
                ].join('\n')

                const continueWithDuplicate = window.confirm(
                    `Possible duplicate expense found:\n\n${duplicateDetails}\n\nAdd this expense anyway?`
                )

                if (!continueWithDuplicate) {
                    setError('Expense creation cancelled to avoid duplicate entry')
                    return
                }

                await submitExpense(true)
            }

            setExpenseForm(prev => ({
                ...prev,
                title: '',
                amount: '',
                note: '',
                receipt_input_mode: 'link',
                receipt_file_url: '',
                receipt_file_name: '',
                receipt_file_content: '',
                receipt_file_mime_type: '',
                receipt_file_size_bytes: null,
                receipt_ocr_requested: false,
                receipt_ocr_text: ''
            }))

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to add expense')
        } finally {
            setExpenseSaving(false)
        }
    }

    async function deleteExpense(expenseId) {
        const confirmed = window.confirm('Delete this expense? This cannot be undone.')
        if (!confirmed) return

        setError('')

        try {
            await splitApiRequest('/api/split/expenses', {
                method: 'DELETE',
                user,
                body: {
                    group_id: groupId,
                    expense_id: expenseId
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to delete expense')
        }
    }

    async function attachReceipt(expenseId) {
        const draft = receiptDrafts[expenseId] || {}
        const inputMode = draft.input_mode === 'upload' ? 'upload' : 'link'
        const fileUrl = String(draft.file_url || '').trim()
        const fileContent = String(draft.file_content || '').trim()

        if (inputMode === 'upload' && !fileContent) {
            setError('Select a receipt file to upload')
            return
        }

        if (inputMode === 'link' && !fileUrl) {
            setError('Receipt file URL is required')
            return
        }

        setReceiptSaving(expenseId)
        setError('')

        try {
            await splitApiRequest('/api/split/receipts', {
                method: 'POST',
                user,
                body: {
                    group_id: groupId,
                    expense_id: expenseId,
                    file_url: inputMode === 'link' ? fileUrl : null,
                    file_name: String(draft.file_name || '').trim() || null,
                    file_content: inputMode === 'upload' ? fileContent : null,
                    file_mime_type: inputMode === 'upload' ? String(draft.file_mime_type || '').trim() || null : null,
                    ocr_requested: !!draft.ocr_requested,
                    ocr_text: String(draft.ocr_text || '').trim() || null
                }
            })

            setReceiptDrafts(prev => {
                const next = { ...prev }
                delete next[expenseId]
                return next
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to attach receipt')
        } finally {
            setReceiptSaving('')
        }
    }

    async function markSuggestedSettlementPaid(item) {
        setSettlementLoading(item.from_member_id + item.to_member_id)
        setError('')

        try {
            await splitApiRequest('/api/split/settlements', {
                method: 'POST',
                user,
                body: {
                    group_id: groupId,
                    from_member_id: item.from_member_id,
                    to_member_id: item.to_member_id,
                    amount_paise: item.amount_paise,
                    status: 'paid',
                    reference_note: 'Paid using UPI app'
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to mark settlement as paid')
        } finally {
            setSettlementLoading('')
        }
    }

    async function updateSettlementStatus(settlementId, status) {
        setSettlementLoading(settlementId)
        setError('')

        try {
            await splitApiRequest('/api/split/settlements', {
                method: 'PATCH',
                user,
                body: {
                    settlement_id: settlementId,
                    status
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to update settlement')
        } finally {
            setSettlementLoading('')
        }
    }

    async function submitPaymentProof(settlementId) {
        const draft = proofDrafts[settlementId] || {}
        const fileUrl = String(draft.file_url || '').trim()

        if (!fileUrl) {
            setError('Payment proof URL is required')
            return
        }

        setProofSaving(settlementId)
        setError('')

        try {
            await splitApiRequest('/api/split/payment-proofs', {
                method: 'POST',
                user,
                body: {
                    group_id: groupId,
                    settlement_id: settlementId,
                    file_url: fileUrl,
                    file_name: String(draft.file_name || '').trim() || null,
                    note: String(draft.note || '').trim() || null
                }
            })

            setProofDrafts(prev => {
                const next = { ...prev }
                delete next[settlementId]
                return next
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to submit payment proof')
        } finally {
            setProofSaving('')
        }
    }

    async function reviewPaymentProof(paymentProofId, proofStatus) {
        setProofReviewLoading(paymentProofId + proofStatus)
        setError('')

        try {
            await splitApiRequest('/api/split/payment-proofs', {
                method: 'PATCH',
                user,
                body: {
                    group_id: groupId,
                    payment_proof_id: paymentProofId,
                    proof_status: proofStatus
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to update payment proof')
        } finally {
            setProofReviewLoading('')
        }
    }

    async function sendReminder(settlement, customMessage = '') {
        if (!settlement?.id) return

        setReminderLoading(settlement.id)
        setError('')

        try {
            const fromMember = membersById[settlement.from_member_id]
            const toMember = membersById[settlement.to_member_id]
            const amountLabel = formatPaise(settlement.amount_paise, settlement.currency || data?.group?.currency || 'INR')

            const message = String(customMessage || '').trim() ||
                `Hi ${fromMember?.display_name || 'there'}, reminder to settle ${amountLabel} to ${toMember?.display_name || 'member'}.`

            await splitApiRequest('/api/split/reminders', {
                method: 'POST',
                user,
                body: {
                    group_id: groupId,
                    settlement_id: settlement.id,
                    to_member_id: settlement.from_member_id,
                    message,
                    channel: 'in_app'
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to send reminder')
        } finally {
            setReminderLoading('')
        }
    }

    async function updateReminderStatus(reminderId, status) {
        setReminderLoading(reminderId + status)
        setError('')

        try {
            await splitApiRequest('/api/split/reminders', {
                method: 'PATCH',
                user,
                body: {
                    group_id: groupId,
                    reminder_id: reminderId,
                    status
                }
            })

            await loadGroup()
        } catch (err) {
            setError(err.message || 'Failed to update reminder')
        } finally {
            setReminderLoading('')
        }
    }

    async function copyInviteCode() {
        const inviteCode = data?.group?.invite_code
        if (!inviteCode) return
        try {
            await navigator.clipboard.writeText(inviteCode)
            window.alert('Invite code copied')
        } catch {
            window.alert('Failed to copy invite code')
        }
    }

    async function exportGroupReport() {
        setExportLoading(true)
        setError('')

        try {
            await splitApiDownload(`/api/split/export?group_id=${encodeURIComponent(groupId)}`, {
                method: 'GET',
                user,
                fileNameFallback: `paysplit-${groupId}.csv`
            })
        } catch (err) {
            setError(err.message || 'Failed to export group report')
        } finally {
            setExportLoading(false)
        }
    }

    async function generateRecoveryCode() {
        setRecoveryCodeLoading(true)
        setError('')

        try {
            const response = await splitApiRequest('/api/split/recovery-code', {
                method: 'POST',
                user,
                body: {
                    group_id: groupId,
                    expires_in_days: 30
                }
            })

            setGeneratedRecoveryCode(response?.data?.code || '')
            setGeneratedRecoveryExpiry(response?.data?.expires_at || '')
        } catch (err) {
            setError(err.message || 'Failed to generate recovery code')
        } finally {
            setRecoveryCodeLoading(false)
        }
    }

    async function copyGeneratedRecoveryCode() {
        if (!generatedRecoveryCode) return

        try {
            await navigator.clipboard.writeText(generatedRecoveryCode)
            window.alert('Recovery code copied')
        } catch {
            window.alert('Failed to copy recovery code')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
                Loading group...
            </div>
        )
    }

    if (!data?.group) {
        return (
            <div className="min-h-screen max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-6 text-red-700 dark:text-red-300">
                    {error || 'Group not found'}
                </div>
                <Link to="/split-expense" className="inline-block mt-6 text-blue-600 dark:text-blue-400 hover:underline">
                    Back to PaySplit home
                </Link>
            </div>
        )
    }

    const currentMember = data.current_member

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-500">
            <section className="border-b border-gray-100 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                    <Link to="/split-expense" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        ← Back to all groups
                    </Link>

                    <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{data.group.name}</h1>
                            {data.group.description && (
                                <p className="mt-2 text-gray-500 dark:text-gray-400">{data.group.description}</p>
                            )}
                        </div>

                        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm">
                            <p className="text-gray-500 dark:text-gray-400">Invite code</p>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="font-black tracking-widest text-lg">{data.group.invite_code}</span>
                                <button
                                    onClick={copyInviteCode}
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Copy
                                </button>
                                <button
                                    onClick={exportGroupReport}
                                    disabled={exportLoading}
                                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline disabled:opacity-60"
                                >
                                    {exportLoading ? 'Exporting...' : 'Export CSV'}
                                </button>
                                {currentMember?.role === 'owner' && (
                                    <button
                                        onClick={generateRecoveryCode}
                                        disabled={recoveryCodeLoading}
                                        className="text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline disabled:opacity-60"
                                    >
                                        {recoveryCodeLoading ? 'Generating...' : 'Generate Recovery Code'}
                                    </button>
                                )}
                            </div>

                            {generatedRecoveryCode && (
                                <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-2.5">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Recovery code (save securely)</p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <span className="font-black tracking-wider text-sm text-amber-800 dark:text-amber-200">{generatedRecoveryCode}</span>
                                        <button
                                            onClick={copyGeneratedRecoveryCode}
                                            className="text-xs font-semibold text-amber-800 dark:text-amber-200 hover:underline"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    {generatedRecoveryExpiry && (
                                        <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                                            Expires on {new Date(generatedRecoveryExpiry).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>{members.length} members</span>
                        <span>•</span>
                        <span>{expenses.length} expenses</span>
                        <span>•</span>
                        <span>{data.group.currency}</span>
                        <span>•</span>
                        <span className="capitalize">Your role: {currentMember?.role || 'member'}</span>
                    </div>
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                        {error}
                    </div>
                )}

                <div className="grid xl:grid-cols-[1.55fr_1fr] gap-6">
                    <div className="space-y-6">
                        <form onSubmit={addExpense} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add expense</h2>

                            <div className="mt-4 grid md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Title</label>
                                    <input
                                        value={expenseForm.title}
                                        onChange={event => setExpenseForm(prev => ({ ...prev, title: event.target.value }))}
                                        placeholder="Dinner at beach shack"
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Amount ({data.group.currency})</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={expenseForm.amount}
                                        onChange={event => setExpenseForm(prev => ({ ...prev, amount: event.target.value }))}
                                        placeholder="2400"
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Paid by</label>
                                    <select
                                        value={expenseForm.paid_by_member_id}
                                        onChange={event => setExpenseForm(prev => ({ ...prev, paid_by_member_id: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    >
                                        {members.map(member => (
                                            <option key={member.id} value={member.id}>{member.display_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Date</label>
                                    <input
                                        type="date"
                                        value={expenseForm.incurred_on}
                                        onChange={event => setExpenseForm(prev => ({ ...prev, incurred_on: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                    />
                                </div>
                            </div>

                            <div className="mt-3">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Split mode</label>
                                <select
                                    value={expenseForm.split_mode}
                                    onChange={event => onSplitModeChange(event.target.value)}
                                    className="w-full md:w-64 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    {SPLIT_MODES.map(mode => (
                                        <option key={mode.value} value={mode.value}>{mode.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participants</p>
                                <div className="grid sm:grid-cols-2 gap-2">
                                    {members.map(member => {
                                        const selected = selectedMembers.includes(member.id)
                                        const requiresInput = expenseForm.split_mode !== 'equal'

                                        return (
                                            <div key={member.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-3">
                                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => toggleMember(member.id)}
                                                    />
                                                    {member.display_name}
                                                </label>

                                                {requiresInput && selected && (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={splitInputs[member.id] || ''}
                                                        onChange={event => setSplitInputs(prev => ({ ...prev, [member.id]: event.target.value }))}
                                                        placeholder={splitInputPlaceholder(expenseForm.split_mode)}
                                                        className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Note (optional)</label>
                                <input
                                    value={expenseForm.note}
                                    onChange={event => setExpenseForm(prev => ({ ...prev, note: event.target.value }))}
                                    placeholder="Food and drinks"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                />
                            </div>

                            <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-3">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Receipt (optional)</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Attach proof now and include OCR metadata if available.</p>

                                <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setExpenseReceiptMode('link')}
                                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${expenseForm.receipt_input_mode === 'link'
                                            ? 'border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10'
                                            : 'border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        Use link
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExpenseReceiptMode('upload')}
                                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${expenseForm.receipt_input_mode === 'upload'
                                            ? 'border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10'
                                            : 'border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-300'
                                            }`}
                                    >
                                        Upload file
                                    </button>
                                </div>

                                {expenseForm.receipt_input_mode === 'link' ? (
                                    <div className="mt-3">
                                        <input
                                            value={expenseForm.receipt_file_url}
                                            onChange={event => setExpenseForm(prev => ({ ...prev, receipt_file_url: event.target.value }))}
                                            placeholder="Receipt file URL"
                                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        />
                                    </div>
                                ) : (
                                    <div className="mt-3 space-y-2">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={onExpenseReceiptFileSelected}
                                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {expenseForm.receipt_file_size_bytes
                                                ? `Selected file size: ${formatBytes(expenseForm.receipt_file_size_bytes)}`
                                                : `Max upload size: ${Math.max(1, Math.floor(MAX_RECEIPT_UPLOAD_BYTES / (1024 * 1024)))}MB`}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-2">
                                    <input
                                        value={expenseForm.receipt_file_name}
                                        onChange={event => setExpenseForm(prev => ({ ...prev, receipt_file_name: event.target.value }))}
                                        placeholder="Receipt file name"
                                        className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                    />
                                </div>

                                <div className="mt-2">
                                    <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={expenseForm.receipt_ocr_requested}
                                            onChange={event => setExpenseForm(prev => ({ ...prev, receipt_ocr_requested: event.target.checked }))}
                                        />
                                        OCR requested for this receipt
                                    </label>
                                </div>

                                <textarea
                                    value={expenseForm.receipt_ocr_text}
                                    onChange={event => setExpenseForm(prev => ({ ...prev, receipt_ocr_text: event.target.value }))}
                                    placeholder="OCR extracted text (optional)"
                                    rows={2}
                                    className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={expenseSaving}
                                className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold px-5 py-2.5 shadow hover:opacity-95 disabled:opacity-60"
                            >
                                {expenseSaving ? 'Adding expense...' : 'Add expense'}
                            </button>
                        </form>

                        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Expenses</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Every entry shows payer, split mode, and per-member shares.</p>

                            {expenses.length === 0 ? (
                                <div className="mt-4 rounded-xl border border-dashed border-gray-300 dark:border-white/15 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                    No expenses yet.
                                </div>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {expenses.map(expense => {
                                        const payer = membersById[expense.paid_by_member_id]
                                        const expenseShares = sharesByExpenseId[expense.id] || []
                                        const creator = membersById[expense.created_by_member_id]
                                        const expenseReceipts = receiptsByExpenseId[expense.id] || []
                                        const receiptDraft = receiptDrafts[expense.id] || {
                                            input_mode: 'link',
                                            file_url: '',
                                            file_name: '',
                                            file_content: '',
                                            file_mime_type: '',
                                            file_size_bytes: null,
                                            ocr_requested: false,
                                            ocr_text: ''
                                        }

                                        return (
                                            <div key={expense.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">{expense.title}</h3>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Paid by <span className="font-medium">{payer?.display_name || 'Member'}</span> • {expense.split_mode}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                            {expense.incurred_on} • Added by {creator?.display_name || 'Member'}
                                                        </p>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                                                            {formatPaise(expense.amount_paise, expense.currency || data.group.currency)}
                                                        </p>
                                                        <button
                                                            onClick={() => deleteExpense(expense.id)}
                                                            className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>

                                                {expense.note && (
                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{expense.note}</p>
                                                )}

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {expenseShares.map(share => (
                                                        <span
                                                            key={share.id}
                                                            className="inline-flex items-center gap-1 rounded-full bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-white/10 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300"
                                                        >
                                                            {membersById[share.member_id]?.display_name || 'Member'}
                                                            <span className="font-semibold text-gray-800 dark:text-gray-100">
                                                                {formatPaise(share.share_paise, expense.currency || data.group.currency)}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="mt-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 p-3">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Receipts</p>

                                                    {expenseReceipts.length === 0 ? (
                                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No receipt attached yet.</p>
                                                    ) : (
                                                        <div className="mt-2 space-y-2">
                                                            {expenseReceipts.map(receipt => (
                                                                <div key={receipt.id} className="rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-2">
                                                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                        <a
                                                                            href={receipt.file_url}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                                        >
                                                                            {receipt.file_name || 'Open receipt'}
                                                                        </a>
                                                                        <span className="rounded-full border border-gray-300 dark:border-white/15 px-2 py-0.5 text-[11px] uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                                                            OCR: {receipt.ocr_status}
                                                                        </span>
                                                                    </div>
                                                                    {receipt.ocr_text && (
                                                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-3">{receipt.ocr_text}</p>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setReceiptDraftMode(expense.id, 'link')}
                                                            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${receiptDraft.input_mode === 'link'
                                                                ? 'border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10'
                                                                : 'border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-300'
                                                                }`}
                                                        >
                                                            Use link
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setReceiptDraftMode(expense.id, 'upload')}
                                                            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${receiptDraft.input_mode === 'upload'
                                                                ? 'border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-500/10'
                                                                : 'border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-300'
                                                                }`}
                                                        >
                                                            Upload file
                                                        </button>
                                                    </div>

                                                    {receiptDraft.input_mode === 'link' ? (
                                                        <div className="mt-2">
                                                            <input
                                                                value={receiptDraft.file_url}
                                                                onChange={event => updateReceiptDraft(expense.id, { file_url: event.target.value })}
                                                                placeholder="Receipt file URL"
                                                                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="mt-2 space-y-2">
                                                            <input
                                                                type="file"
                                                                accept="image/*,.pdf"
                                                                onChange={event => onDraftReceiptFileSelected(expense.id, event)}
                                                                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm"
                                                            />
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {receiptDraft.file_size_bytes
                                                                    ? `Selected file size: ${formatBytes(receiptDraft.file_size_bytes)}`
                                                                    : `Max upload size: ${Math.max(1, Math.floor(MAX_RECEIPT_UPLOAD_BYTES / (1024 * 1024)))}MB`}
                                                            </p>
                                                        </div>
                                                    )}

                                                    <div className="mt-2">
                                                        <input
                                                            value={receiptDraft.file_name}
                                                            onChange={event => updateReceiptDraft(expense.id, { file_name: event.target.value })}
                                                            placeholder="Receipt file name"
                                                            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                        />
                                                    </div>

                                                    <textarea
                                                        value={receiptDraft.ocr_text}
                                                        onChange={event => updateReceiptDraft(expense.id, { ocr_text: event.target.value })}
                                                        rows={2}
                                                        placeholder="OCR text (optional)"
                                                        className="mt-2 w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                    />

                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                                            <input
                                                                type="checkbox"
                                                                checked={!!receiptDraft.ocr_requested}
                                                                onChange={event => updateReceiptDraft(expense.id, { ocr_requested: event.target.checked })}
                                                            />
                                                            OCR requested
                                                        </label>

                                                        <button
                                                            onClick={() => attachReceipt(expense.id)}
                                                            disabled={receiptSaving === expense.id}
                                                            className="inline-flex items-center rounded-lg border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                        >
                                                            {receiptSaving === expense.id ? 'Attaching...' : 'Attach receipt'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <form onSubmit={saveProfile} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your payment profile</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set UPI details so others can pay you in one tap.</p>

                            <div className="mt-4 space-y-3">
                                <input
                                    value={profileForm.display_name}
                                    onChange={event => setProfileForm(prev => ({ ...prev, display_name: event.target.value }))}
                                    placeholder="Display name"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />

                                <input
                                    value={profileForm.upi_id}
                                    onChange={event => setProfileForm(prev => ({ ...prev, upi_id: event.target.value }))}
                                    placeholder="UPI ID (example@bank)"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />

                                <input
                                    value={profileForm.upi_mobile}
                                    onChange={event => setProfileForm(prev => ({ ...prev, upi_mobile: event.target.value }))}
                                    placeholder="UPI mobile number"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />

                                <input
                                    value={profileForm.upi_qr_url}
                                    onChange={event => setProfileForm(prev => ({ ...prev, upi_qr_url: event.target.value }))}
                                    placeholder="UPI QR image URL"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />

                                <input
                                    value={profileForm.payment_note}
                                    onChange={event => setProfileForm(prev => ({ ...prev, payment_note: event.target.value }))}
                                    placeholder="Default payment note"
                                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={profileSaving}
                                className="mt-4 inline-flex items-center justify-center rounded-xl bg-blue-600 text-white font-semibold px-4 py-2.5 hover:bg-blue-700 disabled:opacity-60"
                            >
                                {profileSaving ? 'Saving...' : 'Save profile'}
                            </button>
                        </form>

                        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Balances</h2>

                            <div className="mt-3 space-y-2">
                                {balances.map(balance => {
                                    const member = balance.member
                                    const amountClass = balance.balance_paise > 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : balance.balance_paise < 0
                                            ? 'text-red-600 dark:text-red-400'
                                            : 'text-gray-500 dark:text-gray-400'

                                    const prefix = balance.balance_paise > 0 ? '+' : ''

                                    return (
                                        <div key={balance.member_id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 px-3 py-2">
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{member?.display_name || 'Member'}</span>
                                            <span className={`text-sm font-bold ${amountClass}`}>
                                                {prefix}{formatPaise(balance.balance_paise, data.group.currency)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suggested settlements</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Optimized so the group needs fewer total transfers.</p>

                            {suggestedSettlements.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Everyone is settled up.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {suggestedSettlements.map(item => {
                                        const isCurrentPayer = currentMember?.id === item.from_member_id
                                        const isCurrentReceiver = currentMember?.id === item.to_member_id

                                        return (
                                            <div key={`${item.from_member_id}-${item.to_member_id}-${item.amount_paise}`} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-3">
                                                <p className="text-sm text-gray-700 dark:text-gray-200">
                                                    <span className="font-semibold">{item.from_member_name}</span>
                                                    {' '}pays{' '}
                                                    <span className="font-semibold">{item.to_member_name}</span>
                                                </p>
                                                <p className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                    {formatPaise(item.amount_paise, data.group.currency)}
                                                </p>

                                                {isCurrentPayer && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {item.upi_app_links?.upi && (
                                                            <a
                                                                href={item.upi_app_links.upi}
                                                                className="inline-flex items-center rounded-lg bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-emerald-700"
                                                            >
                                                                Pay via UPI
                                                            </a>
                                                        )}

                                                        {item.upi_app_links?.gpay && (
                                                            <a
                                                                href={item.upi_app_links.gpay}
                                                                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-white/15 text-xs font-semibold px-3 py-1.5"
                                                            >
                                                                Open GPay
                                                            </a>
                                                        )}

                                                        {item.upi_app_links?.phonepe && (
                                                            <a
                                                                href={item.upi_app_links.phonepe}
                                                                className="inline-flex items-center rounded-lg border border-gray-300 dark:border-white/15 text-xs font-semibold px-3 py-1.5"
                                                            >
                                                                Open PhonePe
                                                            </a>
                                                        )}

                                                        <button
                                                            onClick={() => markSuggestedSettlementPaid(item)}
                                                            disabled={settlementLoading === item.from_member_id + item.to_member_id}
                                                            className="inline-flex items-center rounded-lg border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 disabled:opacity-60"
                                                        >
                                                            Mark as Paid
                                                        </button>
                                                    </div>
                                                )}

                                                {isCurrentReceiver && (
                                                    <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">Waiting for payer to complete transfer</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="mt-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 p-3">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">UPI app references</p>
                                <div className="flex flex-wrap gap-2">
                                    {UPI_APP_REFERENCE_LINKS.map(app => (
                                        <a
                                            key={app.label}
                                            href={app.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center rounded-lg border border-gray-300 dark:border-white/15 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
                                        >
                                            {app.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settlement history</h2>
                            {settlements.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No settlements recorded yet.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {settlements.map(settlement => {
                                        const from = membersById[settlement.from_member_id]
                                        const to = membersById[settlement.to_member_id]
                                        const canConfirm = settlement.status === 'paid' && currentMember?.id === settlement.to_member_id
                                        const canMarkPaid = settlement.status === 'pending' && currentMember?.id === settlement.from_member_id
                                        const canUploadProof = currentMember?.role === 'owner' || currentMember?.id === settlement.from_member_id
                                        const canReviewProof = currentMember?.role === 'owner' || currentMember?.id === settlement.to_member_id
                                        const canSendReminder = currentMember?.role === 'owner' || currentMember?.id === settlement.to_member_id
                                        const settlementProofs = paymentProofsBySettlementId[settlement.id] || []
                                        const proofDraft = proofDrafts[settlement.id] || {
                                            file_url: '',
                                            file_name: '',
                                            note: ''
                                        }

                                        return (
                                            <div key={settlement.id} className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-200">
                                                            <span className="font-semibold">{from?.display_name}</span>
                                                            {' '}→{' '}
                                                            <span className="font-semibold">{to?.display_name}</span>
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            Status: <span className="font-semibold uppercase">{settlement.status}</span>
                                                        </p>
                                                        {settlement.confirmed_at && (
                                                            <p className="text-xs text-emerald-600 dark:text-emerald-300 mt-1">
                                                                Confirmed at {formatDateTime(settlement.confirmed_at)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                                        {formatPaise(settlement.amount_paise, settlement.currency || data.group.currency)}
                                                    </span>
                                                </div>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {canMarkPaid && (
                                                        <button
                                                            onClick={() => updateSettlementStatus(settlement.id, 'paid')}
                                                            disabled={settlementLoading === settlement.id}
                                                            className="inline-flex items-center rounded-lg border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                        >
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    {canConfirm && (
                                                        <button
                                                            onClick={() => updateSettlementStatus(settlement.id, 'confirmed')}
                                                            disabled={settlementLoading === settlement.id}
                                                            className="inline-flex items-center rounded-lg border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                        >
                                                            Confirm Received
                                                        </button>
                                                    )}
                                                    {canSendReminder && settlement.status !== 'confirmed' && (
                                                        <button
                                                            onClick={() => sendReminder(settlement)}
                                                            disabled={reminderLoading === settlement.id}
                                                            className="inline-flex items-center rounded-lg border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                        >
                                                            {reminderLoading === settlement.id ? 'Sending...' : 'Send Reminder'}
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="mt-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 p-2.5">
                                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Payment Proofs</p>

                                                    {settlementProofs.length === 0 ? (
                                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">No payment proof submitted yet.</p>
                                                    ) : (
                                                        <div className="mt-2 space-y-2">
                                                            {settlementProofs.map(proof => {
                                                                const uploader = membersById[proof.uploaded_by_member_id]
                                                                const canReviewThisProof = canReviewProof && proof.proof_status === 'submitted'

                                                                return (
                                                                    <div key={proof.id} className="rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-2">
                                                                        <div className="flex flex-wrap items-center gap-2 text-xs">
                                                                            <a
                                                                                href={proof.file_url}
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                                                            >
                                                                                {proof.file_name || 'Open proof'}
                                                                            </a>
                                                                            <span className="rounded-full border border-gray-300 dark:border-white/15 px-2 py-0.5 uppercase tracking-wider text-[11px] text-gray-600 dark:text-gray-300">
                                                                                {proof.proof_status}
                                                                            </span>
                                                                            <span className="text-gray-500 dark:text-gray-400">
                                                                                by {uploader?.display_name || 'Member'}
                                                                            </span>
                                                                        </div>
                                                                        {proof.note && (
                                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{proof.note}</p>
                                                                        )}

                                                                        {canReviewThisProof && (
                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                <button
                                                                                    onClick={() => reviewPaymentProof(proof.id, 'verified')}
                                                                                    disabled={proofReviewLoading === proof.id + 'verified'}
                                                                                    className="inline-flex items-center rounded-lg border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                                                >
                                                                                    Verify
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => reviewPaymentProof(proof.id, 'rejected')}
                                                                                    disabled={proofReviewLoading === proof.id + 'rejected'}
                                                                                    className="inline-flex items-center rounded-lg border border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                                                >
                                                                                    Reject
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}

                                                    {canUploadProof && settlement.status !== 'confirmed' && (
                                                        <div className="mt-3 grid gap-2">
                                                            <input
                                                                value={proofDraft.file_url}
                                                                onChange={event => updateProofDraft(settlement.id, { file_url: event.target.value })}
                                                                placeholder="Payment proof file URL"
                                                                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                            />
                                                            <div className="grid md:grid-cols-2 gap-2">
                                                                <input
                                                                    value={proofDraft.file_name}
                                                                    onChange={event => updateProofDraft(settlement.id, { file_name: event.target.value })}
                                                                    placeholder="Proof file name"
                                                                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                                />
                                                                <input
                                                                    value={proofDraft.note}
                                                                    onChange={event => updateProofDraft(settlement.id, { note: event.target.value })}
                                                                    placeholder="Proof note"
                                                                    className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-900/40 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => submitPaymentProof(settlement.id)}
                                                                disabled={proofSaving === settlement.id}
                                                                className="inline-flex items-center justify-center rounded-lg border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 disabled:opacity-60"
                                                            >
                                                                {proofSaving === settlement.id ? 'Submitting...' : 'Submit Payment Proof'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-5 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reminders</h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track nudges sent to members for pending payments.</p>

                            {reminders.length === 0 ? (
                                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No reminders sent yet.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {reminders.map(reminder => {
                                        const from = membersById[reminder.from_member_id]
                                        const to = membersById[reminder.to_member_id]
                                        const canAcknowledge = currentMember?.id === reminder.to_member_id
                                        const canDismiss = canAcknowledge || currentMember?.role === 'owner' || currentMember?.id === reminder.from_member_id

                                        return (
                                            <div key={reminder.id} className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-900/40 p-3">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-sm text-gray-700 dark:text-gray-200">
                                                        <span className="font-semibold">{from?.display_name || 'Member'}</span>
                                                        {' '}→{' '}
                                                        <span className="font-semibold">{to?.display_name || 'Member'}</span>
                                                    </p>
                                                    <span className="text-[11px] uppercase tracking-wider rounded-full border border-gray-300 dark:border-white/15 px-2 py-0.5 text-gray-600 dark:text-gray-300">
                                                        {reminder.status}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{reminder.message}</p>
                                                <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                                                    {reminder.channel.toUpperCase()} • {formatDateTime(reminder.created_at)}
                                                </p>

                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {canAcknowledge && reminder.status !== 'acknowledged' && (
                                                        <button
                                                            onClick={() => updateReminderStatus(reminder.id, 'acknowledged')}
                                                            disabled={reminderLoading === reminder.id + 'acknowledged'}
                                                            className="inline-flex items-center rounded-lg border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                        >
                                                            Acknowledge
                                                        </button>
                                                    )}

                                                    {canDismiss && reminder.status !== 'dismissed' && (
                                                        <button
                                                            onClick={() => updateReminderStatus(reminder.id, 'dismissed')}
                                                            disabled={reminderLoading === reminder.id + 'dismissed'}
                                                            className="inline-flex items-center rounded-lg border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 text-xs font-semibold px-2.5 py-1.5 disabled:opacity-60"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
