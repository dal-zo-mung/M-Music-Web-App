# 🎵 M-Music

> A full-stack **music lyrics discovery & community platform** built with React 19, Express 5, TypeScript, and MongoDB.

M-Music lets users browse curated song lyrics, search across a music catalogue, create community lyric posts, favorite songs, and chat with an AI support assistant — all behind a secure session-based authentication system with both local accounts and Google OAuth.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture Overview](#-architecture-overview)
- [Two Servers Explained](#-two-servers-explained)
- [Modules](#-modules)
  - [Auth Module](#auth-module)
  - [Songs Module](#songs-module)
  - [Community Module](#community-module)
  - [Support Module](#support-module)
  - [Shared Middleware](#shared-middleware)
- [Client Architecture](#-client-architecture)
- [API Reference](#-api-reference)
- [API Testing with Postman](#-api-testing-with-postman)
  - [One-Time Setup](#one-time-setup)
  - [CSRF Workflow](#csrf-workflow)
  - [All Endpoints](#all-endpoints)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Scripts](#-scripts)
- [Security Design](#-security-design)
- [Database Collections](#-database-collections)
- [UML Design](#-uml-design)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | Local accounts (bcrypt) + Google OAuth 2.0, with session persistence in MongoDB |
| 🔒 **Account Lockout** | 5 failed login attempts → 15-minute lockout |
| 🔄 **Legacy Hash Migration** | Old scrypt hashes automatically re-hashed to bcrypt on next login |
| 🎵 **Song Catalogue** | Browse, search, and view full lyrics for songs stored in MongoDB |
| ❤️ **Favorites** | Logged-in users can favorite/unfavorite songs; favorites persist in DB |
| 🔍 **Full-Text Search** | Case-insensitive regex search across song title, artist, and description |
| 🌐 **Community Lyrics** | Users can submit community lyric posts (with YouTube link) and comment on others' posts |
| 🤖 **AI Support Chat** | In-app chat widget powered by Groq LLM (llama-3.1-8b-instant) |
| 🎨 **Theme & Preferences** | Dark/light mode, font size, and scroll speed — all persisted in `localStorage` |
| 🏷️ **Profile Customization** | Display name, bio, tagline, and 5 accent color themes (default, aurora, ember, meadow, slate) |
| 🛡️ **Security Hardening** | CSRF protection, Helmet CSP, rate limiting per endpoint, origin checks, dangerous key rejection |
| 📦 **Shared TypeScript Contracts** | Single `shared/types.ts` consumed by both client and server builds |

---

## 🛠 Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20.19.0 |
| Framework | Express 5 |
| Language | TypeScript 5 |
| Database | MongoDB via Mongoose 9 |
| Authentication | Passport.js + passport-google-oauth20 |
| Session Store | connect-mongo (MongoDB-backed sessions) |
| Password Hashing | bcrypt (+ legacy scrypt migration support) |
| HTTP Security | Helmet, CORS, express-rate-limit |
| Validation | Zod 4 |
| AI Integration | Groq API (llama-3.1-8b-instant) |
| Dev Runner | tsx (watch mode) |

### Frontend
| Layer | Technology |
|---|---|
| UI Library | React 19 |
| Language | TypeScript 5 |
| Bundler | Vite 7 |
| Routing | React Router v7 |
| Data Fetching | SWR 2 |
| State | React Context (Auth + Preferences) |

### Tooling
| Tool | Purpose |
|---|---|
| concurrently | Run server + client dev servers simultaneously |
| tsx | TypeScript execution for server dev |
| dotenv | Environment variable loading |

---

## 📁 Project Structure

```
M-Music-12/
├── client/                      ← React frontend root
│   └── src/
│       ├── main.tsx             ← React entry point
│       ├── router.tsx           ← React Router route definitions
│       ├── components/          ← Shared layout components
│       │   ├── SiteLayout.tsx   ← Root layout wrapper
│       │   ├── Header.tsx       ← Top navigation bar
│       │   ├── MenuPanel.tsx    ← Slide-out sidebar menu
│       │   ├── UserMenu.tsx     ← Auth state + logout dropdown
│       │   ├── SessionStatusChip.tsx
│       │   ├── SupportChat.tsx  ← AI chat widget (Groq)
│       │   └── CommunityFab.tsx ← Floating action button
│       ├── pages/               ← Route pages (lazy loaded)
│       │   ├── HomePage.tsx
│       │   ├── SearchPage.tsx
│       │   ├── SongPage.tsx     ← Lyrics viewer + favorites
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── CommunityPage.tsx
│       │   ├── CommunityThreadPage.tsx
│       │   └── ProfilePage.tsx  ← Profile editor + favorites list
│       ├── context/
│       │   ├── AuthContext.tsx  ← SWR-based auth state
│       │   └── PreferencesContext.tsx ← Theme + reading prefs
│       ├── lib/
│       │   ├── api.ts           ← HTTP client (CSRF-aware)
│       │   └── auth.ts          ← Auth API helpers
│       └── styles/
│           └── app.css
│
├── server/                      ← Express backend root
│   └── src/
│       ├── server.ts            ← Bootstrap entry (MongoDB + HTTP)
│       ├── app.ts               ← Express app factory
│       ├── config/
│       │   ├── env.ts           ← Typed environment config
│       │   └── passport.ts      ← Google OAuth + serialize/deserialize
│       └── modules/
│           ├── auth/            ← Auth module
│           │   ├── auth.routes.ts
│           │   ├── auth.controller.ts
│           │   ├── auth.service.ts
│           │   ├── auth.guard.ts
│           │   ├── auth.rate-limit.ts
│           │   └── user.model.ts
│           ├── songs/           ← Songs module
│           │   ├── song.routes.ts
│           │   ├── song.controller.ts
│           │   ├── song.service.ts
│           │   ├── song.model.ts
│           │   └── favorite.model.ts
│           ├── community/       ← Community lyrics module
│           │   ├── community.routes.ts
│           │   ├── community.controller.ts
│           │   ├── community.service.ts
│           │   └── community.model.ts
│           ├── support/         ← AI support chat module
│           │   ├── support.routes.ts
│           │   ├── support.controller.ts
│           │   └── support.service.ts
│           └── shared/          ← Cross-module middleware & security
│               ├── middleware/
│               │   ├── error.ts
│               │   ├── rate-limit.ts
│               │   ├── request-security.ts
│               │   └── validation.ts
│               └── security/
│                   ├── input.ts ← Text normalization & sanitization
│                   └── url.ts   ← YouTube URL normalization
│
├── shared/
│   └── types.ts                 ← Shared TypeScript interfaces (client + server)
│
├── public/                      ← Static assets (legacy fallback)
├── dist/                        ← Build output
├── index.html                   ← Vite HTML template
├── vite.config.mjs
├── package.json
├── tsconfig.base.json
├── tsconfig.client.json
├── tsconfig.server.json
├── .env                         ← Local environment variables (not committed)
└── UML.md                       ← Full UML design document
```

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser (Client)                          │
│  React 19 SPA  ─  React Router v7  ─  SWR  ─  Context API   │
└───────────────────────────┬──────────────────────────────────┘
                            │ HTTP / JSON  (api/* auth/*)
┌───────────────────────────▼──────────────────────────────────┐
│               Express 5 Server (Node.js)                      │
│                                                               │
│  Helmet  ─  CORS  ─  Session  ─  Passport  ─  Rate Limit    │
│  CSRF  ─  Origin Check  ─  Dangerous-Key Rejection           │
│                                                               │
│   /api      ──►  Auth Module  (register, login, logout, me)  │
│   /auth     ──►  Google OAuth (passport-google-oauth20)       │
│   /api/songs──►  Songs Module (list, search, favorites)       │
│   /api/community ► Community Module (submissions, comments)   │
│   /api/support ──► Support Module (Groq AI chat)             │
└──────────┬──────────────────────────────────┬────────────────┘
           │ Mongoose ODM                     │ fetch()
┌──────────▼──────────────┐       ┌───────────▼────────────────┐
│    MongoDB Atlas / Local │       │     Groq API (LLM)         │
│  users, Songs, Favorites │       │   llama-3.1-8b-instant     │
│  CommunitySubmissions    │       └────────────────────────────┘
│  CommunityComments       │
│  sessions (connect-mongo)│
└─────────────────────────┘
```

The Vite dev server proxies `/api` and `/auth` requests to the Express backend during development. In production, Express serves the built React SPA as static files and handles SPA fallback routing.

---

## 🔀 Two Servers Explained

When you run `npm run dev`, **two separate servers** start at the same time:

```
npm run dev
    │
    ├──► Vite Dev Server      →  http://localhost:5173
    │    Serves: React app (HTML, JS, CSS)
    │    Knows:  Your pages, components, UI
    │    Returns: <!doctype html>...
    │
    └──► Express API Server   →  http://localhost:8888
         Serves: REST API endpoints
         Knows:  MongoDB, sessions, auth, business logic
         Returns: { "authenticated": false }
```

### What Each Port Does

| Port | Server | Purpose | Returns |
|---|---|---|---|
| **5173** | Vite Dev Server | Serves the React frontend | HTML pages |
| **8888** | Express API Server | Handles all API calls | JSON data |

### Why the Browser Works on Port 5173

When you open the app in a browser at `http://localhost:5173`, React calls `/api/me`.
Vite **automatically forwards (proxies)** that call to Express at port 8888 behind the scenes:

```
Browser  →  http://localhost:5173/api/me
                      │
               Vite sees /api/*
                      │  (proxy — configured in vite.config.mjs)
                      ▼
            http://localhost:8888/api/me
                      │
               Express handles it
                      │
                      ▼
            { "authenticated": false }  ✅
```

### Why Postman Must Use Port 8888

Postman is **not a browser**. It does not go through Vite and does not use the proxy.
It talks directly to whatever port you point it at:

```
Postman  →  http://localhost:5173/api/me
                      │
               Vite has no proxy for Postman
               Vite thinks: "Unknown path, return the React app"
                      │
                      ▼
            <!doctype html>...   ❌  WRONG — HTML, not JSON!

─────────────────────────────────────────────────────

Postman  →  http://localhost:8888/api/me
                      │
               Express handles it directly
                      │
                      ▼
            { "authenticated": false }  ✅  Correct JSON!
```

### The Simple Rule

| Tool | Use Port | Why |
|---|---|---|
| 🌐 Browser | `5173` | Vite proxies `/api/*` to Express automatically |
| 📮 Postman / curl / Thunder Client | `8000` / `8888` | Talk directly to Express — skip Vite entirely (use the PORT configured in your `.env` file) |
| 🖥️ Backend-only dev | `8000` / `8888` | Run `npm run dev:server` then test at port 8000 or 8888 |

---

## 🧩 Modules

### Auth Module

**Location:** `server/src/modules/auth/`

Handles all identity-related functionality:

- **Local Registration** — validates username (3–30 chars, lowercase, alphanumeric/dots/dashes), strong password rules (8+ chars, upper, lower, number, special char), stores bcrypt hash
- **Local Login** — password verification with bcrypt (+ transparent scrypt→bcrypt migration), lockout tracking
- **Account Lockout** — 5 failed attempts triggers a 15-minute `lockoutUntil` field on the user document
- **Google OAuth 2.0** — `passport-google-oauth20` strategy; creates new accounts or updates existing ones on each Google login
- **Session Management** — `express-session` with `connect-mongo` store; sessions last 14 days
- **Profile Updates** — PATCH `/api/me/profile` lets authenticated users update display name, first/last name, bio, tagline, and accent theme
- **Public User Shape** — `toPublicUser()` strips sensitive fields before sending to the client

**Key files:**
- `auth.service.ts` — pure business logic (hashing, validation, lockout, profile updates)
- `auth.controller.ts` — request/response handling + session lifecycle
- `user.model.ts` — Mongoose schema with 14+ fields, timestamps, role validation

---

### Songs Module

**Location:** `server/src/modules/songs/`

Manages the curated song catalogue and per-user favorites:

- **List All Songs** — `GET /api/songs` returns all songs from the `Songs` MongoDB collection
- **Search** — `GET /api/songs/search/:query` — case-insensitive regex across `Song Title`, `Artist`, and `About Song`; max 100 chars query, max 100 results
- **Song Detail** — `GET /api/songs/:id` returns a single song by MongoDB ObjectId
- **Favorites (authenticated):**
  - `GET /api/songs/favorites` — all favorited songs for current user
  - `GET /api/songs/:songId/favorite` — check if a specific song is favorited
  - `POST /api/songs/:songId/favorite` — add favorite (upsert to prevent duplicates)
  - `DELETE /api/songs/:songId/favorite` — remove favorite

**Key files:**
- `song.model.ts` — Mongoose schema mapping to the existing `Songs` collection
- `favorite.model.ts` — `Favorites` collection with compound unique index `{ userId, songId }`
- `song.service.ts` — all DB logic including safe regex search and favorites management

---

### Community Module

**Location:** `server/src/modules/community/`

User-generated lyric posts and discussions:

- **Feed** — `GET /api/community/submissions` — up to 24 published submissions (newest first); if authenticated, also returns the user's own posts
- **Thread** — `GET /api/community/submissions/:submissionId` — a single submission + up to 80 comments
- **Create Post** — `POST /api/community/submissions` — requires auth, CSRF, and submission rate limit (6 per hour). Validated fields: title, artist, description (500 chars), lyrics, released date, YouTube URL
- **Comment** — `POST /api/community/submissions/:submissionId/comments` — requires auth, CSRF, and comment rate limit (20 per 15 min). Body max 1200 chars.

Submissions and comments store a **denormalized author snapshot** (`authorLabel`, `authorRole`, `authorProfileImage`) to avoid joins on read. Comment counts are atomically incremented via `$inc`.

**Key files:**
- `community.model.ts` — two schemas: `CommunitySubmission` and `CommunityComment`
- `community.service.ts` — full CRUD with input sanitization and YouTube URL normalization

---

### Support Module

**Location:** `server/src/modules/support/`

AI-powered in-app help assistant:

- **Endpoint:** `POST /api/support/chat`
- Accepts a conversation history array `{ role: 'user' | 'assistant', content: string }[]`
- Sanitizes all inputs via `normalizePlainText()`, caps at 14 turns and 2000 chars per message
- Forwards to **Groq API** with a fixed system prompt identifying M-Music context
- Returns `{ reply: string, stub: boolean }` — `stub: true` when Groq is unavailable or unconfigured
- Gracefully degrades: if `GROQ_API_KEY` is not set, returns a helpful message pointing to search and community

---

### Shared Middleware

**Location:** `server/src/modules/shared/`

Cross-cutting security and infrastructure:

| File | Responsibility |
|---|---|
| `middleware/error.ts` | Centralized error handler — normalizes errors to JSON responses |
| `middleware/rate-limit.ts` | Per-purpose rate limiters: read (240/15min), write (80/15min), submissions (6/hr), comments (20/15min), support chat (20/15min) |
| `middleware/request-security.ts` | CSRF cookie injection, X-CSRF-Token validation, Origin/Referer trust check, dangerous key rejection (`__proto__`, `$where`, etc.) |
| `middleware/validation.ts` | `validateObjectIdParam()` for MongoDB ID params; Zod schemas + `validateRequest()` for request bodies |
| `security/input.ts` | `normalizePlainText()` — trims, strips control chars, max-length; `normalizeLyrics()` — splits/cleans lyric blocks |
| `security/url.ts` | `normalizeYouTubeUrl()` — validates and normalizes only genuine YouTube URLs |

---

## 💻 Client Architecture

The React frontend uses a **context + SWR** pattern:

### Context Providers (wrap the entire app)

| Provider | Purpose |
|---|---|
| `AuthProvider` | SWR-polls `/api/me` for session state; exposes `currentUser`, `logout()`, `refreshAuth()` |
| `PreferencesProvider` | Manages dark/light theme, lyrics font size, and scroll speed — all persisted to `localStorage` |

### Pages (lazy-loaded via React.lazy + Suspense)

| Route | Page | Features |
|---|---|---|
| `/` | `HomePage` | Browse song catalogue |
| `/search` | `SearchPage` | Live search with debounce |
| `/songs/:songId` | `SongPage` | Lyrics viewer, favorites toggle, YouTube link, reading preferences |
| `/login` | `LoginPage` | Local login form + Google OAuth button |
| `/register` | `RegisterPage` | Registration form with password rules |
| `/community` | `CommunityPage` | Community feed + new post form |
| `/community/:submissionId` | `CommunityThreadPage` | Thread view with comments |
| `/profile` | `ProfilePage` | Edit profile, change accent theme, view favorites |

### API Client (`lib/api.ts`)

All HTTP calls go through typed helper functions (`fetchJson`, `postJson`, `patchJson`, `deleteJson`) that automatically inject the `X-CSRF-Token` header from the CSRF cookie for mutating requests.

---

## 📡 API Reference

### Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/me` | — | Get current user session |
| `PATCH` | `/api/me/profile` | ✅ + CSRF | Update user profile |
| `POST` | `/api/login` | CSRF | Local login |
| `POST` | `/api/register` | CSRF | Register new account |
| `POST` | `/api/logout` | CSRF | Destroy session |
| `GET` | `/auth/google` | — | Start Google OAuth |
| `GET` | `/auth/google/callback` | — | Google OAuth callback |

### Songs

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/songs` | — | List all songs |
| `GET` | `/api/songs/search/:query` | — | Search songs |
| `GET` | `/api/songs/:id` | — | Get song by ID |
| `GET` | `/api/songs/favorites` | ✅ | Get user's favorites |
| `GET` | `/api/songs/:songId/favorite` | ✅ | Check if favorited |
| `POST` | `/api/songs/:songId/favorite` | ✅ + CSRF | Add favorite |
| `DELETE` | `/api/songs/:songId/favorite` | ✅ + CSRF | Remove favorite |

### Community

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/community/submissions` | — | List community feed |
| `GET` | `/api/community/submissions/:id` | — | Get submission + comments |
| `POST` | `/api/community/submissions` | ✅ + CSRF | Create new submission |
| `POST` | `/api/community/submissions/:id/comments` | ✅ + CSRF | Post a comment |

### Support

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/support/chat` | — | Send message to AI assistant |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Server alive check |
| `GET` | `/api/test` | — | Basic connectivity test |

---

## 📮 API Testing with Postman

> **Base URL for Postman:** `http://localhost:8888`  
> **Never use port 5173 in Postman** — that is Vite (returns HTML, not JSON).  
> See [Two Servers Explained](#-two-servers-explained) for the full explanation.

### One-Time Setup

1. Open Postman → **Settings** (gear icon)
2. Turn **ON** → `Automatically follow redirects`
3. Turn **ON** → `Send cookies`
4. Create an **Environment** variable: `base_url = http://localhost:8888`

### CSRF Workflow

The server uses a **double-submit cookie** pattern. For every `POST`, `PATCH`, or `DELETE`:

**Step 1** — Call `GET {{base_url}}/api/me` first. The server sets a cookie named `m_music.csrf`.

**Step 2** — Go to **Cookies** tab in the Postman response → copy the value of `m_music.csrf`.

**Step 3** — On every mutating request, add this **Header**:
```
Key:    X-CSRF-Token
Value:  <paste the m_music.csrf cookie value>
```

> **Where is the cookie in the browser?**  
> DevTools → Application tab → Cookies → `http://localhost:5173` → look for `m_music.csrf`.

---

### All Endpoints

#### 1. Health Check
```
GET {{base_url}}/api/health
```
```json
{ "ok": true, "service": "M-Music API", "timestamp": "2026-06-01T..." }
```

#### 2. Check Session (sets CSRF cookie — do this first!)
```
GET {{base_url}}/api/me
```
```json
{ "authenticated": false }
// or when logged in:
{ "authenticated": true, "user": { "id": "...", "username": "testuser", ... } }
```

#### 3. Register
```
POST {{base_url}}/api/register
Headers: Content-Type: application/json
         X-CSRF-Token: <from m_music.csrf cookie>
Body:
{
  "username": "testuser",
  "password": "Test@1234",
  "firstName": "Test",
  "lastName": "User"
}
```
```json
// ✅ 201 Created
{ "success": true, "user": { "id": "...", "username": "testuser", "role": "member", ... } }
// ❌ 409 Username taken
{ "message": "That username is already taken.", "success": false }
// ❌ 400 Weak password
{ "message": "Validation failed", "errors": [...], "success": false }
```

**Password rules:** min 8 chars, uppercase, lowercase, number, special character.

#### 4. Login
```
POST {{base_url}}/api/login
Headers: Content-Type: application/json
         X-CSRF-Token: <from m_music.csrf cookie>
Body:
{
  "username": "testuser",
  "password": "Test@1234"
}
```
```json
// ✅ 200 OK
{ "success": true, "user": { "id": "...", "username": "testuser", ... } }
// ❌ 401 Wrong password
{ "message": "Invalid username or password.", "success": false }
// ❌ 429 Account locked (5+ failed attempts)
{ "message": "Account is temporarily locked...", "success": false }
```

#### 5. Logout
```
POST {{base_url}}/api/logout
Headers: X-CSRF-Token: <from m_music.csrf cookie>
```
```json
// ✅ 200 OK
{ "success": true }
```

#### 6. Update Profile
```
PATCH {{base_url}}/api/me/profile
Headers: Content-Type: application/json
         X-CSRF-Token: <from m_music.csrf cookie>
Body (all fields optional):
{
  "displayName": "MuMung",
  "firstName": "Mu",
  "lastName": "Mung",
  "about": "I love music!",
  "tagline": "Rock fan",
  "accentKey": "aurora"
}
```
Valid `accentKey` values: `default` | `aurora` | `ember` | `meadow` | `slate`
```json
// ✅ 200 OK
{ "success": true, "user": { "displayName": "MuMung", "accentKey": "aurora", ... } }
```

#### 7. List All Songs
```
GET {{base_url}}/api/songs
```
```json
// ✅ 200 OK
[
  { "_id": "64abc...", "Song Title": "Bohemian Rhapsody", "Artist": "Queen", "Lyric": [...], ... }
]
```

#### 8. Search Songs
```
GET {{base_url}}/api/songs/search/queen
```
```json
// ✅ 200 OK — searches Song Title, Artist, and About Song
[ { "_id": "...", "Song Title": "Bohemian Rhapsody", "Artist": "Queen", ... } ]
// ✅ No results
[]
// ❌ 400 Query too long (>100 chars)
{ "error": "Search query must be 100 characters or fewer.", "status": 400, "success": false }
```

#### 9. Get Song by ID
```
GET {{base_url}}/api/songs/<songId>
```
```json
// ✅ 200 OK
{ "_id": "64abc...", "Song Title": "...", "Artist": "...", "Lyric": [...], ... }
// ❌ 400 Invalid ID format
{ "message": "Invalid resource identifier.", "success": false }
// ❌ 404 Not found
{ "error": "Not Found", "status": 404, "success": false }
```

#### 10. Get My Favorites
```
GET {{base_url}}/api/songs/favorites
(must be logged in)
```
```json
// ✅ 200 OK
[ { "_id": "...", "Song Title": "...", ... } ]
// ✅ Empty
[]
```

#### 11. Check If Song Is Favorited
```
GET {{base_url}}/api/songs/<songId>/favorite
(must be logged in)
```
```json
{ "isFavorited": false }
```

#### 12. Add Favorite
```
POST {{base_url}}/api/songs/<songId>/favorite
Headers: X-CSRF-Token: <from m_music.csrf cookie>
(must be logged in)
```
```json
{ "success": true }
```

#### 13. Remove Favorite
```
DELETE {{base_url}}/api/songs/<songId>/favorite
Headers: X-CSRF-Token: <from m_music.csrf cookie>
(must be logged in)
```
```json
{ "success": true }
```

#### 14. Community Feed
```
GET {{base_url}}/api/community/submissions
```
```json
// ✅ 200 OK
{
  "items": [
    {
      "_id": "64def...",
      "author": { "id": "...", "label": "testuser", "profileImage": null, "role": "member" },
      "commentCount": 3,
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "lyrics": ["Is this the real life?", "..."],
      "status": "published",
      "createdAt": "2026-06-01T..."
    }
  ],
  "mine": []   // your own posts (if logged in)
}
```

#### 15. Get Community Thread
```
GET {{base_url}}/api/community/submissions/<submissionId>
```
```json
// ✅ 200 OK
{
  "submission": { "_id": "...", "title": "...", "commentCount": 1, ... },
  "comments": [
    { "_id": "...", "author": { ... }, "body": "Great lyrics!", "createdAt": "..." }
  ]
}
```

#### 16. Create Community Post
```
POST {{base_url}}/api/community/submissions
Headers: Content-Type: application/json
         X-CSRF-Token: <from m_music.csrf cookie>
(must be logged in — rate limited: 6 per hour)
Body:
{
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "description": "One of the greatest songs ever.",
  "lyrics": "Is this the real life?\nIs this just fantasy?",
  "releasedDate": "1975",
  "youtubeUrl": "https://www.youtube.com/watch?v=fJ9rUzIMcZQ"
}
```
```json
// ✅ 201 Created
{ "submission": { "_id": "...", "title": "Bohemian Rhapsody", "commentCount": 0, ... } }
// ❌ 400 Missing title
{ "error": "Song title is required.", "status": 400, "success": false }
// ❌ 400 Bad YouTube URL
{ "error": "Only valid YouTube links are allowed.", "status": 400, "success": false }
// ❌ 429 Rate limit
{ "error": "Too many lyric submissions.", "status": 429, "success": false }
```

#### 17. Post a Comment
```
POST {{base_url}}/api/community/submissions/<submissionId>/comments
Headers: Content-Type: application/json
         X-CSRF-Token: <from m_music.csrf cookie>
(must be logged in — rate limited: 20 per 15 min)
Body:
{ "body": "This is one of my all-time favourites!" }
```
```json
// ✅ 201 Created
{ "comment": { "_id": "...", "body": "...", "author": { ... }, "createdAt": "..." } }
// ❌ 404 Submission not found
{ "error": "Community lyric post not found.", "status": 404, "success": false }
```

#### 18. AI Support Chat
```
POST {{base_url}}/api/support/chat
Headers: Content-Type: application/json
Body:
{
  "messages": [
    { "role": "user", "content": "How do I search for songs?" }
  ]
}
```
```json
// ✅ Groq configured
{ "reply": "You can search by clicking the Search icon...", "stub": false }
// ✅ Groq NOT configured (graceful fallback)
{ "reply": "The live assistant is not configured yet...", "stub": true }
```

---

### Recommended Testing Order

```
1.  GET  /api/health                                ← server alive?
2.  GET  /api/me                                    ← get CSRF cookie ⚠️ do this first
3.  GET  /api/songs                                 ← list songs (copy an _id)
4.  GET  /api/songs/search/queen                    ← test search
5.  GET  /api/songs/<id>                            ← get one song
6.  GET  /api/community/submissions                 ← community feed
7.  POST /api/register                              ← create account
8.  GET  /api/me                                    ← confirm logged in + refresh CSRF
9.  POST /api/community/submissions                 ← create a post (copy _id)
10. GET  /api/community/submissions/<id>            ← view thread
11. POST /api/community/submissions/<id>/comments   ← comment on it
12. POST /api/songs/<songId>/favorite               ← favorite a song
13. GET  /api/songs/favorites                       ← see your favorites
14. PATCH /api/me/profile                           ← edit profile
15. POST /api/support/chat                          ← test AI chat
16. POST /api/logout                                ← log out
17. GET  /api/me                                    ← confirm logged out
```

### Common Errors

| Error | Status | Fix |
|---|---|---|
| HTML returned instead of JSON | 200 | You are hitting port **5173** — change to **8888** |
| `"CSRF validation failed"` | 403 | Call `GET /api/me` first, copy `m_music.csrf` cookie → add as `X-CSRF-Token` header |
| `"Authentication is required"` | 401 | Login first with `POST /api/login` |
| `"Invalid resource identifier"` | 400 | The ID in the URL is not a valid MongoDB ObjectId |
| `"Too Many Requests"` | 429 | Wait a few minutes — you hit a rate limit |
| `ECONNREFUSED` | — | Express server not running — run `npm run dev:server` |

---

## 🔧 Environment Variables

Create a `.env` file in the project root:

```dotenv
# ── Required ──────────────────────────────────────────────────
MONGODB_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/m-music
SESSION_SECRET=a-long-random-secret-string

# ── Server ────────────────────────────────────────────────────
PORT=8888
NODE_ENV=development

# ── CORS ──────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173

# ── Google OAuth (optional) ───────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:8888/auth/google/callback

# ── AI Support Chat (optional) ────────────────────────────────
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant

# ── Rate Limits (optional — shown with defaults) ──────────────
AUTH_RATE_LIMIT_WINDOW_MS=300000       # 5 minutes
AUTH_RATE_LIMIT_MAX=5
READ_RATE_LIMIT_MAX=240
READ_RATE_LIMIT_WINDOW_MS=900000       # 15 minutes
WRITE_RATE_LIMIT_MAX=80
WRITE_RATE_LIMIT_WINDOW_MS=900000
SUBMISSION_RATE_LIMIT_MAX=6
SUBMISSION_RATE_LIMIT_WINDOW_MS=3600000  # 1 hour
COMMENT_RATE_LIMIT_MAX=20
COMMENT_RATE_LIMIT_WINDOW_MS=900000
SUPPORT_CHAT_RATE_LIMIT_MAX=20
SUPPORT_CHAT_RATE_LIMIT_WINDOW_MS=900000
```

> **Required:** `MONGODB_URL` and `SESSION_SECRET` — the server will refuse to start without them.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.19.0
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier

### Installation

```bash
# Clone or enter the project
cd "M-Music-12"

# Install all dependencies
npm install
```

### Development

```bash
npm run dev
```

This starts two concurrent processes:
- **Vite dev server** on `http://localhost:5173` (React + HMR)
- **Express server** on `http://localhost:8888` (API, watched via `tsx`)

Vite proxies `/api` and `/auth` requests to the Express server automatically.

### Production Build

```bash
npm run build
```

Builds both client (`dist/client/`) and server (`dist/server/`).

### Run Production Build

```bash
npm start
```

Express serves the React SPA from `dist/client/` and handles API routes.

---

## 📜 Scripts

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `concurrently "npm:dev:server" "npm:dev:client"` | Start full-stack dev server |
| `npm run dev:server` | `tsx watch server/src/server.ts` | Watch-mode backend only |
| `npm run dev:client` | `vite --configLoader runner` | Vite frontend only |
| `npm run build` | `npm run build:client && npm run build:server` | Full production build |
| `npm run build:client` | `vite build --configLoader runner` | Build React app to `dist/client/` |
| `npm run build:server` | `tsc -p tsconfig.server.json` | Compile TypeScript server |
| `npm run typecheck` | `npm run typecheck:client && npm run typecheck:server` | Run both TypeScript checks |
| `npm run typecheck:client` | `tsc -p tsconfig.client.json --noEmit` | Client type check |
| `npm run typecheck:server` | `tsc -p tsconfig.server.json --noEmit` | Server type check |
| `npm start` | `node dist/server/server/src/server.js` | Run production build |

> [!TIP]
> For a detailed guide on how each script works and what it compiles/targets under the hood, check out the dedicated [npmRunCommand.md](./npmRunCommand.md) reference.

---

## 🔐 Security Design

M-Music implements a layered security model:

### CSRF Protection
Double-submit cookie pattern:
1. Server sets `m_music.csrf` cookie on every request
2. Client reads the cookie and sends value as `X-CSRF-Token` header on all mutating requests (POST, PATCH, DELETE)
3. Server middleware validates that header matches cookie before processing writes

### Session Security
- `httpOnly: true` — JavaScript cannot read the session cookie
- `sameSite: 'lax'` — CSRF protection for cross-site navigations
- `secure: true` in production (HTTPS only)
- 14-day expiry with automatic cleanup via `connect-mongo` TTL

### Password Security
- **bcrypt** with cost factor 12 for all new passwords
- **Legacy scrypt** hashes (format `salt:hash`) transparently migrated to bcrypt on successful login
- Passwords never returned to the client; only the `PublicUser` shape is sent

### Account Protection
- Login rate-limited to 5 attempts per 5-minute window
- 5 consecutive failures trigger a 15-minute account lockout (`lockoutUntil` field)
- Username check uses consistent-time comparison

### Input Sanitization
- All text inputs normalized via `normalizePlainText()` — strips control characters, trims whitespace, enforces max lengths
- Community lyrics run through `normalizeLyrics()` to clean line breaks
- YouTube URLs validated and normalized via `normalizeYouTubeUrl()`
- Request bodies from MongoDB queries blocked for dangerous keys (`__proto__`, `$where`, etc.)
- Zod schemas validate the shape of all auth and profile request bodies

### HTTP Security Headers (Helmet)
- `Content-Security-Policy` with tight directives (self-only scripts, no inline, no eval)
- `X-Frame-Options: DENY` (frameAncestors: none)
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` in production

---

## 🗄 Database Collections

| Collection | Model | Purpose |
|---|---|---|
| `users` | `UserModel` | All user accounts (local + Google OAuth) |
| `Songs` | `SongModel` | Curated song catalogue with lyrics |
| `Favorites` | `FavoriteModel` | User ↔ Song favorites (compound unique index) |
| `CommunitySubmissions` | `CommunitySubmissionModel` | User-submitted lyric posts |
| `CommunityComments` | `CommunityCommentModel` | Comments on community posts |
| `sessions` | (connect-mongo) | Express session store |

### Key Indexes

- `users.googleId` — sparse unique index for OAuth lookups
- `users.username` — sparse unique index for login lookups
- `Favorites.{ userId, songId }` — compound unique index prevents duplicate favorites
- `CommunitySubmissions.{ createdAt, status }` — compound index for feed queries
- `CommunityComments.{ createdAt, status, submissionId }` — compound index for thread queries

---

## 📐 UML Design

A comprehensive UML reference is available in **[UML.md](./UML.md)**, covering:

1. **High-Level System Architecture** — browser ↔ server ↔ DB ↔ external services
2. **Package / Module Dependency Map** — full dependency graph of all source files
3. **Class Diagram** — all classes, controllers, services, models, and middleware with their methods
4. **Shared TypeScript Types** — all interfaces from `shared/types.ts`
5. **Client-Side Architecture** — providers, pages, components, and lib utilities
6. **Full API Route Map** — all routes with auth/CSRF requirements
7. **Sequence: Registration Flow**
8. **Sequence: Login Flow** (with lockout branches)
9. **Sequence: Google OAuth Flow**
10. **Sequence: Song Search Flow**
11. **Sequence: Community Post & Comment Flow**
12. **Sequence: AI Support Chat Flow**
13. **State: User Authentication States**
14. **State: Community Submission Lifecycle**
15. **Security & Middleware Layer Diagram**

---

## 👤 Author

**MuMung** — M-Music Project

---

## 📄 License

LOM — Private project license.
