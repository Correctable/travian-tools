# travian-api

Cloudflare Worker — API proxy untuk TravianTools.
Menyembunyikan Turso credentials dan enforce rate limiting + row limits.

## Endpoints

| Endpoint | Deskripsi |
|---|---|
| `GET /api/statistics?server=ts5&type=players&page=1` | Leaderboard players |
| `GET /api/statistics?server=ts5&type=alliances&page=1` | Leaderboard alliances |
| `GET /api/player?server=ts5&name=PlayerName` | Player profile |
| `GET /api/alliance?server=ts5&name=TAG` | Alliance profile |
| `GET /api/inactive?server=ts5&days=7` | Inactive search |
| `GET /api/oasis?server=ts5&page=1` | Oasis data (1000 row preview) |
| `GET /api/villages?server=ts5&crops=15,9&page=1` | Village finder (1000 row preview) |
| `GET /api/search?server=ts5&q=name&type=player` | Search autocomplete |

## Environment Variables

Set di Cloudflare Worker dashboard → Settings → Variables and Secrets:

| Name | Type | Value |
|---|---|---|
| `TURSO_URL` | Variable | libsql://... |
| `TURSO_TOKEN` | Secret | token read-only dari Turso |

## Deploy

Push ke `main` → Cloudflare otomatis deploy via GitHub integration.
