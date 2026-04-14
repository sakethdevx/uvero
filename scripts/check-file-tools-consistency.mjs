import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(ROOT_DIR, '..')

const TOOL_INDEX_PATH = path.join(PROJECT_ROOT, 'src', 'features', 'file-tools', 'tools', 'index.js')
const EXECUTORS_PATH = path.join(PROJECT_ROOT, 'src', 'features', 'file-tools', 'core', 'toolExecutors.js')
const APP_PATH = path.join(PROJECT_ROOT, 'src', 'App.jsx')
const EXECUTOR_EXEMPT_TOOL_IDS = new Set(['document-converter'])

function parseToolEntries(source) {
    const match = source.match(/export const tools = \{([\s\S]*?)\n\};/)
    if (!match) {
        throw new Error('Could not find tool registry block.')
    }

    const body = match[1]
    const entryRegex = /'([^']+)':\s*\{([\s\S]*?)\n\s*\},?/g
    const tools = []

    for (const entry of body.matchAll(entryRegex)) {
        const key = entry[1]
        const block = entry[2]
        const idMatch = block.match(/id:\s*'([^']+)'/)
        const categoryMatch = block.match(/category:\s*'([^']+)'/)

        tools.push({
            key,
            id: idMatch?.[1] || key,
            category: categoryMatch?.[1] || null,
            hasSeo: /seo:\s*[A-Za-z0-9_]+/.test(block),
        })
    }

    return tools
}

function parseExecutorIds(source) {
    const blockMatch = source.match(/const toolExecutors = \{([\s\S]*?)\n\};/)
    if (!blockMatch) {
        throw new Error('Could not find executor registry block.')
    }

    return [...blockMatch[1].matchAll(/'([^']+)':/g)].map(([, toolId]) => toolId)
}

function parseNavToolIds(source) {
    const match = source.match(/const toolCategories = \[([\s\S]*?)\n  \];/)
    const toolCategoriesBlock = match?.[1] || ''

    return [...toolCategoriesBlock.matchAll(/path:\s*'\/([^']+)'/g)]
        .map(([, toolId]) => toolId)
}

function parseExecutorOptionalIds(source) {
    const match = source.match(/executorOptionalToolIds = new Set\(\[([^\]]*)\]\)/)
    if (!match) return []

    return [...match[1].matchAll(/'([^']+)'/g)].map(([, toolId]) => toolId)
}

function isFileProcessingCategory(category) {
    return ['image', 'pdf', 'audio', 'video', 'document', 'archive'].includes(category)
}

async function main() {
    const [toolIndexSource, executorsSource, appSource] = await Promise.all([
        readFile(TOOL_INDEX_PATH, 'utf8'),
        readFile(EXECUTORS_PATH, 'utf8'),
        readFile(APP_PATH, 'utf8'),
    ])

    const tools = parseToolEntries(toolIndexSource)
    const executorIds = new Set(parseExecutorIds(executorsSource))
    const navToolIds = new Set(parseNavToolIds(appSource))
    const executorOptionalIds = new Set(parseExecutorOptionalIds(toolIndexSource))

    const registryKeyMismatches = tools
        .filter((tool) => tool.key !== tool.id)
        .map((tool) => `${tool.key} -> ${tool.id}`)

    const navMissingRegistry = [...navToolIds]
        .filter((toolId) => !tools.some((tool) => tool.id === toolId))

    const executorWithoutRegistry = [...executorIds]
        .filter((toolId) => !tools.some((tool) => tool.id === toolId))

    const processingToolsWithoutExecutor = tools
        .filter((tool) => isFileProcessingCategory(tool.category))
        .filter((tool) => !executorIds.has(tool.id))
        .filter((tool) => !executorOptionalIds.has(tool.id))
        .map((tool) => tool.id)

    const processingToolsWithoutSeo = tools
        .filter((tool) => isFileProcessingCategory(tool.category))
        .filter((tool) => executorIds.has(tool.id))
        .filter((tool) => !tool.hasSeo)
        .map((tool) => tool.id)

    const executorOptionalInvalid = [...executorOptionalIds]
        .filter((toolId) => !tools.some((tool) => tool.id === toolId) || executorIds.has(toolId))

    const executorOptionalUnexpected = [...executorOptionalIds]
        .filter((toolId) => !EXECUTOR_EXEMPT_TOOL_IDS.has(toolId))

    const failures = [
        registryKeyMismatches.length && `Registry key/id mismatches: ${registryKeyMismatches.join(', ')}`,
        navMissingRegistry.length && `Nav routes missing registry tools: ${navMissingRegistry.join(', ')}`,
        executorWithoutRegistry.length && `Executor ids missing registry tools: ${executorWithoutRegistry.join(', ')}`,
        processingToolsWithoutExecutor.length && `File-processing tools missing executors: ${processingToolsWithoutExecutor.join(', ')}`,
        processingToolsWithoutSeo.length && `Executor-backed processing tools missing SEO metadata: ${processingToolsWithoutSeo.join(', ')}`,
        executorOptionalInvalid.length && `Invalid executor-optional ids: ${executorOptionalInvalid.join(', ')}`,
        executorOptionalUnexpected.length && `Unexpected executor-optional ids: ${executorOptionalUnexpected.join(', ')}`,
    ].filter(Boolean)

    if (failures.length > 0) {
        console.error('File-tools consistency check failed:\n')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exitCode = 1
        return
    }

    console.log(`File-tools consistency check passed for ${tools.length} tools, ${executorIds.size} executors, and ${navToolIds.size} nav-linked routes.`)
}

main().catch((error) => {
    console.error('Failed to run file-tools consistency check:', error)
    process.exitCode = 1
})
