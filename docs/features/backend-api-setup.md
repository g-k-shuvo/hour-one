# Feature: Backend API Setup

## Status: PENDING
**Task Reference**: 3.2 Backend API

## Objective
Set up Node.js/Express backend with PostgreSQL database to support user authentication, subscription management, and cloud sync.

## Scope
- Express.js server setup
- PostgreSQL + Prisma ORM
- API route structure
- Error handling middleware
- Environment configuration
- Docker development setup

## Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Auth**: Passport.js (separate feature)

## Impacted Files
| File | Change |
|------|--------|
| `server/` | NEW - Backend directory |
| `server/package.json` | NEW - Backend dependencies |
| `server/src/index.ts` | NEW - Express entry point |
| `server/src/routes/` | NEW - API routes |
| `server/src/middleware/` | NEW - Express middleware |
| `server/prisma/schema.prisma` | NEW - Database schema |
| `docker-compose.yml` | NEW - Local dev setup |

## Implementation Details

### Project Structure
```
server/
├── src/
│   ├── index.ts           # Express app entry
│   ├── routes/
│   │   ├── index.ts       # Route aggregator
│   │   ├── health.ts      # Health check endpoint
│   │   └── v1/            # API version 1
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── validate.ts
│   │   └── auth.ts
│   ├── services/
│   └── lib/
│       └── prisma.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

### Base Schema
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/v1/me` | Current user |

## Data Model
See Prisma schema above. Full schema will expand with auth and sync features.

## Test Plan
- [ ] Server starts without errors
- [ ] Health endpoint returns 200
- [ ] Database connection works
- [ ] Error middleware catches errors
- [ ] CORS configured for extension

## Rollout
1. Initialize server directory
2. Set up Express with TypeScript
3. Configure Prisma + PostgreSQL
4. Add Docker Compose for local dev
5. Create health endpoint
6. Add error handling middleware
