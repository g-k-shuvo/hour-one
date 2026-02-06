# Feature: User Authentication

## Status: PENDING
**Task Reference**: 3.1 User Authentication

## Objective
Implement secure user authentication with email/password and Google OAuth options.

## Scope
- Email/password registration and login
- Google OAuth integration
- JWT token management
- Password reset flow
- Session management in extension

## Dependencies
- Backend API Setup (3.2) must be complete

## Impacted Files

### Backend
| File | Change |
|------|--------|
| `server/src/routes/v1/auth.ts` | NEW - Auth routes |
| `server/src/services/authService.ts` | NEW - Auth logic |
| `server/src/middleware/auth.ts` | UPDATE - JWT verification |
| `server/prisma/schema.prisma` | UPDATE - User model |

### Extension
| File | Change |
|------|--------|
| `src/stores/authStore.ts` | NEW - Auth state |
| `src/components/ui/AuthModal.tsx` | NEW - Login/signup UI |
| `src/services/authService.ts` | NEW - API calls |

## Implementation Details

### User Schema
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  googleId      String?   @unique
  name          String?
  avatarUrl     String?
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Email registration |
| POST | `/api/v1/auth/login` | Email login |
| POST | `/api/v1/auth/logout` | Logout |
| GET | `/api/v1/auth/google` | Google OAuth start |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback |
| POST | `/api/v1/auth/forgot-password` | Request reset |
| POST | `/api/v1/auth/reset-password` | Reset password |
| GET | `/api/v1/auth/me` | Current user |

### JWT Strategy
- Access token: 15 min expiry
- Refresh token: 7 day expiry
- Tokens stored in Chrome storage

### Extension Auth Flow
1. User opens auth modal
2. Signs up/logs in via API
3. Tokens stored in Chrome storage
4. Auth state updated in Zustand
5. API calls include Authorization header

## Data Model
See Prisma schema above.

## Test Plan
- [ ] Email registration creates user
- [ ] Email login returns tokens
- [ ] Google OAuth works
- [ ] Invalid credentials rejected
- [ ] Password reset flow works
- [ ] Extension stores tokens
- [ ] Protected routes require auth

## Rollout
1. Add Passport.js and JWT dependencies
2. Create User schema migration
3. Implement email auth routes
4. Add Google OAuth
5. Create extension auth store
6. Build auth modal UI
7. Integrate with API
