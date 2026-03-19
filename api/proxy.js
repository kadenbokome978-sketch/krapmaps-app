export const config = { api: { bodyParser: { sizeLimit: "10mb" }, responseLimit: "10mb" } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const text = await response.text();
    res.setHeader("Content-Type", "application/json");
    return res.status(response.status).send(text);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
