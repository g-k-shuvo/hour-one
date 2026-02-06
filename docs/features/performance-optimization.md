# Feature: Performance Optimization

## Status: PENDING
**Task Reference**: 5.2 Performance Optimization

## Objective
Improve initial load time and runtime performance through lazy loading, code splitting, and optimizations.

## Scope
- Lazy load non-critical widgets
- Code split by route/feature
- Optimize re-renders
- Reduce bundle size

## Impacted Files
| File | Change |
|------|--------|
| `src/components/layout/Dashboard.tsx` | Lazy load widgets |
| `src/components/widgets/*.tsx` | Export for lazy loading |
| `vite.config.ts` | Configure code splitting |

## Implementation Details

### Lazy Loading Widgets
```tsx
const MetricsDashboard = lazy(() => import('./widgets/MetricsDashboard'));
const HabitTracker = lazy(() => import('./widgets/HabitTracker'));
const TabStash = lazy(() => import('./widgets/TabStash'));
```

### Suspense Boundaries
```tsx
<Suspense fallback={<WidgetSkeleton />}>
  <MetricsDashboard />
</Suspense>
```

### Priority Loading
1. **Critical (immediate)**: Clock, Greeting, Background
2. **High (fast)**: TodoList, Focus, Weather
3. **Deferred**: Metrics, Habits, TabStash, WorldClocks, Soundscapes

### Optimization Targets
- Memoize expensive calculations
- Virtualize long lists
- Debounce storage writes
- Optimize Zustand selectors

## Data Model
No data model changes required.

## Test Plan
- [ ] Initial load time < 500ms
- [ ] Lazy widgets load on demand
- [ ] No visible layout shift
- [ ] Bundle size reduced by 20%+

## Rollout
1. Measure current performance baseline
2. Implement lazy loading
3. Add suspense boundaries
4. Optimize renders
5. Measure improvement
