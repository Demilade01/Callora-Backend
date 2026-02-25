# Callora Backend

API gateway, usage metering, and billing services for the Callora API marketplace. Talks to Soroban contracts and Horizon for on-chain settlement.

## Tech stack

- **Node.js** + **TypeScript**
- **Express** for HTTP API
- Planned: Horizon listener, PostgreSQL, billing engine

## What’s included

- Health check: `GET /api/health`
- Placeholder routes: `GET /api/apis`, `GET /api/usage`
- JSON body parsing; ready to add auth, metering, and contract calls

## Local setup

1. **Prerequisites:** Node.js 18+

2. **Install and run (dev):**

   ```bash
   cd callora-backend
   npm install
   npm run dev
   ```

3. API base: [http://localhost:3000](http://localhost:3000). Example: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Run with tsx watch (no build)  |
| `npm run build`| Compile TypeScript to `dist/`  |
| `npm start`    | Run compiled `dist/index.js`   |

## Database migrations

This repository includes SQL migrations for `api_keys` and `vaults` in `migrations/`.

- `api_keys` stores only `key_hash` (never the raw API key).
- `api_keys` enforces unique `(user_id, api_id)` and has an index on `(user_id, prefix)` for key lookup.
- `vaults` stores per-user per-network snapshots with unique `(user_id, network)`.

Run migrations with PostgreSQL:

```bash
psql "$DATABASE_URL" -f migrations/0001_create_api_keys_and_vaults.up.sql
```

Rollback:

```bash
psql "$DATABASE_URL" -f migrations/0001_create_api_keys_and_vaults.down.sql
```

Validate issue #9 requirements locally:

```bash
npm run validate:issue-9
```

## Project layout

```
callora-backend/
├── src/
│   └── index.ts   # Express app and routes
├── package.json
└── tsconfig.json
```

## Environment

- `PORT` — HTTP port (default: 3000). Optional for local dev.

This repo is part of [Callora](https://github.com/your-org/callora). Frontend: `callora-frontend`. Contracts: `callora-contracts`.
