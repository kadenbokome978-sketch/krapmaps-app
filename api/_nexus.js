/**
 * Greenlit → NEXUS memory gateway adapter (Vercel serverless function).
 *
 * Server-side only — NEXUS_MCP_TOKEN never reaches the browser bundle.
 * Proxies vault operations from Greenlit's client to the NEXUS relay's
 * greenlit gateway endpoints. See nexus/docs/GREENLIT_NEXUS_INTEGRATION.md.
 *
 * Routes (passed as `action` in the POST body):
 *   search  → POST /gateway/greenlit/vault/search
 *   read    → POST /gateway/greenlit/vault/read
 *   related → POST /gateway/greenlit/vault/related
 *   write   → POST /gateway/greenlit/vault/write
 *   update  → POST /gateway/greenlit/vault/update
 */

const NEXUS_MCP_URL   = process.env.NEXUS_MCP_URL || '';
const NEXUS_MCP_TOKEN = process.env.NEXUS_MCP_TOKEN || '';

const ALLOWED_ACTIONS = new Set(['search', 'read', 'related', 'write', 'update']);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!NEXUS_MCP_URL || !NEXUS_MCP_TOKEN) {
    return res.status(503).json({ error: 'NEXUS integration not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid JSON' });
  }

  const { action, ...params } = body || {};
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return res.status(400).json({ error: `action must be one of: ${[...ALLOWED_ACTIONS].join(', ')}` });
  }

  const url = `${NEXUS_MCP_URL.replace(/\/+$/, '')}/gateway/greenlit/vault/${action}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NEXUS_MCP_TOKEN}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(upstream.status).send(text);
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'NEXUS gateway timeout' });
    }
    return res.status(502).json({ error: 'NEXUS gateway unreachable' });
  }
}
