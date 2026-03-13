import { createClient } from '@supabase/supabase-js'
import { deleteBoard } from './clipboardGithubStorage.js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MAX_PUBLIC_CODES = 10000

/**
 * Generate a random 4-digit code not already in use.
 * If all codes are used, recycle the oldest one (LRU).
 */
export async function assignPublicCode() {
    const { count: rawCount } = await supabase
        .from('clipboard_boards')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'public')

    const count = rawCount || 0

    if (count >= MAX_PUBLIC_CODES) {
        // LRU: find the oldest public board and recycle it
        const { data: oldest } = await supabase
            .from('clipboard_boards')
            .select('id')
            .eq('type', 'public')
            .order('updated_at', { ascending: true })
            .limit(1)

        if (oldest && oldest.length > 0) {
            const recycledCode = oldest[0].id
            try { await deleteBoard(recycledCode, 'public') } catch (e) { console.warn('[publicCodeService] Failed to delete recycled board from GitHub', e) }
            await supabase.from('clipboard_boards').delete().eq('id', recycledCode)
            return recycledCode
        }
    }

    // Generate a random 4-digit code not in use
    const { data: existingCodes } = await supabase
        .from('clipboard_boards')
        .select('id')
        .eq('type', 'public')

    const usedSet = new Set((existingCodes || []).map(r => r.id))

    // Try random codes until we find an unused one
    let attempts = 0
    while (attempts < 100) {
        const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
        if (!usedSet.has(code)) return code
        attempts++
    }

    // Fallback: linear scan for any free code
    for (let i = 0; i < MAX_PUBLIC_CODES; i++) {
        const code = String(i).padStart(4, '0')
        if (!usedSet.has(code)) return code
    }

    throw new Error('No available codes')
}
