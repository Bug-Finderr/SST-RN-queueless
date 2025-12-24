# QueueLess API

A queue/token management system built with Bun and MongoDB.

## Quick Start

```bash
bun install

# Bun.serve (default, recommended)
bun run dev        # Hot reload
bun run start      # Production

# Express (alternative)
# run `bun install express` first
bun run dev:express
bun run start:express
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No (24h) | Token expiry |
| `PORT` | No (8000) | Server port |
| `CORS_ORIGINS` | No | Comma-separated origins |

**Generate a JWT secret:**
```bash
openssl rand -base64 32
# or
bun -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | - | Register new user |
| POST | `/login` | - | Login |
| GET | `/me` | Required | Get current user |

### Services (`/api/services`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | - | List all services with queue stats |
| POST | `/` | Admin | Create service |
| PUT | `/:id` | Admin | Update service |
| DELETE | `/:id` | Admin | Soft delete service |

### Tokens (`/api/tokens`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/book?service_id=` | Required | Book a token |
| GET | `/my` | Required | Get user's tokens |
| GET | `/notifications` | Required | Get turn-near notifications |
| DELETE | `/:id` | Required | Cancel token |
| GET | `/queue/:serviceId` | - | Get queue status (public) |
| POST | `/complete/:serviceId` | Admin | Complete current token |
| POST | `/call-next/:serviceId` | Admin | Call next in queue |
| POST | `/skip/:tokenId` | Admin | Skip a token |
| GET | `/service/:serviceId` | Admin | Get all tokens for service |

### Admin (`/api/admin`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/make-admin/:email` | Admin | Promote user to admin |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/` | Health check |

## Project Structure

```
backend/
├── index.ts              # Bun.serve() entry point (default)
├── index.express.ts      # Express entry point (alternative)
├── router.ts             # Declarative route table + matching
├── config.ts             # Environment configuration
├── db.ts                 # MongoDB connection
├── middleware/
│   └── auth.ts           # JWT + password hashing
├── models/
│   ├── user.ts           # User schema
│   ├── service.ts        # Service schema
│   └── token.ts          # Token schema
├── routes/
│   ├── auth.ts           # Auth endpoints
│   ├── services.ts       # Service CRUD
│   ├── tokens.ts         # Queue management
│   └── admin.ts          # Admin utilities
├── services/
│   └── queue.ts          # Queue business logic
└── utils/
    ├── response.ts       # Response helpers
    └── validation.ts     # Zod schemas
```

## Architecture: Framework-Agnostic Routes

Routes are defined declaratively in `router.ts`, making it easy to swap frameworks:

```ts
// router.ts - shared by both Bun.serve and Express
export const routes: Route[] = [
  { method: "GET", path: "/api/", handler: () => Response.json({...}) },
  { method: "POST", path: "/api/auth/login", handler: (req) => handleLogin(req) },
  { method: "PUT", path: "/api/services/:id", handler: (req, p) => handleUpdateService(req, p.id) },
  // ... 18 routes total
];
```

| Entry Point | Framework | Command |
|-------------|-----------|---------|
| `index.ts` | Bun.serve (default) | `bun run dev` |
| `index.express.ts` | Express | `bun run dev:express` |

**Why this works:**
- Route handlers use Web Standard `Request`/`Response` APIs
- `Bun.password` works on Bun runtime (even with Express)
- Both entry points share the same `router.ts`, middleware, and business logic

## Security Features

- JWT authentication with configurable expiry
- Bcrypt password hashing via `Bun.password`
- CORS whitelist (not `*`)
- Input validation with Zod
- Admin endpoints protected (unlike the Python version)
- Atomic token numbering (no race conditions)

## Database Indexes

Optimized indexes for common queries:
- `users.email` (unique)
- `tokens.userId`
- `tokens.serviceId`
- `tokens.status`
- `tokens.createdAt`
- Compound: `{serviceId, status, createdAt}` for queue lookups
