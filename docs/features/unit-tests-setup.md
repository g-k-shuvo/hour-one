# Feature: Unit Tests Setup

## Status: PENDING
**Task Reference**: 5.7 Unit Tests

## Objective
Set up Vitest testing framework and create initial test coverage for critical components and stores.

## Scope
- Install and configure Vitest
- Set up React Testing Library
- Create test utilities and mocks
- Write initial tests for stores and components

## Impacted Files
| File | Change |
|------|--------|
| `package.json` | Add test dependencies and scripts |
| `vite.config.ts` | Add Vitest configuration |
| `src/test/setup.ts` | NEW - Test setup file |
| `src/test/mocks/chrome.ts` | NEW - Chrome API mocks |
| `src/**/*.test.ts(x)` | NEW - Test files |

## Implementation Details

### Dependencies
```json
{
  "devDependencies": {
    "vitest": "^1.x",
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "jsdom": "^24.x"
  }
}
```

### NPM Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Chrome API Mocks
Mock `chrome.storage.local` and `chrome.storage.sync` for store tests.

### Initial Test Targets
1. `todosStore.ts` - CRUD operations
2. `habitStore.ts` - Streak calculations
3. `focusSessionStore.ts` - Timer logic
4. `dateUtils.ts` - Utility functions

## Data Model
No data model changes required.

## Test Plan
- [ ] Vitest runs successfully
- [ ] Chrome storage mocks work
- [ ] Initial store tests pass
- [ ] Coverage report generates

## Rollout
1. Install dependencies
2. Configure Vitest
3. Create Chrome API mocks
4. Write store tests
5. Write component tests
6. Add to CI pipeline
