import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
    DOCUMENT_CONVERTER_ENTRIES,
    ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS,
    TOOLS_REQUIRING_SHARED_METADATA,
    getToolMetadata,
} from '../src/services/toolbox/core/toolMetadata.js'

const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(ROOT_DIR, '..')

const TOOL_INDEX_PATH = path.join(PROJECT_ROOT, 'src', 'services', 'toolbox', 'tools', 'index.js')
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
        const modesMatch = block.match(/modes:\s*\[([^\]]*)\]/)

        tools.push({
            key,
            id: idMatch?.[1] || key,
            category: categoryMatch?.[1] || null,
            hasSeo: /seo:\s*[A-Za-z0-9_]+/.test(block),
            declaredModes: modesMatch
                ? [...modesMatch[1].matchAll(/'([^']+)'/g)].map(([, mode]) => mode)
                : [],
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

async function parseExecutorModeMap(source) {
    const executorBlockMatch = source.match(/const toolExecutors = \{([\s\S]*?)\n\};/)
    if (!executorBlockMatch) {
        throw new Error('Could not find executor registry block.')
    }

    const importMatches = [...source.matchAll(/import\s+([A-Za-z0-9_]+)\s+from\s+'([^']+)'/g)]
    const importMap = new Map(
        importMatches.map(([, localName, importPath]) => [
            localName,
            path.resolve(path.dirname(EXECUTORS_PATH), `${importPath}.js`),
        ])
    )

    const cache = new Map()

    async function getModesForExecutorFile(filePath) {
        if (cache.has(filePath)) {
            return cache.get(filePath)
        }

        const executorSource = await readFile(filePath, 'utf8')
        const inheritedModesMatch = executorSource.match(/supportedModes = \[\.\.\.(\w+)\.supportedModes\]/)
        if (inheritedModesMatch) {
            const dependencyName = inheritedModesMatch[1]
            const dependencyImportMatch = executorSource.match(new RegExp(`import\\s+${dependencyName}\\s+from\\s+'([^']+)'`))
            if (!dependencyImportMatch) {
                cache.set(filePath, [])
                return []
            }

            const dependencyPath = path.resolve(path.dirname(filePath), `${dependencyImportMatch[1]}.js`)
            const modes = await getModesForExecutorFile(dependencyPath)
            cache.set(filePath, modes)
            return modes
        }

        const directModesMatch = executorSource.match(/const supportedModes = \[([^\]]*)\]/)

        if (directModesMatch) {
            const modes = [...directModesMatch[1].matchAll(/'([^']+)'/g)].map(([, mode]) => mode)
            cache.set(filePath, modes)
            return modes
        }

        cache.set(filePath, [])
        return []
    }

    const pairs = await Promise.all(
        [...executorBlockMatch[1].matchAll(/'([^']+)':\s*([A-Za-z0-9_]+)/g)].map(async ([, toolId, executorName]) => {
            const filePath = importMap.get(executorName)
            const modes = filePath ? await getModesForExecutorFile(filePath) : []
            return [toolId, modes]
        })
    )

    return new Map(pairs)
}

function parseNavToolIds(source) {
    const match = source.match(/const (?:toolCategories|TOOL_CATEGORIES) = \[([\s\S]*?)\n\s*\];/)
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
    const [toolIndexSource, appSource] = await Promise.all([
        readFile(TOOL_INDEX_PATH, 'utf8'),
        readFile(APP_PATH, 'utf8'),
    ])

    const tools = parseToolEntries(toolIndexSource)
    const executorIds = new Set()
    const executorModeMap = new Map()
    const navToolIds = new Set(parseNavToolIds(appSource))
    const executorOptionalIds = new Set(parseExecutorOptionalIds(toolIndexSource))

    const registryKeyMismatches = tools
        .filter((tool) => tool.key !== tool.id)
        .map((tool) => `${tool.key} -> ${tool.id}`)

    const navMissingRegistry = [...navToolIds]
        .filter((toolId) => !tools.some((tool) => tool.id === toolId))

    const executorWithoutRegistry = [...executorIds]
        .filter((toolId) => !tools.some((tool) => tool.id === toolId))

    const declaredModesMismatches = tools
        .filter((tool) => executorIds.has(tool.id))
        .filter((tool) => {
            const executor = executorModeMap.get(tool.id) || []
            return JSON.stringify(tool.declaredModes) !== JSON.stringify(executor)
        })
        .map((tool) => {
            const executor = executorModeMap.get(tool.id) || []
            return `${tool.id} (declared: ${tool.declaredModes.join('/') || 'none'}, executor: ${executor.join('/') || 'none'})`
        })

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

    const documentConverterMissingRegistry = DOCUMENT_CONVERTER_ENTRIES
        .filter((entry) => !tools.some((tool) => tool.id === entry.id))
        .map((entry) => entry.id)

    const documentConverterMissingFormats = DOCUMENT_CONVERTER_ENTRIES
        .filter((entry) => !entry.format || typeof entry.format !== 'string')
        .map((entry) => entry.id)

    const documentConverterDuplicateIds = DOCUMENT_CONVERTER_ENTRIES
        .map((entry) => entry.id)
        .filter((toolId, index, entries) => entries.indexOf(toolId) !== index)



    const onlineFallbackMissingRegistry = ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS
        .filter((toolId) => !tools.some((tool) => tool.id === toolId))

    const onlineFallbackMissingExecutor = ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS
        .filter((toolId) => !executorIds.has(toolId))

    const onlineFallbackUnexpectedExecutorModes = ONLINE_MODE_OFFLINE_EXECUTOR_TOOL_IDS
        .filter((toolId) => executorIds.has(toolId))
        .filter((toolId) => {
            const executorModes = executorModeMap.get(toolId) || []
            return JSON.stringify(executorModes) !== JSON.stringify(['offline'])
        })

    const sharedMetadataMissing = TOOLS_REQUIRING_SHARED_METADATA
        .filter((toolId) => !tools.some((tool) => tool.id === toolId))
        .concat(
            TOOLS_REQUIRING_SHARED_METADATA.filter((toolId) => {
                const metadata = getToolMetadata(toolId)
                return !metadata.availability || !metadata.availabilityNote || !Array.isArray(metadata.limits)
            })
        )

    const failures = [
        registryKeyMismatches.length && `Registry key/id mismatches: ${registryKeyMismatches.join(', ')}`,
        navMissingRegistry.length && `Nav routes missing registry tools: ${navMissingRegistry.join(', ')}`,
        executorWithoutRegistry.length && `Executor ids missing registry tools: ${executorWithoutRegistry.join(', ')}`,
        declaredModesMismatches.length && `Executor-backed tools with stale raw mode declarations: ${declaredModesMismatches.join(', ')}`,
        processingToolsWithoutExecutor.length && `File-processing tools missing executors: ${processingToolsWithoutExecutor.join(', ')}`,
        processingToolsWithoutSeo.length && `Executor-backed processing tools missing SEO metadata: ${processingToolsWithoutSeo.join(', ')}`,
        executorOptionalInvalid.length && `Invalid executor-optional ids: ${executorOptionalInvalid.join(', ')}`,
        executorOptionalUnexpected.length && `Unexpected executor-optional ids: ${executorOptionalUnexpected.join(', ')}`,
        documentConverterMissingRegistry.length && `Document hub tool ids missing registry entries: ${documentConverterMissingRegistry.join(', ')}`,
        documentConverterMissingFormats.length && `Document hub tools missing format labels: ${documentConverterMissingFormats.join(', ')}`,
        documentConverterDuplicateIds.length && `Document hub contains duplicate tool ids: ${[...new Set(documentConverterDuplicateIds)].join(', ')}`,

        onlineFallbackMissingRegistry.length && `Online fallback tool ids missing registry entries: ${onlineFallbackMissingRegistry.join(', ')}`,
        onlineFallbackMissingExecutor.length && `Online fallback tool ids missing executors: ${onlineFallbackMissingExecutor.join(', ')}`,
        onlineFallbackUnexpectedExecutorModes.length && `Online fallback tools must remain offline-only at the executor level: ${onlineFallbackUnexpectedExecutorModes.join(', ')}`,
        sharedMetadataMissing.length && `Tools missing required shared metadata: ${[...new Set(sharedMetadataMissing)].join(', ')}`,
    ].filter(Boolean)

    if (failures.length > 0) {
        console.error('Toolbox consistency check failed:\n')
        for (const failure of failures) {
            console.error(`- ${failure}`)
        }
        process.exitCode = 1
        return
    }

    console.log(`Toolbox consistency check passed for ${tools.length} tools, ${executorIds.size} executors, and ${navToolIds.size} nav-linked routes.`)
}

main().catch((error) => {
    console.error('Failed to run toolbox consistency check:', error)
    process.exitCode = 1
})
