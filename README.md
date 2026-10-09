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

This starts the **Vite dev server** on `http://localhost:7002` (React + HMR).
Run `M-Music-Cloud-Server` separately on `http://localhost:7000`; Vite proxies
`/api` and `/auth` requests to it during local development.

### Desktop downloads

The Download page reads `GET /api/desktop/releases/latest` from the Cloud Server.
In the Admin Dashboard, create a Desktop Release with the hosted installer URL,
then select **Activate** to publish it. Creating a release alone keeps it inactive.

The page displays the active version and platform, refreshes every minute and
when the window regains focus, and requests the latest release again on every
download click before opening its installer URL. If no release is active or the
server is unavailable, the page shows an unavailable state with a retry button.
Use a direct HTTP or HTTPS installer URL so the browser downloads the file.

### User profile images

Signed-in users can choose a profile image from the Profile page. The browser
sends the file as `multipart/form-data` to `POST /api/me/profile-image` using
the `image` field. The Cloud Server uploads it to Cloudinary under
`m-music/user-profiles` and stores the returned URL and `public_id` on the
user record. Image files are limited to 5 MB and are never converted to
base64 or stored as image bytes in MongoDB.

When a user replaces an image, the new Cloudinary asset is saved first and the
previous asset is then deleted. The Profile page also supports removing the
image through `DELETE /api/me/profile-image`.

### Production Build

```bash
bun run build
```

Builds the static client into `dist/client/`.

### Deploy separately on Render

Create a **Static Site**, not a Web Service:

- Build command: `bun install --frozen-lockfile && bun run build`
- Publish directory: `dist/client`
- Environment variable: `VITE_API_URL=https://api.m-music.site`
- Rewrite rule: source `/*`, destination `/index.html`, action `Rewrite`

The Cloud Server is deployed independently. Never use `node server.js` for
this repository; it contains no Node/Express production server.

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| `bun run dev` | `vite --configLoader runner` | Start the Vite frontend |
| `bun run build` | `vite build --configLoader runner` | Build React app to `dist/client/` |
| `bun run typecheck` | `tsc -p tsconfig.client.json --noEmit` | Client type check |
| `bun run format` | `prettier --write ...` | Format all source files |
| `bun run format:check` | `prettier --check ...` | Check formatting without writing |

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
