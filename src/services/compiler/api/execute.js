/**
 * Vercel Serverless Proxy for HuggingFace Compiler API
 * Adds Authorization header with HF_COMPILER_TOKEN
 */
export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const HF_URL = process.env.HF_COMPILER_URL;
    const HF_TOKEN = process.env.HF_COMPILER_TOKEN;

    if (!HF_URL || !HF_TOKEN) {
        return res.status(500).json({ error: 'Compiler service not configured on server' });
    }

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const fullPath = url.searchParams.get('path') || '';
        // Strip 'compiler/' prefix to get the HF endpoint path
        let hfPath = fullPath.replace(/^compiler\/?/, '');

        // Map keep-alive to a lightweight languages check endpoint
        if (hfPath === 'keep-alive') {
            hfPath = 'languages';
        }

        const targetUrl = `${HF_URL.replace(/\/$/, '')}/${hfPath}`;

        const options = {
            method: req.method,
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
            },
        };

        if (req.method === 'POST' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const hfResponse = await fetch(targetUrl, options);
        const data = await hfResponse.json().catch(() => ({}));

        return res.status(hfResponse.status).json(data);
    } catch (error) {
        console.error('[compilerProxy] error:', error);
        return res.status(500).json({ error: 'Failed to communicate with execution server' });
    }
}
