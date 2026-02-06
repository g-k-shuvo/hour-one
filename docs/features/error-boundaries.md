# Feature: Error Boundaries

## Status: PENDING
**Task Reference**: 5.3 Error Handling

## Objective
Add React error boundaries to prevent full app crashes when individual widgets fail.

## Scope
- Create reusable ErrorBoundary component
- Wrap each widget with error boundary
- Display friendly error UI with retry option
- Log errors for debugging

## Impacted Files
| File | Change |
|------|--------|
| `src/components/ui/ErrorBoundary.tsx` | NEW - Error boundary component |
| `src/components/layout/Dashboard.tsx` | Wrap widgets with error boundaries |

## Implementation Details

### ErrorBoundary Component
```tsx
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  widgetName?: string;
}

class ErrorBoundary extends Component<Props, State> {
  // Catch errors and display fallback UI
  // Include retry button
  // Log error details
}
```

### Fallback UI
- Show widget name
- Display "Something went wrong" message
- Retry button to reset error state
- Collapse option to hide broken widget

## Data Model
No data model changes required.

## Test Plan
- [ ] ErrorBoundary catches rendering errors
- [ ] Fallback UI displays correctly
- [ ] Retry button resets error state
- [ ] Other widgets continue working when one fails
- [ ] Errors are logged to console

## Rollout
1. Create ErrorBoundary component
2. Add to one widget for testing
3. Roll out to all widgets
4. Add error logging/reporting
