import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(ROOT_DIR, '..')

const TOOL_INDEX_PATH = path.join(PROJECT_ROOT, 'src', 'features', 'file-tools', 'tools', 'index.js')
const APP_PATH = path.join(PROJECT_ROOT, 'src', 'App.jsx')

const SMOKE_TOOL_IDS = [
    'convert-video',
    'document-converter',
    'epub-to-mobi',
    'rar-to-zip',
]

function parseRegistryIds(source) {
    const match = source.match(/export const tools = \{([\s\S]*?)\n\};/)
    if (!match) {
        throw new Error('Could not find tool registry block.')
    }

    return new Set([...match[1].matchAll(/id:\s*'([^']+)'/g)].map(([, toolId]) => toolId))
}

function parseNavIds(source) {
    const match = source.match(/const toolCategories = \[([\s\S]*?)\n  \];/)
    if (!match) {
        throw new Error('Could not find tool category block in App.jsx.')
    }

    return new Set([...match[1].matchAll(/path:\s*'\/([^']+)'/g)].map(([, toolId]) => toolId))
}

async function main() {
    const [toolIndexSource, appSource] = await Promise.all([
        readFile(TOOL_INDEX_PATH, 'utf8'),
        readFile(APP_PATH, 'utf8'),
    ])

    const registryIds = parseRegistryIds(toolIndexSource)
    const navIds = parseNavIds(appSource)
    const failures = []

    for (const toolId of SMOKE_TOOL_IDS) {
        if (!registryIds.has(toolId)) {
            failures.push(`Tool "${toolId}" is missing from the registry.`)
        }

        if (!navIds.has(toolId)) {
            failures.push(`Tool "${toolId}" is missing from the file-tools navigation.`)
        }
    }

    if (failures.length > 0) {
        console.error('File-tools route smoke test failed:\n')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exitCode = 1
        return
    }

    console.log(`File-tools route smoke test passed for ${SMOKE_TOOL_IDS.length} representative tool routes.`)
}

main().catch((error) => {
    console.error('Failed to run file-tools route smoke test:', error)
    process.exitCode = 1
})
