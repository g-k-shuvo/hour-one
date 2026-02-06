# Hour One - Technical Debt

## Priority: High

### 1. No Test Coverage
- **Location**: Entire codebase
- **Issue**: No unit tests, integration tests, or E2E tests
- **Impact**: Risky refactoring, regression bugs
- **Solution**: Add Vitest for unit tests, Playwright for E2E
- **Effort**: Medium-High

### 2. No Linting Configuration
- **Location**: Project root
- **Issue**: No ESLint or Prettier configuration
- **Impact**: Inconsistent code style, potential bugs
- **Solution**: Add ESLint + Prettier with React/TypeScript plugins
- **Effort**: Low

### 3. Missing Error Boundaries
- **Location**: `src/components/`
- **Issue**: No React error boundaries to catch component errors
- **Impact**: Full app crash on widget errors
- **Solution**: Add error boundaries around widgets
- **Effort**: Low

## Priority: Medium

### 5. No API Error Handling UI
- **Location**: `src/services/`, `src/components/widgets/`
- **Issue**: API failures show no feedback to user
- **Impact**: Poor UX when external services fail
- **Solution**: Add toast notifications or error states
- **Effort**: Medium

### 6. Hardcoded Strings
- **Location**: Throughout components
- **Issue**: UI text is hardcoded, not internationalized
- **Impact**: Difficult to add i18n later
- **Solution**: Extract strings to locale files
- **Effort**: Medium-High

## Priority: Low

### 7. Bundle Size Optimization
- **Location**: Build output
- **Issue**: No code splitting or lazy loading
- **Impact**: Slower initial load
- **Solution**: Add React.lazy() for non-critical widgets
- **Effort**: Low

### 8. Accessibility (a11y)
- **Location**: UI components
- **Issue**: Missing ARIA labels, keyboard navigation
- **Impact**: Poor accessibility for screen readers
- **Solution**: Audit and add proper ARIA attributes
- **Effort**: Medium

## Recently Resolved

### TypeScript Errors (84 errors) - RESOLVED 2026-02-06
- **PR**: #1 - fix: resolve all 84 TypeScript errors
- **Solution Applied**: Removed unused imports, fixed type mismatches, added proper interfaces
- **Files Fixed**: 23 files across components, services, and stores

---

## How to Address

1. Create a feature spec for the debt item
2. Plan the implementation
3. Execute with tests
4. Create PR and review

## Adding New Debt

When adding new technical debt:
1. Add it to the appropriate priority section
2. Include: Location, Issue, Impact, Solution, Effort
3. Update this file in the same PR that introduces the debt
