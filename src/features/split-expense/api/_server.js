import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const runtimeProcess = globalThis?.process
const SUPABASE_URL = runtimeProcess?.env?.VITE_SUPABASE_URL || runtimeProcess?.env?.SUPABASE_URL
const SUPABASE_SERVICE_KEY = runtimeProcess?.env?.SUPABASE_SERVICE_KEY

const serverSupabase = SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null

export function createHttpError(status, message) {
    const err = new Error(message)
    err.status = status
    return err
}

export function getServerSupabase() {
    if (!serverSupabase) {
        throw createHttpError(500, 'Missing server supabase key')
    }
    return serverSupabase
}

function getHeader(req, key) {
    if (!req?.headers) return ''

    const expected = key.toLowerCase()
    for (const headerKey of Object.keys(req.headers)) {
        if (headerKey.toLowerCase() === expected) {
            return String(req.headers[headerKey] || '')
        }
    }

    return ''
}

export async function resolveActor(req, supabase) {
    const authHeader = getHeader(req, 'authorization')
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '').trim()
        : ''

    if (token) {
        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data?.user) {
            throw createHttpError(401, 'Invalid access token')
        }

        return {
            type: 'user',
            user: data.user,
            access_token: token
        }
    }

    const guestSession = getHeader(req, 'x-guest-session').trim()
    if (guestSession) {
        if (!/^[a-zA-Z0-9_-]{8,128}$/.test(guestSession)) {
            throw createHttpError(400, 'Invalid guest session')
        }

        return {
            type: 'guest',
            guest_session: guestSession
        }
    }

    throw createHttpError(401, 'Sign in or provide guest session to continue')
}

export function withActorFilter(query, actor) {
    if (actor.type === 'user') {
        return query.eq('user_id', actor.user.id)
    }

    return query.eq('guest_session', actor.guest_session)
}

export async function findActorMembership({ supabase, groupId, actor }) {
    const query = withActorFilter(
        supabase
            .from('split_group_members')
            .select('*')
            .eq('group_id', groupId),
        actor
    )

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    return data
}

export async function requireActorMembership({ supabase, groupId, actor }) {
    const member = await findActorMembership({ supabase, groupId, actor })
    if (!member) {
        throw createHttpError(403, 'You are not a member of this group')
    }
    return member
}

export function defaultDisplayName(actor, preferred) {
    const input = String(preferred || '').trim()
    if (input) return input.slice(0, 80)

    if (actor.type === 'user') {
        const fromMetadata = String(actor.user?.user_metadata?.full_name || '').trim()
        if (fromMetadata) return fromMetadata.slice(0, 80)

        const email = String(actor.user?.email || '').trim()
        if (email.includes('@')) return email.split('@')[0].slice(0, 80)
        if (email) return email.slice(0, 80)

        return 'Member'
    }

    return `Guest-${actor.guest_session.slice(-4)}`
}

export function makeInviteCode() {
    return `TS${crypto.randomBytes(3).toString('hex').toUpperCase()}`
}

export function sendApiError(res, error, label = '[split-expense]') {
    const status = Number(error?.status) || 500
    const message = error?.message || 'Unexpected server error'
    console.error(label, error)
    return res.status(status).json({ error: message })
}
