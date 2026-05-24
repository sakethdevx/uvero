import { loadEnv } from 'vite'

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = []
        req.on('data', (chunk) => chunks.push(chunk))
        req.on('end', () => resolve(Buffer.concat(chunks).toString()))
        req.on('error', reject)
    })
}

/** Route /api/* to the Vercel-style handler during `vite dev` */
export function apiDevPlugin() {
    return {
        name: 'uvero-api-dev',
        configureServer(server) {
            const env = loadEnv(server.config.mode, process.cwd(), '')
            Object.assign(process.env, env)

            server.middlewares.use(async (req, res, next) => {
                const rawUrl = req.url || ''
                if (!rawUrl.startsWith('/api')) return next()

                try {
                    const parsed = new URL(rawUrl, 'http://localhost')
                    const subpath = parsed.pathname.replace(/^\/api\/?/, '')
                    if (subpath && subpath !== '') {
                        parsed.searchParams.set('path', subpath)
                        parsed.pathname = '/api'
                    }

                    const query = Object.fromEntries(parsed.searchParams.entries())
                    let body
                    if (req.method !== 'GET' && req.method !== 'HEAD') {
                        const raw = await readBody(req)
                        body = raw ? JSON.parse(raw) : {}
                    }

                    const mockReq = {
                        method: req.method,
                        url: `${parsed.pathname}?${parsed.searchParams.toString()}`,
                        headers: req.headers,
                        query,
                        body,
                    }

                    const mockRes = {
                        statusCode: 200,
                        status(code) {
                            this.statusCode = code
                            return this
                        },
                        setHeader() {
                            return this
                        },
                        json(data) {
                            res.statusCode = this.statusCode
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify(data))
                        },
                    }

                    const { default: apiHandler } = await import('../api/index.js')
                    await apiHandler(mockReq, mockRes)
                } catch (err) {
                    res.statusCode = 500
                    res.setHeader('Content-Type', 'application/json')
                    res.end(JSON.stringify({ error: String(err?.message || err) }))
                }
            })
        },
    }
}
