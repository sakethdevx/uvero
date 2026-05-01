import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DOCUMENT_CONVERTER_ENTRIES } from '../src/services/toolbox/core/toolMetadata.js'

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(ROOT_DIR, '..')

const TOOL_INDEX_PATH = path.join(PROJECT_ROOT, 'src', 'services', 'toolbox', 'tools', 'index.js')
const APP_PATH = path.join(PROJECT_ROOT, 'src', 'App.jsx')

// Updated to match the new simplified toolbox
const SMOKE_TOOL_IDS = [
    'qr-generator',
    'password-generator',
    'hash-generator',
    'unit-converter',
    'timezone-converter',
    'lbs-to-kg',
    'kg-to-lbs',
    'feet-to-meters',
    'pst-to-est',
    'cst-to-est',
]

function parseRegistryEntries(source) {
    const match = source.match(/export const tools = \{([\s\S]*?)\n\};/)
    if (!match) {
        throw new Error('Could not find tool registry block.')
    }

    return [...match[1].matchAll(/'([^']+)':\s*\{([\s\S]*?)\n\s*\},?/g)].map(([, key, block]) => ({
        key,
        id: block.match(/id:\s*'([^']+)'/)?.[1] || key,
    }))
}

function hasRegistryAccessor(source) {
    return /export const getToolById = \(id\) => \{[\s\S]*?const tool = tools\[id\];[\s\S]*?enhanceTool\(tool\)[\s\S]*?\}/.test(source)
}

function parseNavIds(source) {
    const match = source.match(/const (?:toolCategories|TOOL_CATEGORIES) = \[([\s\S]*?)\n\s*\];/)
    if (!match) {
        throw new Error('Could not find tool category block in App.jsx.')
    }

    return new Set([...match[1].matchAll(/path:\s*'\/([^']+)'/g)].map(([, toolId]) => toolId))
}

function hasCanonicalToolboxRoute(source) {
    return /<Route path="\/toolbox" element={<[A-Z][A-Za-z0-9]* \/>} \/>/.test(source)
}

function hasLegacyToolsRoute(source) {
    return /<Route path="\/tools"/.test(source)
}

async function main() {
    const [toolIndexSource, appSource] = await Promise.all([
        readFile(TOOL_INDEX_PATH, 'utf8'),
        readFile(APP_PATH, 'utf8'),
    ])

    const registryEntries = parseRegistryEntries(toolIndexSource)
    const registryIds = new Set(registryEntries.map((entry) => entry.id))
    const navIds = parseNavIds(appSource)
    const failures = []

    if (!hasRegistryAccessor(toolIndexSource)) {
        failures.push('getToolById accessor no longer matches the registry-backed resolver contract.')
    }

    if (!hasCanonicalToolboxRoute(appSource)) {
        failures.push('App router is missing the canonical /toolbox route.')
    }

    if (hasLegacyToolsRoute(appSource)) {
        failures.push('App router still contains the legacy /tools route.')
    }

    for (const toolId of SMOKE_TOOL_IDS) {
        if (!registryIds.has(toolId)) {
            failures.push(`Tool "${toolId}" is missing from the registry.`)
        }

        if (!navIds.has(toolId)) {
            failures.push(`Tool "${toolId}" is missing from the toolbox navigation.`)
        }
    }

    for (const entry of DOCUMENT_CONVERTER_ENTRIES) {
        if (!registryIds.has(entry.id)) {
            failures.push(`Document hub tool "${entry.id}" is missing from the registry.`)
        }

        if (!entry.format) {
            failures.push(`Document hub tool "${entry.id}" is missing its format label.`)
        }
    }

    if (failures.length > 0) {
        console.error('Toolbox route smoke test failed:\n')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exitCode = 1
        return
    }

    console.log(`Toolbox route smoke test passed for ${SMOKE_TOOL_IDS.length} representative tool routes.`)
}

main().catch((error) => {
    console.error('Failed to run toolbox route smoke test:', error)
    process.exitCode = 1
})
