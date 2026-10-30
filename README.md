## Getting Started

[Run အဆင့်ဆင့် / Step-by-step commands](#run-steps)

### Chord reader

Charted songs display a key selector, Show/Hide chords and Original key reset.
Chord roots and slash bass notes transpose locally from the saved original chart;
lyrics stay unchanged. Visibility and per-song keys are stored in this browser.
Songs without supported charts keep their plain lyrics.

Chords are authored in the Admin Dashboard; see the family
[authoring guide](../docs/CHORD_AUTHORING_GUIDE.md). The shared music rules are
installed from this project's committed `vendor/` archive, so standalone builds
do not depend on a parent-folder checkout. Verify with `bun run test`,
`bun run typecheck` and `bun run build`.

### Prerequisites

- **Node.js** ≥ 20.19.0
- **Bun**
- **Cloud Server** — configure MongoDB in the backend; see [its setup guide](../M-Music-Cloud-Server/README.md#run-steps).

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

The Download page reads `GET /api/desktop/releases/latest?platform=...` for
Windows, macOS and Linux. In the Admin Dashboard, create a Desktop Release with
the hosted installer URL, then select **Activate** to publish it. Each platform
keeps its own active release; creating a release alone keeps it inactive.

The page detects the visitor's desktop OS to highlight a recommended download,
but always keeps all three platform choices visible. It refreshes every minute,
when the window regains focus, and requests the selected platform's latest
release again on every download click. Missing releases show **Coming soon**.
Use a direct HTTP or HTTPS installer URL so the browser downloads the file.

Below the download card, **Released data** loads release history from
`GET /api/desktop/releases` and refreshes every minute and on window focus.
Activating a release records its first publication date; later versions keep
previously published entries in this history. Drafts are not shown. Older active
records without a publication date show **Recorded on** using their creation
date. Previously inactive legacy records need publication metadata before they
can appear, because the old data cannot distinguish drafts from past releases.

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

| Script                 | Command                                                 | Description                       |
| ---------------------- | ------------------------------------------------------- | --------------------------------- |
| `bun run dev`          | `vite --configLoader runner`                            | Start the Vite frontend           |
| `bun run build`        | `bun run typecheck && vite build --configLoader runner` | Build React app to `dist/client/` |
| `bun run test`         | `bun test ./tests`                                      | Run all app tests                 |
| `bun run typecheck`    | `tsc -p tsconfig.client.json --noEmit`                  | Client type check                 |
| `bun run format`       | `prettier --write .`                                    | Format all source files           |
| `bun run format:check` | `prettier --check .`                                    | Check formatting without writing  |

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

## Run steps

အောက်ပါ commands တွေကို PowerShell မှာ တစ်ကြောင်းချင်း run ပါ။ Error တွေ့ရင် ပြင်ပြီးမှ နောက် command ကို ဆက် run ပါ။ ပထမ setup နဲ့ commit/release မတိုင်မီ checks အားလုံးကို စစ်ပါ။ နေ့စဉ် development အတွက် setup ရှိပြီးသားဆို အဆင့် 4 ကို သုံးနိုင်ပါတယ်။

### 1. Project folder နဲ့ dependencies

`M-family` folder ကနေ စပါ။ Project folder ထဲ ရောက်ပြီးသားဆို `cd` ကို ကျော်နိုင်ပါတယ်။

```powershell
cd .\M-Music-Web-App
bun install --frozen-lockfile
```

### 2. Local environment ပြင်ဆင်ပါ

[Cloud Server](../M-Music-Cloud-Server/README.md#run-steps) ကို သီးခြား terminal မှာ port `7000` နဲ့ အရင်ဖွင့်ထားပါ။ MongoDB ကို Cloud Server ဘက်မှာ သတ်မှတ်ရပါတယ်။

Local development မှာ Vite က API requests တွေကို Cloud Server ဆီ proxy လုပ်ပေးပါတယ်။ `.env` လိုအပ်လျှင် မရှိသေးမှသာ example ကို ကူးပါ။

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Local API ကို တိုက်ရိုက်သုံးလျှင် `VITE_API_URL=http://localhost:7000` သတ်မှတ်ပါ။

### 3. Code checks နဲ့ build ကို အစဉ်လိုက် စစ်ပါ

```powershell
bun run format:check
bun run typecheck
bun run lint:check
bun run test
bun run build
```

`format:check` မှာ formatting ပြင်ဖို့ ပြလျှင် အောက်ပါအတိုင်း ပြင်ပြီး အဆင့် 3 ရဲ့ ကျန် commands တွေကို ဆက်ပါ။ `format` က ဖိုင်တွေကို ပြင်ရေးပေးပါတယ်။

```powershell
bun run format
bun run format:check
```

Lint ပြဿနာတွေထဲက အလိုအလျောက် ပြင်နိုင်တာတွေကို ပြင်ရန် လိုမှသာ run ပါ။ ပြောင်းထားတဲ့ diff ကို ပြန်ကြည့်ပြီး ကျန် errors တွေကို ကိုယ်တိုင်ပြင်ပါ။

```powershell
bun run lint:fix
bun run lint:check
```

Code ပြင်ပြီးလျှင် အဆင့် 3 ရဲ့ checks ကို ပြန်စစ်ပါ။ `build` ထဲမှာ typecheck ပါပြီးသားဖြစ်သော်လည်း သီးခြား `typecheck` က type errors ကို စောစော သိနိုင်ဖို့ ဖြစ်ပါတယ်။

### 4. Development app ကို ဖွင့်ပါ

Cloud Server terminal ကို ဖွင့်ထားပြီး Web App terminal မှာ run ပါ။

```powershell
bun run dev
```

Browser မှာ `http://localhost:7002` ကို ဖွင့်ပါ။

`dev`/preview command က ဆက် run နေပါမယ်။ ရပ်ရန် `Ctrl+C` သုံးပါ။ Checks ထပ်စစ်ချင်လျှင် project folder တူတဲ့ terminal အသစ်မှာ စစ်ပါ။ Project test suite တွေကို တစ်ခုချင်း run လုပ်တာက computer ပေါ် load များလို့ ဖြစ်တဲ့ timeout တွေကို လျော့စေပါတယ်။

### 5. Build output နဲ့ ဆက်လုပ်ရန်

Production files တွေက `dist/client/` ထဲမှာ ရှိပါတယ်။ အဲဒီ directory ကို static hosting ပေါ် တင်နိုင်ပါတယ်။ အသေးစိတ်ကို [Render deployment](#deploy-separately-on-render) မှာ ကြည့်ပါ။

### Command reference

| Command                | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `bun run format:check` | Check formatting without changing files.       |
| `bun run format`       | Apply Prettier formatting.                     |
| `bun run typecheck`    | Check TypeScript types.                        |
| `bun run lint:check`   | Check code with ESLint without changing files. |
| `bun run lint:fix`     | Apply supported ESLint fixes.                  |
| `bun run test`         | Run automated tests.                           |
| `bun run build`        | Type-check and create production build output. |

Lint errors fail the command. Warnings remain visible but do not fail it.
