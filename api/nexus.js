/**
 * Combined NEXUS integration endpoint (Vercel serverless function).
 *
 * POST — Greenlit → NEXUS vault proxy (client-side calls)
 *   Server-side only — NEXUS_MCP_TOKEN never reaches the browser.
 *   Routes by `action` field: search, read, related, write, update
 *
 * GET — NEXUS → Greenlit state query (Hermes/relay calls)
 *   Authenticated with NEXUS_INBOUND_TOKEN Bearer.
 *   Returns structured pipeline summary from Supabase.
 */

const NEXUS_MCP_URL   = process.env.NEXUS_MCP_URL || '';
const NEXUS_MCP_TOKEN = process.env.NEXUS_MCP_TOKEN || '';
const SB_URL  = process.env.GREENLIT_SUPABASE_URL || 'https://xiudsyiinkqtmowkiqxh.supabase.co';
const SB_KEY  = process.env.GREENLIT_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const INBOUND = process.env.NEXUS_INBOUND_TOKEN || '';

const ALLOWED_ACTIONS = new Set(['search', 'read', 'related', 'write', 'update']);

async function sbFetch(table, filter = '') {
  if (!SB_KEY) return null;
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}&limit=500`, {
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    if (!r.ok) return null;
    return r.json();
  } catch { return null; }
}

function summariseVideos(videos) {
  if (!videos || !videos.length) return { total: 0, byStatus: {}, recent: [] };
  const byStatus = {};
  for (const v of videos) {
    const s = v.status || 'unknown';
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  const sorted = [...videos]
    .filter(v => v.created_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const recent = sorted.slice(0, 10).map(v => ({
    title: v.title || v.hook || '(untitled)',
    status: v.status,
    platform: v.platform,
    views: v.views || 0,
    likes: v.likes || 0,
    posted: v.posted_date || null,
  }));
  const posted = videos.filter(v => v.status === 'posted' && v.views > 0);
  const avgViews = posted.length ? Math.round(posted.reduce((s, v) => s + (v.views || 0), 0) / posted.length) : 0;
  const avgLikes = posted.length ? Math.round(posted.reduce((s, v) => s + (v.likes || 0), 0) / posted.length) : 0;
  return { total: videos.length, byStatus, recent, avgViews, avgLikes, postedCount: posted.length };
}

async function handleStateQuery(req, res) {
  if (!INBOUND) return res.status(503).json({ error: 'NEXUS inbound not configured' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || token !== INBOUND) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const videos = await sbFetch('videos', 'select=*');
  const summary = summariseVideos(videos);

  res.json({
    project: 'greenlit',
    brand: '@findkrap',
    app: 'KrapMaps',
    niche: 'crowdsourced bin-finding app for backpackers and travellers',
    platforms: ['tiktok', 'instagram'],
    team: ['Kaden (UK, strategy/editing)', 'Harley (Thailand/SE Asia, filming)'],
    pipeline: summary,
    fetchedAt: new Date().toISOString(),
  });
}

async function handleVaultProxy(req, res) {
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') return handleStateQuery(req, res);
  if (req.method === 'POST') return handleVaultProxy(req, res);

  return res.status(405).json({ error: 'GET or POST only' });
}
