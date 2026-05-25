export const CLI_INSTALL_COMMAND = 'pip install uvero'

export function getQuickShareCliCommands(code) {
    return [
        {
            id: 'send',
            label: 'Send new text',
            command: 'uvero send',
            description: 'Create a clipboard entry directly from your terminal.',
        },
        {
            id: 'get',
            label: 'Fetch this clipboard',
            command: `uvero get ${code}`,
            description: 'Pull the current quick-share content by code.',
        },
        {
            id: 'open',
            label: 'Open in your browser',
            command: `uvero open ${code}`,
            description: 'Jump straight to this share link from the CLI.',
        },
    ]
}

export function getBoardCliCommands(boardId) {
    return [
        {
            id: 'board-send',
            label: 'Send to this board',
            command: `uvero board send ${boardId}`,
            description: 'Push terminal text directly into this named board.',
        },
        {
            id: 'board-get',
            label: 'Read this board',
            command: `uvero board get ${boardId}`,
            description: 'Fetch the current content of this board from your shell.',
        },
    ]
}

export const CLIPBOARD_PROMO_COMMANDS = [
    {
        id: 'promo-send',
        label: 'Quick-share from terminal',
        command: 'uvero send',
        description: 'Create a shareable clipboard entry without opening the browser first.',
    },
    {
        id: 'promo-get',
        label: 'Read a 4-digit code',
        command: 'uvero get 4832',
        description: 'Fetch clipboard text when someone sends you a code.',
    },
    {
        id: 'promo-board',
        label: 'Create a Live Clipboard (Private)',
        command: 'uvero board create',
        description: 'Start a named board workflow directly from your shell.',
    },
]

export const CLI_PAGE_COMMANDS = [
    {
        id: 'send',
        label: 'Send text instantly',
        command: 'uvero send',
        description: 'Create a quick-share clipboard entry from your terminal session.',
    },
    {
        id: 'send-file',
        label: 'Send file contents',
        command: 'uvero send clipboard',
        description: 'Push local text into Uvero when you want to share it quickly.',
    },
    {
        id: 'get',
        label: 'Read a quick-share code',
        command: 'uvero get 4832',
        description: 'Fetch clipboard text tied to a 4-digit code.',
    },
    {
        id: 'open',
        label: 'Open a quick-share code',
        command: 'uvero open 4832',
        description: 'Open the matching share page in your browser.',
    },
    {
        id: 'board-create',
        label: 'Create a Live Clipboard (Private)',
        command: 'uvero board create',
        description: 'Start a named board workflow from the terminal.',
    },
    {
        id: 'board-send',
        label: 'Send to a Live Clipboard (Private)',
        command: 'uvero board send abcd-def',
        description: 'Push terminal content into an existing Live Clipboard (Private).',
    },
]
