# White-Label Client Deployments

## How it works

Each client gets their own Vercel deployment from this repo. The only file
that changes per client is `client.config.json` in the root. Everything
else — features, AI, XP system, all of it — stays the same.

## To deploy a new client

1. Clone the repo
2. Edit `client.config.json` with the client's details (see fields below)
3. `git push` to a new Vercel project (e.g. `sarah-os.vercel.app`)
4. Done — Vercel auto-deploys

## client.config.json fields

| Field | Description | Example |
|-------|-------------|---------|
| `clientId` | Unique slug, no spaces | `"sarahfit"` |
| `appName` | Their app/brand name | `"SarahFit"` |
| `appTagline` | Subtitle under logo | `"Content OS"` |
| `handle` | Their main TikTok handle | `"@sarahfituk"` |
| `creator1` | Primary creator name | `"Sarah"` |
| `creator2` | Second creator (or blank) | `"Mike"` |
| `niche` | 1-sentence niche description | `"women's fitness & healthy eating"` |
| `contentStyle` | Their content formula | `"transformation videos, day-in-the-life, recipe demos"` |
| `platforms` | Comma-separated | `"tiktok,instagram,youtube"` |
| `targetAudience` | Who watches them | `"women 22-35, UK/US, fitness beginners"` |
| `competitors` | Their competitor handles | `"@gracefituk,@laurenxhaynes"` |
| `appDescription` | About their product/brand | `"Fitness app with 50K users..."` |
| `bestFormula` | What works for them | `"before/after → how → result"` |
| `accentColor` | Primary brand colour (hex) | `"#FF6B1A"` |
| `accentColor2` | Secondary colour | `"#00E5FF"` |
| `currency` | Their currency symbol | `"$"` |
| `aiGreeting` | AI assistant opening line | `"Hey Sarah! Ready to plan this week's content?"` |

## Pricing tiers (suggested)

- **Starter £49/mo** — deploy + their config + onboarding
- **Pro £99/mo** — + monthly strategy call + priority support  
- **Agency £249/mo** — + team seats, custom features, white-glove setup

## Per-client Vercel setup

- Each client = one Vercel project = free on hobby tier
- Custom domain: `content.sarahfituk.com` (client points DNS, ~15 min setup)
- Their data lives in their browser's localStorage — zero backend cost
- Optional: connect to Supabase for cloud sync (add to their Settings)

## Updating all clients

Push to this repo → cherry-pick to each client's branch → Vercel auto-deploys.
Or use a monorepo with `apps/[clientId]/client.config.json` per client.
