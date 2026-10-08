# M-Music-Web-App API

## API List

- GET /api/me
- PATCH /api/me/profile
- POST /api/me/profile-image
- DELETE /api/me/profile-image
- POST /api/logout
- POST /api/register
- POST /api/login
- GET /auth/google
- GET /auth/google/callback
- GET /auth/google/failure
- GET /api/songs
- GET /api/songs/browse
- GET /api/songs/search
- GET /api/songs/search/:query
- GET /api/songs/favorites
- GET /api/songs/:songId/favorite
- POST /api/songs/:songId/favorite
- DELETE /api/songs/:songId/favorite
- GET /api/songs/:id
- POST /api/support/chat
- GET /api/health

## API Details

### GET /api/me
- request: none
- response:

```json
{
  "status": true,
  "authenticated": true,
  "user": {
    "id": "string",
    "username": "string | null",
    "displayName": "string | null",
    "firstName": "string | null",
    "lastName": "string | null",
    "profileImage": "string | null",
    "authProvider": "google | local",
    "role": "admin | member | moderator | user",
    "createdAt": "string",
    "about": "string | null",
    "accentKey": "default | aurora | ember | meadow | slate",
    "tagline": "string | null"
  }
}
```

### PATCH /api/me/profile
- request:

```json
{
  "displayName": "string (optional, max 50)",
  "firstName": "string | null (optional, max 50)",
  "lastName": "string | null (optional, max 50)",
  "about": "string (optional, max 1600)",
  "tagline": "string (optional, max 140)",
  "accentKey": "default | aurora | ember | meadow | slate (optional)"
}
```

- response:

```json
{
  "status": true,
  "user": { "PublicUser": "same as GET /api/me" }
}
```

### POST /api/me/profile-image
- request: `multipart/form-data` with field `image` (image file, max 5MB)
- response:

```json
{
  "status": true,
  "message": "Profile image uploaded successfully.",
  "data": {
    "publicId": "string",
    "url": "string",
    "user": { "PublicUser": "same as GET /api/me" }
  }
}
```

### DELETE /api/me/profile-image
- request: none
- response:

```json
{
  "status": true,
  "message": "Profile image removed successfully.",
  "data": {
    "user": { "PublicUser": "same as GET /api/me" }
  }
}
```

### POST /api/logout
- request: none
- response:

```json
{ "status": true }
```

### POST /api/register
- request:

```json
{
  "username": "string (3-30, a-z 0-9 . _ -)",
  "email": "string (email, max 100)",
  "password": "string (min 8, max 128)",
  "firstName": "string (max 50)",
  "lastName": "string (max 50)"
}
```

- response (201):

```json
{
  "status": true,
  "user": { "PublicUser": "same as GET /api/me" }
}
```

### POST /api/login
- request:

```json
{
  "username": "string (username or email, 3-100)",
  "password": "string (max 128)"
}
```

- response:

```json
{
  "status": true,
  "user": { "PublicUser": "same as GET /api/me" }
}
```

### GET /auth/google
- request: query `returnTo?: string`
- response: `302 redirect` to Google OAuth

### GET /auth/google/callback
- request: query `state?: string` (returnTo)
- response: `302 redirect` to returnTo path

### GET /auth/google/failure
- request: none
- response:

```json
{
  "message": "Google authentication failed.",
  "status": false
}
```

### GET /api/songs
- request: none
- response:

```json
[
  {
    "_id": "string",
    "Song Title": "string",
    "Artist": "string",
    "Released Date": "string",
    "About Song": "string",
    "Direct to YT": "string",
    "Lyric": ["string"],
    "albumCover": "string",
    "category": ["string"],
    "language": "string"
  }
]
```

### GET /api/songs/browse
- request: query `q?: string`, `category?: string`, `language?: string`, `limit?: number`, `page?: number`
- response:

```json
{
  "songs": ["SongRecord same as GET /api/songs"],
  "counts": { "found": 0, "total": 0 },
  "pagination": { "page": 1, "limit": 20, "totalItems": 0, "totalPages": 1 }
}
```

### GET /api/songs/search
- request: query `q?: string`, `category?: string`, `limit?: number`
- response:

```json
["SongRecord same as GET /api/songs"]
```

### GET /api/songs/search/:query
- request: param `query: string`, query `limit?: number`
- response:

```json
["SongRecord same as GET /api/songs"]
```

### GET /api/songs/favorites
- request: none (auth required)
- response:

```json
["SongRecord same as GET /api/songs"]
```

### GET /api/songs/:songId/favorite
- request: param `songId: string` (auth required)
- response:

```json
{ "isFavorited": true }
```

### POST /api/songs/:songId/favorite
- request: param `songId: string` (auth required), none body
- response:

```json
{ "status": true }
```

### DELETE /api/songs/:songId/favorite
- request: param `songId: string` (auth required), none body
- response:

```json
{ "status": true }
```

### GET /api/songs/:id
- request: param `id: string`
- response:

```json
{
  "_id": "string",
  "Song Title": "string",
  "Artist": "string",
  "Released Date": "string",
  "About Song": "string",
  "Direct to YT": "string",
  "Lyric": ["string"],
  "albumCover": "string",
  "category": ["string"],
  "language": "string"
}
```

### POST /api/support/chat
- request:

```json
{
  "messages": [
    { "role": "user | assistant", "content": "string" }
  ]
}
```

- response:

```json
{
  "reply": "string",
  "stub": false
}
```

### GET /api/health
- request: none
- response:

```json
{
  "ok": true,
  "service": "M-Music API",
  "timestamp": "string (ISO)"
}
```
