export const CLIPBOARD_BOARD_TYPES = {
    PUBLIC: 'public',
    PRIVATE: 'private'
}

export function isValidClipboardBoardType(type) {
    return type === CLIPBOARD_BOARD_TYPES.PUBLIC || type === CLIPBOARD_BOARD_TYPES.PRIVATE
}

export function normalizeClipboardBoardType(type, fallback = CLIPBOARD_BOARD_TYPES.PUBLIC) {
    return isValidClipboardBoardType(type) ? type : fallback
}

export function normalizeClipboardBoardId(boardId) {
    return typeof boardId === 'string' ? boardId.trim().toLowerCase() : ''
}

export function sanitizePrivateClipboardBoardId(boardId) {
    return normalizeClipboardBoardId(boardId)
        .replace(/[^a-z0-9\-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 100)
}

export function applyClipboardBoardFilters(query, { boardId, type }) {
    return query.eq('type', type).eq('id', boardId)
}

export async function findClipboardBoard(supabase, { boardId, type, columns = '*' }) {
    const { data, error } = await applyClipboardBoardFilters(
        supabase.from('clipboard_boards').select(columns),
        { boardId, type }
    ).maybeSingle()

    if (error) throw error
    return data
}

export async function deleteClipboardBoardMeta(supabase, { boardId, type }) {
    const { error } = await applyClipboardBoardFilters(
        supabase.from('clipboard_boards').delete(),
        { boardId, type }
    )

    if (error) throw error
}
