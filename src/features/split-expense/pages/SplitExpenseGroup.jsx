import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../../auth/AuthContext'
import { splitApiRequest } from '../api/client'
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
        incurred_on: new Date().toISOString().slice(0, 10)
    })

    const [selectedMembers, setSelectedMembers] = useState([])
    const [splitInputs, setSplitInputs] = useState({})

    const members = useMemo(() => data?.members || [], [data?.members])
    const expenses = useMemo(() => data?.expenses || [], [data?.expenses])
    const shares = useMemo(() => data?.shares || [], [data?.shares])
    const settlements = useMemo(() => data?.settlements || [], [data?.settlements])

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

            await splitApiRequest('/api/split/expenses', {
                method: 'POST',
                user,
                body: {
                    group_id: groupId,
                    title: expenseForm.title,
                    amount: Number(expenseForm.amount),
                    paid_by_member_id: expenseForm.paid_by_member_id,
                    split_mode: expenseForm.split_mode,
                    note: expenseForm.note,
                    incurred_on: expenseForm.incurred_on,
                    participants
                }
            })

            setExpenseForm(prev => ({
                ...prev,
                title: '',
                amount: '',
                note: ''
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
                    Back to TripSplit home
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
                            </div>
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
