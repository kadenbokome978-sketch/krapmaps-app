// Vercel serverless — proxies Instagram view count requests to bypass browser CORS
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { codes } = req.query;
  if (!codes) return res.status(400).json({ error: 'codes param required' });

  const codeList = codes.split(',').filter(Boolean).slice(0, 20);
  const results = {};

  await Promise.all(codeList.map(async (code) => {
    try {
      const r = await fetch(`https://www.instagram.com/reel/${code}/?__a=1&__d=dis`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json, text/javascript, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        }
      });
      if (!r.ok) return;
      const data = await r.json();
      const media = data?.graphql?.shortcode_media || data?.items?.[0];
      if (media) {
        results[code] = {
          views:    media.video_view_count || media.play_count || 0,
          likes:    media.edge_media_preview_like?.count || media.like_count || 0,
          comments: media.edge_media_to_comment?.count || media.comment_count || 0,
          reposts:  0,
        };
      }
    } catch { /* silent */ }
  }));

  res.json(results);
}
