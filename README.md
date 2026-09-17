## Getting Started

### Prerequisites

- **Node.js** ≥ 20.19.0
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier

### Installation

```bash
# Clone or enter the project
cd "M-Music-Web-App"

# Install all dependencies
bun install
```

### Development

```bash
bun run dev
```

This starts two concurrent processes:
- **Vite dev server** on `http://localhost:5173` (React + HMR)
- **Express server** on `http://localhost:8888` (API, watched via `tsx`)

Vite proxies `/api` and `/auth` requests to the Express server automatically.

### Production Build

```bash
bun run build
```

Builds both client (`dist/client/`) and server (`dist/server/`).

### Run Production Build

```bash
bun start
```

Express serves the React SPA from `dist/client/` and handles API routes.

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| `bun run dev` | `concurrently "bun:dev:server" "bun:dev:client"` | Start full-stack dev server |
| `bun run dev:server` | `tsx watch server/src/server.ts` | Watch-mode backend only |
| `bun run dev:client` | `vite --configLoader runner` | Vite frontend only |
| `bun run build` | `bun run build:client && bun run build:server` | Full production build |
| `bun run build:client` | `vite build --configLoader runner` | Build React app to `dist/client/` |
| `bun run build:server` | `tsc -p tsconfig.server.json` | Compile TypeScript server |
| `bun run typecheck` | `bun run typecheck:client && bun run typecheck:server` | Run both TypeScript checks |
| `bun run typecheck:client` | `tsc -p tsconfig.client.json --noEmit` | Client type check |
| `bun run typecheck:server` | `tsc -p tsconfig.server.json --noEmit` | Server type check |
| `bun run format` | `prettier --write ...` | Format all source files |
| `bun run format:check` | `prettier --check ...` | Check formatting without writing |
| `bun start` | `node dist/server/server/src/server.js` | Run production build |

> [!TIP]
> For a detailed guide on how each script works and what it compiles/targets under the hood, check out the dedicated [bunRunCommand.md](./bunRunCommand.md) reference.

---

## 👤 Author

**MuMung** — M-Music Project

---

The Song payload is 

{ 
"Song Title": "",
"Artist": "",
"Released Date": "",
"About Song": "",
"Direct to YT": "",
"Lyric": [
]
}