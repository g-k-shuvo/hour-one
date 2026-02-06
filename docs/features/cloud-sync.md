# Feature: Cloud Sync

## Status: PENDING
**Task Reference**: 3.4 Cloud Sync Service

## Objective
Enable cross-device synchronization of user data (todos, habits, settings) for Pro users.

## Scope
- Sync API endpoints
- Conflict resolution strategy
- Incremental sync
- Offline support with queue
- Sync status indicators

## Dependencies
- Backend API Setup (3.2) must be complete
- User Authentication (3.1) must be complete
- Subscription Management (3.3) must be complete (Pro feature)

## Impacted Files

### Backend
| File | Change |
|------|--------|
| `server/src/routes/v1/sync.ts` | NEW - Sync routes |
| `server/src/services/syncService.ts` | NEW - Sync logic |
| `server/prisma/schema.prisma` | UPDATE - Sync models |

### Extension
| File | Change |
|------|--------|
| `src/stores/syncStore.ts` | NEW - Sync state |
| `src/services/syncService.ts` | NEW - Sync API calls |
| `src/lib/syncQueue.ts` | NEW - Offline queue |
| `src/components/ui/SyncStatus.tsx` | NEW - Sync indicator |

## Implementation Details

### Sync Schema
```prisma
model SyncData {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  dataType  SyncDataType
  data      Json
  version   Int      @default(1)
  updatedAt DateTime @updatedAt

  @@unique([userId, dataType])
}

enum SyncDataType {
  TODOS
  HABITS
  SETTINGS
  QUICK_LINKS
  FOCUS_HISTORY
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sync/:dataType` | Get synced data |
| PUT | `/api/v1/sync/:dataType` | Update synced data |
| GET | `/api/v1/sync/all` | Get all synced data |
| POST | `/api/v1/sync/batch` | Batch sync multiple types |

### Conflict Resolution
- Last-write-wins with version tracking
- Client sends version number
- Server rejects if version mismatch
- Client must fetch latest and retry

### Sync Flow
1. User makes change locally
2. Change saved to Chrome storage
3. Change queued for sync
4. Sync service sends to API
5. Server validates and stores
6. Other devices pull changes

### Offline Support
- Queue changes when offline
- Sync when connection restored
- Show pending changes count

## Data Model
See Prisma schema above.

## Test Plan
- [ ] Data syncs to server
- [ ] Changes reflect on other devices
- [ ] Offline changes queue properly
- [ ] Conflicts resolved correctly
- [ ] Sync status shows correctly
- [ ] Only Pro users can sync

## Rollout
1. Create SyncData schema
2. Build sync API endpoints
3. Create extension sync service
4. Implement offline queue
5. Add sync status UI
6. Test cross-device sync
