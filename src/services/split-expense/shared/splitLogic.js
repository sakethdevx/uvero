const INTEGER_FLOOR = 0

function toFiniteNumber(value, fallback = 0) {
    const num = typeof value === 'string' ? Number(value.trim()) : Number(value)
    return Number.isFinite(num) ? num : fallback
}

export function toPaise(value) {
    const num = toFiniteNumber(value, NaN)
    if (!Number.isFinite(num)) {
        throw new Error('Invalid amount')
    }
    return Math.round(num * 100)
}

export function paiseToAmount(paise) {
    return (toFiniteNumber(paise, 0) / 100).toFixed(2)
}

export function formatPaise(paise, currency = 'INR', locale = 'en-IN') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
    }).format(toFiniteNumber(paise, 0) / 100)
}

function getParticipantId(participant) {
    const memberId = participant?.member_id || participant?.memberId
    if (!memberId) throw new Error('Each split participant needs member_id')
    return memberId
}

function amountPaiseFromSplit(participant) {
    if (participant?.amount_paise !== undefined && participant?.amount_paise !== null) {
        return Math.round(toFiniteNumber(participant.amount_paise, 0))
    }

    if (participant?.amount !== undefined && participant?.amount !== null) {
        return toPaise(participant.amount)
    }

    return 0
}

function sortForRemainder(a, b) {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder
    return String(a.member_id).localeCompare(String(b.member_id))
}

function allocateByWeights(totalPaise, weightedMembers) {
    if (!Array.isArray(weightedMembers) || weightedMembers.length === 0) {
        throw new Error('At least one participant is required')
    }

    const usable = weightedMembers
        .map(item => ({
            member_id: item.member_id,
            weight: toFiniteNumber(item.weight, 0)
        }))
        .filter(item => item.weight > 0)

    if (!usable.length) {
        throw new Error('At least one participant must have positive weight')
    }

    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0)
    const allocated = usable.map(item => {
        const raw = (totalPaise * item.weight) / totalWeight
        const base = Math.floor(raw)
        return {
            member_id: item.member_id,
            amount_paise: base,
            remainder: raw - base
        }
    })

    const baseTotal = allocated.reduce((sum, row) => sum + row.amount_paise, 0)
    let remainderPaise = totalPaise - baseTotal

    if (remainderPaise > 0) {
        allocated.sort(sortForRemainder)
        for (let index = 0; index < allocated.length && remainderPaise > 0; index += 1) {
            allocated[index].amount_paise += 1
            remainderPaise -= 1
            if (index === allocated.length - 1 && remainderPaise > 0) {
                index = -1
            }
        }
    }

    return allocated.map(({ member_id, amount_paise }) => ({ member_id, amount_paise }))
}

function normalizeExactShares(totalPaise, participants) {
    const rows = participants.map(participant => ({
        member_id: getParticipantId(participant),
        amount_paise: amountPaiseFromSplit(participant)
    }))

    if (!rows.length) throw new Error('No split rows provided')

    const sum = rows.reduce((acc, row) => acc + row.amount_paise, 0)
    const diff = totalPaise - sum

    if (diff === 0) return rows

    const sorted = [...rows].sort((a, b) => b.amount_paise - a.amount_paise)

    if (!sorted.length) throw new Error('No split rows provided')

    sorted[0].amount_paise += diff

    if (sorted[0].amount_paise < INTEGER_FLOOR) {
        throw new Error('Exact split amounts do not match total')
    }

    return sorted
}

export function computeShares({ splitMode, amountPaise, participants }) {
    const totalPaise = Math.round(toFiniteNumber(amountPaise, NaN))
    if (!Number.isFinite(totalPaise) || totalPaise <= 0) {
        throw new Error('Amount must be greater than 0')
    }

    if (!Array.isArray(participants) || participants.length === 0) {
        throw new Error('Participants are required')
    }

    if (splitMode === 'equal') {
        return allocateByWeights(
            totalPaise,
            participants.map(participant => ({ member_id: getParticipantId(participant), weight: 1 }))
        )
    }

    if (splitMode === 'exact') {
        return normalizeExactShares(totalPaise, participants)
    }

    if (splitMode === 'percentage') {
        return allocateByWeights(
            totalPaise,
            participants.map(participant => ({
                member_id: getParticipantId(participant),
                weight: toFiniteNumber(participant.percentage, 0)
            }))
        )
    }

    if (splitMode === 'shares') {
        return allocateByWeights(
            totalPaise,
            participants.map(participant => ({
                member_id: getParticipantId(participant),
                weight: toFiniteNumber(participant.share_units, 0)
            }))
        )
    }

    throw new Error('Unsupported split mode')
}

export function simplifySettlements(balances, dustPaise = 1) {
    const creditors = balances
        .filter(row => row.balance_paise > dustPaise)
        .map(row => ({ member_id: row.member_id, amount_paise: row.balance_paise }))
        .sort((a, b) => b.amount_paise - a.amount_paise)

    const debtors = balances
        .filter(row => row.balance_paise < -dustPaise)
        .map(row => ({ member_id: row.member_id, amount_paise: Math.abs(row.balance_paise) }))
        .sort((a, b) => b.amount_paise - a.amount_paise)

    const result = []
    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
        const creditor = creditors[creditorIndex]
        const debtor = debtors[debtorIndex]

        const amountPaise = Math.min(creditor.amount_paise, debtor.amount_paise)

        if (amountPaise > dustPaise) {
            result.push({
                from_member_id: debtor.member_id,
                to_member_id: creditor.member_id,
                amount_paise: amountPaise
            })
        }

        creditor.amount_paise -= amountPaise
        debtor.amount_paise -= amountPaise

        if (creditor.amount_paise <= dustPaise) creditorIndex += 1
        if (debtor.amount_paise <= dustPaise) debtorIndex += 1
    }

    return result
}

export function computeLedger({ members = [], expenses = [], shares = [], settlements = [] }) {
    const byMember = new Map()

    members.forEach(member => {
        byMember.set(member.id, {
            member_id: member.id,
            paid_paise: 0,
            owed_paise: 0,
            balance_paise: 0
        })
    })

    expenses.forEach(expense => {
        if (!byMember.has(expense.paid_by_member_id)) return
        const row = byMember.get(expense.paid_by_member_id)
        row.paid_paise += Math.round(toFiniteNumber(expense.amount_paise, 0))
    })

    shares.forEach(share => {
        if (!byMember.has(share.member_id)) return
        const row = byMember.get(share.member_id)
        row.owed_paise += Math.round(toFiniteNumber(share.share_paise, 0))
    })

    byMember.forEach(row => {
        row.balance_paise = row.paid_paise - row.owed_paise
    })

    settlements.forEach(settlement => {
        if (settlement.status !== 'confirmed') return
        const amount = Math.round(toFiniteNumber(settlement.amount_paise, 0))
        const from = byMember.get(settlement.from_member_id)
        const to = byMember.get(settlement.to_member_id)

        if (from) from.balance_paise += amount
        if (to) to.balance_paise -= amount
    })

    const balances = Array.from(byMember.values())
    const suggested_settlements = simplifySettlements(balances, 1)

    return {
        balances,
        suggested_settlements,
        totals: {
            total_paid_paise: balances.reduce((sum, row) => sum + row.paid_paise, 0),
            total_owed_paise: balances.reduce((sum, row) => sum + row.owed_paise, 0)
        }
    }
}

export function buildUpiDeepLink({ upiAddress, payeeName, amountPaise, note, currency = 'INR' }) {
    if (!upiAddress) return null

    const params = new URLSearchParams({
        pa: upiAddress,
        pn: (payeeName || 'Trip Split').slice(0, 80),
        am: paiseToAmount(amountPaise),
        cu: currency,
        tn: (note || 'Trip expense settlement').slice(0, 80)
    })

    return `upi://pay?${params.toString()}`
}

export function buildUpiAppLinks(upiDeepLink) {
    if (!upiDeepLink?.startsWith('upi://pay?')) {
        return {
            upi: null,
            gpay: null,
            phonepe: null,
            paytm: null,
            bhim: null
        }
    }

    const query = upiDeepLink.replace('upi://pay?', '')

    return {
        upi: upiDeepLink,
        gpay: `tez://upi/pay?${query}`,
        phonepe: `phonepe://pay?${query}`,
        paytm: `paytmmp://pay?${query}`,
        bhim: `upi://pay?${query}`
    }
}
