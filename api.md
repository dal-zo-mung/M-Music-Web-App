# M-Music-Web-App API

## Authentication

| Method | Endpoint |
| --- | --- |
| GET | `/api/me` |
| POST | `/api/logout` |
| POST | `/api/register` |
| POST | `/api/login` |

## Google OAuth

| Method | Endpoint |
| --- | --- |
| GET | `/auth/google` |
| GET | `/auth/google/callback` |
| GET | `/auth/google/failure` |

## Profile

| Method | Endpoint |
| --- | --- |
| PATCH | `/api/me/profile` |
| POST | `/api/me/profile-image` |
| DELETE | `/api/me/profile-image` |

## Songs & Search

| Method | Endpoint |
| --- | --- |
| GET | `/api/songs` |
| GET | `/api/songs/browse` |
| GET | `/api/songs/search` |
| GET | `/api/songs/search/:query` |
| GET | `/api/songs/:id` |

## Favorites

| Method | Endpoint |
| --- | --- |
| GET | `/api/songs/favorites` |
| GET | `/api/songs/:songId/favorite` |
| POST | `/api/songs/:songId/favorite` |
| DELETE | `/api/songs/:songId/favorite` |

## Support

| Method | Endpoint |
| --- | --- |
| POST | `/api/support/chat` |

## Desktop Downloads

| Method | Endpoint |
| --- | --- |
| GET | `/api/desktop/releases/latest` |

## Health

| Method | Endpoint |
| --- | --- |
| GET | `/api/health` |
