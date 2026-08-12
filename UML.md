# UML Design — M-Music

A comprehensive UML reference for the M-Music full-stack application.
Covers system architecture, data models, module dependencies, API flows, and sequence diagrams.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Browser ["🌐 Browser (Client)"]
        React["React 19 SPA<br/>(Vite + TypeScript)"]
    end

    subgraph Server ["🖥️ Express Server (Node.js)"]
        App["app.ts<br/>Express Application"]
        Auth["Auth Module"]
        Songs["Songs Module"]
        Community["Community Module"]
        Support["Support Module"]
        Shared["Shared Middleware"]
    end

    subgraph DB ["🗄️ MongoDB (Atlas / Local)"]
        Users[("Users Collection")]
        SongsDB[("Songs Collection")]
        Favorites[("Favorites Collection")]
        Submissions[("CommunitySubmissions")]
        Comments[("CommunityComments")]
        Sessions[("Sessions (connect-mongo)")]
    end

    subgraph External ["🌍 External Services"]
        Google["Google OAuth 2.0"]
        Groq["Groq LLM API<br/>(llama-3.1-8b-instant)"]
    end

    React -->|"HTTP/JSON /api/* /auth/*"| App
    App --> Auth
    App --> Songs
    App --> Community
    App --> Support
    App --> Shared

    Auth --> Users
    Auth --> Sessions
    Songs --> SongsDB
    Songs --> Favorites
    Community --> Submissions
    Community --> Comments
    Support -->|"chat completions"| Groq
    Auth -->|"OAuth 2.0"| Google
```

---

## 2. Package / Module Dependency Map

```mermaid
graph LR
    subgraph shared_pkg ["shared/"]
        types["types.ts<br/>(PublicUser, SongRecord,<br/>CommunitySubmissionRecord, etc.)"]
    end

    subgraph server_pkg ["server/src/"]
        server_ts["server.ts<br/>(bootstrap + graceful shutdown)"]
        app_ts["app.ts<br/>(createApp — Express factory)"]
        env["config/env.ts"]
        passport_cfg["config/passport.ts"]

        subgraph auth_mod ["modules/auth/"]
            auth_routes["auth.routes.ts"]
            auth_ctrl["auth.controller.ts"]
            auth_svc["auth.service.ts"]
            user_model["user.model.ts"]
            auth_guard["auth.guard.ts"]
            auth_rl["auth.rate-limit.ts"]
        end

        subgraph songs_mod ["modules/songs/"]
            song_routes["song.routes.ts"]
            song_ctrl["song.controller.ts"]
            song_svc["song.service.ts"]
            song_model["song.model.ts"]
            fav_model["favorite.model.ts"]
        end

        subgraph community_mod ["modules/community/"]
            comm_routes["community.routes.ts"]
            comm_ctrl["community.controller.ts"]
            comm_svc["community.service.ts"]
            comm_model["community.model.ts"]
        end

        subgraph support_mod ["modules/support/"]
            sup_routes["support.routes.ts"]
            sup_ctrl["support.controller.ts"]
            sup_svc["support.service.ts"]
        end

        subgraph shared_mid ["modules/shared/"]
            error_mw["middleware/error.ts"]
            rl_mw["middleware/rate-limit.ts"]
            sec_mw["middleware/request-security.ts"]
            val_mw["middleware/validation.ts"]
            input_sec["security/input.ts"]
            url_sec["security/url.ts"]
        end
    end

    subgraph client_pkg ["client/src/"]
        main["main.tsx"]
        router["router.tsx"]
        auth_ctx["context/AuthContext.tsx"]
        pref_ctx["context/PreferencesContext.tsx"]
        api_lib["lib/api.ts"]
        auth_lib["lib/auth.ts"]

        subgraph components ["components/"]
            SiteLayout
            Header
            MenuPanel
            UserMenu
            SupportChat
            CommunityFab
            SessionStatusChip
        end

        subgraph pages ["pages/"]
            HomePage
            SearchPage
            SongPage
            LoginPage
            RegisterPage
            CommunityPage
            CommunityThreadPage
            ProfilePage
        end
    end

    types --> auth_svc
    types --> song_svc
    types --> comm_svc
    types --> auth_ctx
    types --> api_lib

    server_ts --> app_ts
    server_ts --> env
    app_ts --> env
    app_ts --> passport_cfg
    app_ts --> auth_routes
    app_ts --> song_routes
    app_ts --> comm_routes
    app_ts --> sup_routes
    app_ts --> error_mw
    app_ts --> rl_mw
    app_ts --> sec_mw

    auth_routes --> auth_ctrl
    auth_routes --> auth_guard
    auth_routes --> auth_rl
    auth_routes --> val_mw
    auth_routes --> sec_mw

    auth_ctrl --> auth_svc
    auth_ctrl --> user_model
    auth_svc --> user_model
    auth_svc --> input_sec
    passport_cfg --> user_model

    song_routes --> song_ctrl
    song_routes --> auth_guard
    song_routes --> val_mw
    song_routes --> sec_mw
    song_routes --> rl_mw
    song_ctrl --> song_svc
    song_svc --> song_model
    song_svc --> fav_model

    comm_routes --> comm_ctrl
    comm_routes --> auth_guard
    comm_routes --> rl_mw
    comm_routes --> sec_mw
    comm_ctrl --> comm_svc
    comm_svc --> comm_model
    comm_svc --> input_sec
    comm_svc --> url_sec

    sup_routes --> sup_ctrl
    sup_ctrl --> sup_svc
    sup_svc --> input_sec
    sup_svc --> env

    main --> router
    main --> auth_ctx
    main --> pref_ctx
    router --> SiteLayout
    router --> pages
    SiteLayout --> Header
    SiteLayout --> MenuPanel
    SiteLayout --> SupportChat
    Header --> UserMenu
    Header --> SessionStatusChip
    pages --> auth_ctx
    pages --> api_lib
    pages --> pref_ctx
```

---

## 3. Class Diagram — All Modules

```mermaid
classDiagram
    %% ── Configuration ───────────────────────────────────────────────
    class EnvConfig {
        +port: number
        +isProduction: boolean
        +mongodbUrl: string
        +sessionSecret: string
        +sessionCookieName: string
        +csrfCookieName: string
        +corsAllowedOrigins: Set~string~
        +googleClientId: string
        +googleClientSecret: string
        +googleCallbackUrl: string
        +groqApiKey: string
        +groqModel: string
        +authRateLimitWindowMs: number
        +authRateLimitMax: number
        +readRateLimitMax: number
        +writeRateLimitMax: number
        +submissionRateLimitMax: number
        +commentRateLimitMax: number
        +supportChatRateLimitMax: number
    }

    class PassportConfig {
        +initializePassport() void
        -serializeUser(user, done) void
        -deserializeUser(id, done) void
    }

    %% ── Server Bootstrap ────────────────────────────────────────────
    class Bootstrap {
        +connectMongo() Promise~void~
        +bootstrap() Promise~void~
        +shutdown(signal: string) void
    }

    class AppFactory {
        +createApp() Express
        -configureHelmet() void
        -configureCors() void
        -configureSession() void
        -configurePassport() void
        -configureRoutes() void
        -configureStaticFiles() void
        -configureSpa() void
    }

    %% ── Auth Module ─────────────────────────────────────────────────
    class AuthApiRouter {
        +GET /api/me
        +PATCH /api/me/profile
        +POST /api/logout
        +POST /api/register
        +POST /api/login
    }

    class AuthOAuthRouter {
        +GET /auth/google
        +GET /auth/google/callback
        +GET /auth/google/failure
    }

    class AuthController {
        +getCurrentUser(req, res, next) Promise~void~
        +updateProfile(req, res, next) Promise~void~
        +register(req, res, next) Promise~void~
        +login(req, res, next) Promise~void~
        +logout(req, res, next) void
        +logoutJson(req, res, next) void
        +startGoogleAuth(req, res, next) void
        +finishGoogleAuth(req, res) void
        +googleFailure(req, res) void
        -createLocalSession(req, userId) Promise~void~
        -completeLogout(req, res, next, options) void
        -isSafeReturnPath(value) boolean
    }

    class AuthService {
        +validateRegistrationPayload(payload) ValidationResult
        +validateLoginPayload(payload) ValidationResult
        +validateProfileUpdatePayload(payload) ValidationResult
        +applyProfileUpdates(user, data) void
        +hashPassword(password) string
        +verifyPassword(password, storedValue) boolean
        +isLegacyScryptHash(value) boolean
        +validatePassword(password) object
        +toPublicUser(user) PublicUser
        +isUserLockedOut(user) boolean
        +incrementFailedLoginAttempts(user) void
        +resetFailedLoginAttempts(user) void
        +normalizeUsername(value) string
        +normalizeName(value) string
    }

    class AuthGuard {
        +requireAuthenticatedUser(req, res, next) void
    }

    class AuthRateLimit {
        +authWriteLimiter: RateLimitHandler
    }

    %% ── User Model ──────────────────────────────────────────────────
    class UserModel {
        +googleId: String
        +username: String
        +password: String
        +firstName: String
        +lastName: String
        +displayName: String
        +profileImage: String
        +emails: Mixed[]
        +name: Mixed
        +role: member|moderator|admin
        +about: String
        +tagline: String
        +accentKey: ProfileAccent
        +failedLoginAttempts: Number
        +lockoutUntil: Date
        +createdAt: Date
        +updatedAt: Date
    }

    %% ── Songs Module ────────────────────────────────────────────────
    class SongsRouter {
        +GET /api/songs
        +GET /api/songs/search/:query
        +GET /api/songs/favorites
        +GET /api/songs/:songId/favorite
        +POST /api/songs/:songId/favorite
        +DELETE /api/songs/:songId/favorite
        +GET /api/songs/:id
    }

    class SongController {
        +listSongsHandler(req, res, next) Promise~void~
        +searchSongsHandler(req, res, next) Promise~void~
        +getSongByIdHandler(req, res, next) Promise~void~
        +addFavoriteHandler(req, res, next) Promise~void~
        +removeFavoriteHandler(req, res, next) Promise~void~
        +getUserFavoritesHandler(req, res, next) Promise~void~
        +isSongFavoritedHandler(req, res, next) Promise~void~
    }

    class SongService {
        +listSongs() Promise~SongRecord[]~
        +searchSongs(query, limit) Promise~SongRecord[]~
        +getSongById(id) Promise~SongRecord|null~
        +addFavorite(userId, songId) Promise~void~
        +removeFavorite(userId, songId) Promise~void~
        +getUserFavorites(userId) Promise~SongRecord[]~
        +isSongFavorited(userId, songId) Promise~boolean~
        -escapeRegex(value) string
        -normalizeSearchQuery(value) string
        -parseLimit(value) number
        -toSongRecord(song) SongRecord
    }

    class SongModel {
        +Song Title: String
        +Artist: String
        +Released Date: String
        +About Song: String
        +Direct to YT: String
        +Lyric: String[]
        +albumCover: String
    }

    class FavoriteModel {
        +userId: String
        +songId: String
        +createdAt: Date
    }

    %% ── Community Module ────────────────────────────────────────────
    class CommunityRouter {
        +GET /api/community/submissions
        +GET /api/community/submissions/:submissionId
        +POST /api/community/submissions
        +POST /api/community/submissions/:submissionId/comments
    }

    class CommunityController {
        +listCommunityFeedHandler(req, res, next) Promise~void~
        +getCommunitySubmissionDetailsHandler(req, res, next) Promise~void~
        +createCommunitySubmissionHandler(req, res, next) Promise~void~
        +createCommunityCommentHandler(req, res, next) Promise~void~
    }

    class CommunityService {
        +listCommunityFeed(currentUser) Promise~CommunityFeedResponse~
        +getCommunitySubmissionDetails(id) Promise~CommunitySubmissionDetailResponse|null~
        +createCommunitySubmission(payload, user) Promise~CommunitySubmissionRecord~
        +createCommunityComment(submissionId, payload, user) Promise~CommunityCommentRecord~
        -validateSubmissionPayload(payload) object
        -validateCommentPayload(payload) object
        -getUserLabel(user) string
        -toCommunityAuthor(record) CommunityAuthor
        -toSubmissionRecord(record) CommunitySubmissionRecord
        -toCommentRecord(record) CommunityCommentRecord
    }

    class CommunitySubmissionModel {
        +title: String
        +artist: String
        +description: String
        +lyrics: String[]
        +releasedDate: String
        +youtubeUrl: String
        +status: published|removed
        +commentCount: Number
        +authorId: ObjectId
        +authorLabel: String
        +authorProfileImage: String
        +authorRole: member|moderator|admin
        +createdAt: Date
        +updatedAt: Date
    }

    class CommunityCommentModel {
        +body: String
        +status: published|removed
        +submissionId: ObjectId
        +authorId: ObjectId
        +authorLabel: String
        +authorProfileImage: String
        +authorRole: member|moderator|admin
        +createdAt: Date
        +updatedAt: Date
    }

    %% ── Support Module ──────────────────────────────────────────────
    class SupportRouter {
        +POST /api/support/chat
    }

    class SupportController {
        +supportChatHandler(req, res, next) Promise~void~
    }

    class SupportService {
        +runSupportChat(turns) Promise~SupportChatResult~
        -sanitizeTurns(raw) SupportChatTurn[]
    }

    %% ── Shared Middleware ───────────────────────────────────────────
    class ErrorMiddleware {
        +errorHandler(err, req, res, next) void
    }

    class RateLimitMiddleware {
        +apiReadLimiter: RateLimitHandler
        +apiWriteLimiter: RateLimitHandler
        +communitySubmissionLimiter: RateLimitHandler
        +communityCommentLimiter: RateLimitHandler
    }

    class RequestSecurityMiddleware {
        +ensureCsrfTokenCookie(req, res, next) void
        +rejectDangerousRequestKeys(req, res, next) void
        +requireCsrfToken(req, res, next) void
        +requireTrustedOrigin(req, res, next) void
    }

    class ValidationMiddleware {
        +validateObjectIdParam(paramName) RequestHandler
        +validateRequest(schema) RequestHandler
        +loginSchema: ZodSchema
        +registerSchema: ZodSchema
        +profileUpdateSchema: ZodSchema
    }

    class InputSecurity {
        +normalizePlainText(value, opts) string
        +normalizeLyrics(value) string[]
    }

    class UrlSecurity {
        +normalizeYouTubeUrl(value) string
    }

    %% ── Relationships ───────────────────────────────────────────────
    Bootstrap --> AppFactory : creates
    AppFactory --> AuthApiRouter : mounts /api
    AppFactory --> AuthOAuthRouter : mounts /auth
    AppFactory --> SongsRouter : mounts /api/songs
    AppFactory --> CommunityRouter : mounts /api/community
    AppFactory --> SupportRouter : mounts /api/support
    AppFactory --> PassportConfig : initializes
    AppFactory --> ErrorMiddleware : uses
    AppFactory --> RateLimitMiddleware : uses
    AppFactory --> RequestSecurityMiddleware : uses

    AuthApiRouter --> AuthController : delegates
    AuthOAuthRouter --> AuthController : delegates
    AuthApiRouter --> AuthGuard : guards
    AuthApiRouter --> AuthRateLimit : rate-limits
    AuthApiRouter --> ValidationMiddleware : validates

    AuthController --> AuthService : uses
    AuthController --> UserModel : reads/writes
    AuthService --> UserModel : reads/writes
    AuthService --> InputSecurity : uses
    PassportConfig --> UserModel : reads/writes

    SongsRouter --> SongController : delegates
    SongsRouter --> AuthGuard : guards favorites
    SongsRouter --> ValidationMiddleware : validates id param
    SongsRouter --> RequestSecurityMiddleware : secures writes
    SongController --> SongService : uses
    SongService --> SongModel : reads
    SongService --> FavoriteModel : reads/writes

    CommunityRouter --> CommunityController : delegates
    CommunityRouter --> AuthGuard : guards writes
    CommunityRouter --> RateLimitMiddleware : rate-limits
    CommunityRouter --> RequestSecurityMiddleware : secures writes
    CommunityController --> CommunityService : uses
    CommunityService --> CommunitySubmissionModel : reads/writes
    CommunityService --> CommunityCommentModel : reads/writes
    CommunityService --> InputSecurity : uses
    CommunityService --> UrlSecurity : uses

    SupportRouter --> SupportController : delegates
    SupportController --> SupportService : uses
    SupportService --> InputSecurity : uses
    SupportService --> EnvConfig : reads groqApiKey

    AuthController ..> EnvConfig : reads session/cookie names
```

---

## 4. Shared TypeScript Types (shared/types.ts)

```mermaid
classDiagram
    class PublicUser {
        +id: string
        +username: string | null
        +displayName: string | null
        +firstName: string | null
        +lastName: string | null
        +profileImage: string | null
        +authProvider: google | local
        +role: admin | member | moderator
        +createdAt: string
        +about: string | null
        +accentKey: ProfileAccent
        +tagline: string | null
    }

    class SongRecord {
        +_id: string
        +Song Title: string
        +Artist: string
        +Released Date: string
        +About Song: string
        +Direct to YT: string
        +Lyric: string[]
        +albumCover: string
    }

    class CommunitySubmissionRecord {
        +_id: string
        +author: CommunityAuthor
        +commentCount: number
        +createdAt: string
        +description: string
        +lyrics: string[]
        +releasedDate: string
        +status: published | removed
        +title: string
        +artist: string
        +youtubeUrl: string
    }

    class CommunityCommentRecord {
        +_id: string
        +author: CommunityAuthor
        +body: string
        +createdAt: string
        +submissionId: string
    }

    class CommunityAuthor {
        +id: string
        +label: string
        +profileImage: string | null
        +role: admin | member | moderator
    }

    class AuthStatusResponse {
        +authenticated: boolean
        +user?: PublicUser
    }

    class AuthMutationResponse {
        +success: boolean
        +user?: PublicUser
        +message?: string
        +status?: number
        +error?: string
        +retryAfterSeconds?: number
    }

    class ProfileUpdateRequest {
        +about?: string
        +accentKey?: ProfileAccent
        +displayName?: string | null
        +firstName?: string
        +lastName?: string
        +tagline?: string
    }

    class SupportChatRequest {
        +messages: Array
    }

    class SupportChatResponse {
        +reply: string
        +stub: boolean
    }

    class FavoriteResponse {
        +isFavorited: boolean
    }

    AuthStatusResponse --> PublicUser
    AuthMutationResponse --> PublicUser
    CommunitySubmissionRecord --> CommunityAuthor
    CommunityCommentRecord --> CommunityAuthor
```

---

## 5. Client-Side Architecture

```mermaid
graph TD
    subgraph Entry ["Entry Point"]
        main["main.tsx<br/>(React 19 root)"]
    end

    subgraph Providers ["Context Providers (wraps app)"]
        AuthProvider["AuthProvider<br/>(AuthContext.tsx)<br/>— SWR /api/me<br/>— currentUser, logout, refreshAuth"]
        PrefProvider["PreferencesProvider<br/>(PreferencesContext.tsx)<br/>— theme dark/light<br/>— fontSize, scrollSpeed<br/>— localStorage persisted"]
    end

    subgraph Router ["React Router v7"]
        BrowserRouter["createBrowserRouter"]
        SiteLayout["SiteLayout.tsx<br/>(root layout wrapper)"]
    end

    subgraph Layout ["Layout Components"]
        Header["Header.tsx<br/>— nav links<br/>— UserMenu / SessionStatusChip<br/>— theme toggle"]
        MenuPanel["MenuPanel.tsx<br/>— slide-out sidebar"]
        UserMenu["UserMenu.tsx<br/>— auth state display<br/>— logout action"]
        SessionChip["SessionStatusChip.tsx<br/>— logged-in badge"]
        SupportChat["SupportChat.tsx<br/>— Groq-powered chat UI<br/>— POST /api/support/chat"]
        CommunityFab["CommunityFab.tsx<br/>— floating action button"]
    end

    subgraph Pages ["Pages (lazy-loaded)"]
        HomePage["HomePage<br/>/ — song list"]
        SearchPage["SearchPage<br/>/search — search results"]
        SongPage["SongPage<br/>/songs/:songId — lyrics view<br/>— favorites toggle"]
        LoginPage["LoginPage<br/>/login — form + Google OAuth"]
        RegisterPage["RegisterPage<br/>/register — form"]
        CommunityPage["CommunityPage<br/>/community — feed + new post"]
        CommunityThread["CommunityThreadPage<br/>/community/:submissionId<br/>— thread + comments"]
        ProfilePage["ProfilePage<br/>/profile — edit profile<br/>— accent theme picker<br/>— favorites list"]
    end

    subgraph Lib ["Library / Utilities"]
        ApiLib["lib/api.ts<br/>— fetchJson, postJson<br/>— patchJson, deleteJson<br/>— CSRF token injection"]
        AuthLib["lib/auth.ts<br/>— login(), register()<br/>— helper wrappers"]
    end

    main --> AuthProvider
    main --> PrefProvider
    main --> BrowserRouter
    BrowserRouter --> SiteLayout
    SiteLayout --> Header
    SiteLayout --> MenuPanel
    SiteLayout --> SupportChat
    SiteLayout --> CommunityFab
    SiteLayout --> Pages
    Header --> UserMenu
    Header --> SessionChip
    Pages --> ApiLib
    Pages --> AuthProvider
    Pages --> PrefProvider
    AuthLib --> ApiLib
```

---

## 6. Route Map (Full API)

```mermaid
graph LR
    subgraph Auth ["/api — Auth"]
        me["GET /api/me"]
        meProfile["PATCH /api/me/profile<br/>🔒 auth + CSRF"]
        logout["POST /api/logout<br/>🔒 CSRF"]
        register["POST /api/register<br/>🔒 CSRF + rate-limit"]
        login["POST /api/login<br/>🔒 CSRF + rate-limit"]
    end

    subgraph OAuth ["/auth — Google OAuth"]
        googleStart["GET /auth/google"]
        googleCallback["GET /auth/google/callback"]
        googleFailure["GET /auth/google/failure"]
    end

    subgraph Songs ["/api/songs — Songs"]
        listSongs["GET /api/songs"]
        searchSongs["GET /api/songs/search/:query"]
        getFavs["GET /api/songs/favorites<br/>🔒 auth"]
        getFavStatus["GET /api/songs/:songId/favorite<br/>🔒 auth"]
        addFav["POST /api/songs/:songId/favorite<br/>🔒 auth + CSRF"]
        removeFav["DELETE /api/songs/:songId/favorite<br/>🔒 auth + CSRF"]
        getSong["GET /api/songs/:id"]
    end

    subgraph Community ["/api/community — Community"]
        listFeed["GET /api/community/submissions"]
        getThread["GET /api/community/submissions/:submissionId"]
        postThread["POST /api/community/submissions<br/>🔒 auth + CSRF + rate-limit"]
        postComment["POST /api/community/submissions/:submissionId/comments<br/>🔒 auth + CSRF + rate-limit"]
    end

    subgraph Support ["/api/support — Support"]
        chat["POST /api/support/chat<br/>🔒 rate-limit"]
    end
```

---

## 7. Sequence Diagram — User Registration Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as React App
    participant API as Express /api/register
    participant Validation as ValidationMiddleware (Zod)
    participant RateLimit as AuthRateLimiter
    participant CSRF as CsrfMiddleware
    participant Controller as AuthController
    participant Service as AuthService
    participant MongoDB as MongoDB (users)
    participant Session as MongoStore (sessions)

    User->>Client: Fill in register form (username, password, firstName, lastName)
    Client->>API: POST /api/register { username, password, firstName, lastName }
    API->>CSRF: Check X-CSRF-Token header & cookie
    CSRF-->>API: ✅ Token valid
    API->>RateLimit: Check auth write rate limit
    RateLimit-->>API: ✅ Under limit
    API->>Validation: Validate Zod registerSchema
    Validation-->>API: ✅ Payload valid
    API->>Controller: register(req, res, next)
    Controller->>MongoDB: findOne({ username })
    MongoDB-->>Controller: null (username free)
    Controller->>Service: hashPassword(password) → bcrypt hash
    Controller->>MongoDB: create({ username, firstName, lastName, password })
    MongoDB-->>Controller: UserDocument
    Controller->>Session: session.regenerate() → set userId
    Session-->>Controller: ✅ New session created
    Controller->>Client: 201 { success: true, user: PublicUser }
    Client->>User: Redirect to home / show profile
```

---

## 8. Sequence Diagram — Login Flow (Local Auth)

```mermaid
sequenceDiagram
    actor User
    participant Client as React App
    participant API as Express /api/login
    participant CSRF as CsrfMiddleware
    participant RL as AuthRateLimiter
    participant Controller as AuthController
    participant Service as AuthService
    participant MongoDB as MongoDB (users)
    participant Session as MongoStore

    User->>Client: Enter username & password
    Client->>API: POST /api/login { username, password }
    API->>CSRF: Validate CSRF token
    CSRF-->>API: ✅
    API->>RL: Rate limit check
    RL-->>API: ✅
    API->>Controller: login(req, res, next)
    Controller->>MongoDB: findOne({ username })
    MongoDB-->>Controller: UserDocument

    alt User locked out
        Controller->>Client: 429 Account temporarily locked
    else Wrong password
        Controller->>Service: verifyPassword(password, hash)
        Service-->>Controller: ❌ false
        Controller->>Service: incrementFailedLoginAttempts(user)
        Controller->>MongoDB: user.save()
        Controller->>Client: 401 Invalid username or password
    else Correct password
        Controller->>Service: verifyPassword(password, hash)
        Service-->>Controller: ✅ true
        Controller->>Service: resetFailedLoginAttempts(user)
        opt Legacy scrypt hash
            Controller->>Service: hashPassword(password) re-hash with bcrypt
            Controller->>MongoDB: user.save()
        end
        Controller->>Session: createLocalSession(userId)
        Session-->>Controller: ✅ Session set
        Controller->>Client: 200 { success: true, user: PublicUser }
    end
```

---

## 9. Sequence Diagram — Google OAuth Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as React App
    participant OAuth as /auth/google
    participant Google as Google OAuth 2.0
    participant Callback as /auth/google/callback
    participant Passport as PassportConfig
    participant MongoDB as MongoDB (users)
    participant Session as MongoStore

    User->>Client: Click "Sign in with Google"
    Client->>OAuth: GET /auth/google?returnTo=/profile
    OAuth->>Session: Store returnTo in session
    OAuth->>Google: Redirect to Google consent screen
    Google-->>User: Show consent screen
    User->>Google: Grant permission
    Google->>Callback: Redirect with auth code
    Callback->>Passport: passport.authenticate('google')
    Passport->>Google: Exchange code for tokens + profile
    Google-->>Passport: Profile (id, name, email, photo)
    Passport->>MongoDB: findOne({ googleId: profile.id })

    alt New user
        MongoDB-->>Passport: null
        Passport->>MongoDB: create({ googleId, displayName, emails, profileImage })
        MongoDB-->>Passport: New UserDocument
    else Existing user
        MongoDB-->>Passport: UserDocument
        Passport->>MongoDB: user.save() (update profile)
    end

    Passport->>Session: req.logIn(user) → serialize userId
    Session-->>Callback: ✅ Session created
    Callback->>Client: Redirect to returnTo path
```

---

## 10. Sequence Diagram — Song Search Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as React App (SearchPage)
    participant API as GET /api/songs/search/:query
    participant RL as ReadRateLimiter
    participant Controller as SongController
    participant Service as SongService
    participant MongoDB as MongoDB (Songs collection)

    User->>Client: Type search query in input
    Client->>Client: Debounce / trigger on submit
    Client->>API: GET /api/songs/search/bohemian%20rhapsody
    API->>RL: Check read rate limit (240 req / 15min)
    RL-->>API: ✅
    API->>Controller: searchSongsHandler(req, res, next)
    Controller->>Service: searchSongs(query, limit)
    Service->>Service: normalizeSearchQuery(query)
    Service->>Service: escapeRegex(query) → safe regex
    Service->>MongoDB: find({ $or: [Song Title, Artist, About Song] regex })
    MongoDB-->>Service: SongDocument[]
    Service->>Service: toSongRecord() for each
    Service-->>Controller: SongRecord[]
    Controller->>Client: 200 { songs: SongRecord[] }
    Client->>User: Display search results grid
```

---

## 11. Sequence Diagram — Community Post & Comment Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as React App (CommunityPage)
    participant API as POST /api/community/submissions
    participant Guard as AuthGuard
    participant CSRF as CsrfMiddleware
    participant RL as SubmissionRateLimiter
    participant Controller as CommunityController
    participant Service as CommunityService
    participant MongoDB as MongoDB (CommunitySubmissions)

    User->>Client: Fill post form (title, artist, lyrics, youtube url)
    Client->>API: POST /api/community/submissions { title, artist, lyrics, ... }
    API->>Guard: requireAuthenticatedUser
    Guard-->>API: ✅ User authenticated
    API->>CSRF: Check CSRF token
    CSRF-->>API: ✅
    API->>RL: Check submission rate limit (6 per hour)
    RL-->>API: ✅
    API->>Controller: createCommunitySubmissionHandler
    Controller->>Service: createCommunitySubmission(payload, user)
    Service->>Service: validateSubmissionPayload()
    Service->>Service: normalizePlainText() / normalizeLyrics()
    Service->>Service: normalizeYouTubeUrl()
    Service->>MongoDB: CommunitySubmissionModel.create({ ...validated, authorId, ... })
    MongoDB-->>Service: CommunitySubmissionDocument
    Service->>Service: toSubmissionRecord()
    Service-->>Controller: CommunitySubmissionRecord
    Controller->>Client: 201 { submission: CommunitySubmissionRecord }
    Client->>User: Post appears in community feed

    note over User, MongoDB: Comment flow (POST /api/community/submissions/:id/comments)
    User->>Client: Type comment and submit
    Client->>API: POST /api/community/submissions/:submissionId/comments { body }
    API->>Guard: requireAuthenticatedUser ✅
    API->>CSRF: CSRF check ✅
    API->>RL: commentRateLimiter (20/15min) ✅
    API->>Service: createCommunityComment(submissionId, payload, user)
    Service->>MongoDB: findOne submission ✅
    Service->>MongoDB: CommunityCommentModel.create()
    Service->>MongoDB: updateOne submission $inc commentCount
    Controller->>Client: 201 { comment: CommunityCommentRecord }
```

---

## 12. Sequence Diagram — AI Support Chat Flow

```mermaid
sequenceDiagram
    actor User
    participant Client as SupportChat.tsx
    participant API as POST /api/support/chat
    participant Controller as SupportController
    participant Service as SupportService
    participant Input as InputSecurity
    participant Groq as Groq API (llama-3.1-8b-instant)

    User->>Client: Type question in chat widget
    Client->>API: POST /api/support/chat { messages: [{role, content}] }
    API->>Controller: supportChatHandler
    Controller->>Service: runSupportChat(turns)
    Service->>Input: normalizePlainText() each message (max 2000 chars)
    Service->>Service: Limit to 14 messages max

    alt GROQ_API_KEY not configured
        Service->>Client: { reply: "not configured", stub: true }
    else API key present
        Service->>Groq: POST /openai/v1/chat/completions<br/>{ model, messages: [system + sanitized], max_tokens: 512 }
        Groq-->>Service: { choices: [{ message: { content } }] }
        Service->>Input: normalizePlainText(content, maxLength 4000)
        Service-->>Controller: { reply, stub: false }
        Controller->>Client: 200 { reply, stub }
        Client->>User: Display assistant reply in chat bubble
    end
```

---

## 13. State Diagram — User Authentication States

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated : App loads

    Unauthenticated --> LoggingIn : User submits login form
    Unauthenticated --> Registering : User submits register form
    Unauthenticated --> GoogleOAuth : User clicks "Sign in with Google"

    LoggingIn --> Authenticated : ✅ Credentials valid → session created
    LoggingIn --> Unauthenticated : ❌ Invalid credentials
    LoggingIn --> LockedOut : ❌ Too many failed attempts (5+)

    Registering --> Authenticated : ✅ Account created → session created
    Registering --> Unauthenticated : ❌ Username taken or validation error

    GoogleOAuth --> Authenticated : ✅ Google profile verified → session created
    GoogleOAuth --> Unauthenticated : ❌ OAuth error or denied

    LockedOut --> Unauthenticated : 15-minute lockout expires

    Authenticated --> ProfileUpdate : User edits profile (/profile)
    ProfileUpdate --> Authenticated : ✅ Profile saved

    Authenticated --> FavoriteToggle : User favorites/unfavorites song
    FavoriteToggle --> Authenticated : ✅ Favorite state updated

    Authenticated --> CommunityPost : User creates community post
    CommunityPost --> Authenticated : ✅ Post published

    Authenticated --> Unauthenticated : POST /api/logout → session destroyed
```

---

## 14. State Diagram — Community Submission Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft : User fills in community form

    Draft --> Validating : User submits
    Validating --> Draft : ❌ Validation error (empty title, bad URL, etc.)
    Validating --> Published : ✅ Saved to DB with status=published

    Published --> Commented : Other users post comments
    Commented --> Published : Comments increment commentCount

    Published --> Removed : Moderator/admin removes post (status=removed)
    Removed --> [*]
```

---

## 15. Security & Middleware Layer Diagram

```mermaid
flowchart TD
    Request["Incoming HTTP Request"] --> Morgan["Morgan Logger"]
    Morgan --> Helmet["Helmet\n(CSP, HSTS, XSS protection)"]
    Helmet --> CORS["CORS\n(allowedHeaders, credentials, origin whitelist)"]
    CORS --> BodyParser["Body Parser\n(JSON + urlencoded, 50kb limit)"]
    BodyParser --> Session["express-session\n(MongoStore, httpOnly, sameSite: lax)"]
    Session --> PassportInit["Passport.initialize + session()"]
    PassportInit --> CsrfCookie["ensureCsrfTokenCookie\n(set CSRF cookie on first request)"]
    CsrfCookie --> DangerousKeys["rejectDangerousRequestKeys\n(block __proto__, $where, etc.)"]

    DangerousKeys --> RouteSelector{Route Type}

    RouteSelector -->|"GET /api/*"| ReadRL["apiReadLimiter\n(240 req / 15 min)"]
    RouteSelector -->|"POST/PATCH/DELETE /api/*"| WriteRL["apiWriteLimiter\n(80 req / 15 min)"]

    ReadRL --> Routes["Route Handler"]
    WriteRL --> TrustedOrigin["requireTrustedOrigin\n(check Origin/Referer header)"]
    TrustedOrigin --> CsrfCheck["requireCsrfToken\n(X-CSRF-Token == cookie)"]
    CsrfCheck --> AuthCheck{"requireAuthenticatedUser?"}
    AuthCheck -->|"Protected route"| AuthGuard["AuthGuard\n(check req.user or session.userId)"]
    AuthCheck -->|"Public route"| RouteLogic["Route Logic"]
    AuthGuard --> RouteLogic

    RouteLogic --> ErrorHandler["errorHandler\n(normalize & send error JSON)"]
    RouteLogic --> Response["HTTP Response"]
```

---

## Notes

- **Entry Point:** `server/src/server.ts` → `bootstrap()` connects MongoDB, then calls `createApp()`.
- **Frontend Entry:** `client/src/main.tsx` → wraps `<AuthProvider>` + `<PreferencesProvider>` around the React Router.
- **Auth Strategy:** Local (bcrypt) + Google OAuth 2.0 (passport-google-oauth20). Legacy scrypt hashes are transparently migrated to bcrypt on login.
- **Account Lockout:** 5 failed login attempts → 15-minute lockout stored in `user.lockoutUntil`.
- **CSRF Protection:** Double-submit cookie pattern — server sets `m_music.csrf` cookie; client reads it and sends as `X-CSRF-Token` header on all mutating requests.
- **Rate Limiting:** Separate limiters for auth writes, API reads, API writes, community submissions, community comments, and support chat.
- **Favorites:** Stored in a separate `Favorites` collection with a compound unique index `{ userId, songId }`.
- **Community:** Both submissions and comments carry a denormalized `authorLabel` / `authorRole` snapshot for display without additional joins.
- **AI Support Chat:** Powered by Groq (llama-3.1-8b-instant). Gracefully degrades with `stub: true` if `GROQ_API_KEY` is absent.
- **Shared Types:** `shared/types.ts` is compiled by both `tsconfig.client.json` and `tsconfig.server.json` ensuring consistent TS contracts across the full stack.
- **Session Store:** Sessions are persisted in MongoDB via `connect-mongo` with a 14-day TTL.
