import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BASE_URL = 'https://uvero.app'
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(ROOT_DIR, '..')
const TOOLS_DIR = path.join(PROJECT_ROOT, 'src', 'services', 'toolbox', 'tools')
const TOOL_INDEX_PATH = path.join(TOOLS_DIR, 'index.js')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')
const SITEMAP_PATH = path.join(PUBLIC_DIR, 'sitemap.xml')
const ROBOTS_PATH = path.join(PUBLIC_DIR, 'robots.txt')
const TODAY = new Date().toISOString().slice(0, 10)

const STATIC_ROUTES = [
    { path: '/', changefreq: 'daily', priority: '1.0' },
    { path: '/toolbox', changefreq: 'weekly', priority: '0.95' },
    { path: '/clipboard', changefreq: 'weekly', priority: '0.9' },
    { path: '/cli', changefreq: 'monthly', priority: '0.8' },
    { path: '/contact', changefreq: 'yearly', priority: '0.5' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.4' },
]

async function collectSeoFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(entries.map(async entry => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return collectSeoFiles(fullPath)
        if (entry.isFile() && entry.name === 'seo.json') return [fullPath]
        return []
    }))

    return files.flat()
}

async function collectToolRoutes() {
    const toolIndex = await readFile(TOOL_INDEX_PATH, 'utf8')
    const toolIdMatches = [...toolIndex.matchAll(/^\s*'([^']+)':\s*{/gm)]
    const routeMap = new Map(
        toolIdMatches.map(([, toolId]) => [
            `/${toolId}`,
            {
                path: `/${toolId}`,
                changefreq: 'monthly',
                priority: '0.8'
            }
        ])
    )

    const seoFiles = await collectSeoFiles(TOOLS_DIR)
    for (const seoFile of seoFiles) {
        const raw = await readFile(seoFile, 'utf8')
        const seo = JSON.parse(raw)
        if (!seo.canonical) continue

        const url = new URL(seo.canonical)
        if (url.origin !== BASE_URL) continue

        routeMap.set(url.pathname, {
            path: url.pathname,
            changefreq: 'monthly',
            priority: '0.8'
        })
    }

    return [...routeMap.values()]
}

function escapeXml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;')
}

function buildSitemap(routes) {
    const urls = routes.map(route => {
        const loc = escapeXml(`${BASE_URL}${route.path}`)
        return [
            '  <url>',
            `    <loc>${loc}</loc>`,
            `    <lastmod>${TODAY}</lastmod>`,
            `    <changefreq>${route.changefreq}</changefreq>`,
            `    <priority>${route.priority}</priority>`,
            '  </url>'
        ].join('\n')
    })

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls,
        '</urlset>',
        ''
    ].join('\n')
}

function buildRobotsTxt() {
    return [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${BASE_URL}/sitemap.xml`,
        ''
    ].join('\n')
}

async function main() {
    const toolRoutes = await collectToolRoutes()
    const uniqueRoutes = [...STATIC_ROUTES, ...toolRoutes]
        .sort((a, b) => a.path.localeCompare(b.path))
        .filter((route, index, routes) => index === routes.findIndex(item => item.path === route.path))

    await writeFile(SITEMAP_PATH, buildSitemap(uniqueRoutes), 'utf8')
    await writeFile(ROBOTS_PATH, buildRobotsTxt(), 'utf8')

    console.log(`Generated ${uniqueRoutes.length} sitemap entries at ${path.relative(PROJECT_ROOT, SITEMAP_PATH)}`)
    console.log(`Generated robots.txt at ${path.relative(PROJECT_ROOT, ROBOTS_PATH)}`)
}

main().catch(error => {
    console.error('Failed to generate sitemap:', error)
    process.exitCode = 1
})
