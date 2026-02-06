# Feature: Pro Feature Gating

## Status: PENDING
**Task Reference**: 3.5 Pro Feature Gating

## Objective
Implement paywall logic to restrict Pro features to paying subscribers while maintaining a great free experience.

## Scope
- Feature flag system
- Pro feature detection
- Upgrade prompts
- Graceful degradation
- Trial support (future)

## Dependencies
- Subscription Management (3.3) must be complete

## Impacted Files

### Extension
| File | Change |
|------|--------|
| `src/lib/features.ts` | NEW - Feature definitions |
| `src/hooks/useProFeature.ts` | NEW - Feature check hook |
| `src/components/ui/ProGate.tsx` | NEW - Gate wrapper component |
| `src/components/ui/UpgradePrompt.tsx` | NEW - Inline upgrade prompt |
| Various widgets | UPDATE - Add Pro gates |

## Implementation Details

### Feature Definitions
```typescript
export const FEATURES = {
  // Free features
  CLOCK: { pro: false },
  GREETING: { pro: false },
  WEATHER: { pro: false },
  BASIC_TODOS: { pro: false },
  QUICK_LINKS: { pro: false },
  FOCUS_DAILY: { pro: false },

  // Pro features
  HABIT_TRACKER: { pro: true },
  METRICS_DASHBOARD: { pro: true },
  BALANCE_MODE: { pro: true },
  AUTOFOCUS: { pro: true },
  POMODORO: { pro: true },
  TAB_STASH: { pro: true },
  WORLD_CLOCKS: { pro: true },
  COUNTDOWNS: { pro: true },
  SOUNDSCAPES: { pro: true },
  VISION_BOARD: { pro: true },
  ADVANCED_TODOS: { pro: true }, // subtasks, tags, due dates
  CLOUD_SYNC: { pro: true },
  CUSTOM_THEMES: { pro: true },
} as const;
```

### useProFeature Hook
```typescript
function useProFeature(feature: keyof typeof FEATURES) {
  const { isPro } = useSubscriptionStore();
  const featureConfig = FEATURES[feature];

  return {
    isAvailable: !featureConfig.pro || isPro,
    isPro: featureConfig.pro,
    showUpgrade: featureConfig.pro && !isPro,
  };
}
```

### ProGate Component
```tsx
function ProGate({ feature, children, fallback }: ProGateProps) {
  const { isAvailable, showUpgrade } = useProFeature(feature);

  if (isAvailable) return children;
  if (fallback) return fallback;
  return <UpgradePrompt feature={feature} />;
}
```

### Gating Strategies
1. **Full block**: Feature completely hidden
2. **Preview mode**: Feature visible but read-only
3. **Limited use**: Free tier gets N uses
4. **Upgrade prompt**: Show feature with upgrade CTA

### Free vs Pro Matrix
| Feature | Free | Pro |
|---------|------|-----|
| Todos | 10 tasks | Unlimited |
| Quick Links | 6 links | Unlimited |
| Focus Mode | Daily only | Pomodoro + more |
| Themes | Light/Dark | All colors |
| Widgets | Basic | All widgets |
| Sync | None | Cloud sync |

## Data Model
No new models. Uses subscription status from subscriptionStore.

## Test Plan
- [ ] Free users see basic features
- [ ] Pro users see all features
- [ ] Upgrade prompts appear correctly
- [ ] Feature checks are performant
- [ ] Graceful handling when offline

## Rollout
1. Define feature list
2. Create useProFeature hook
3. Build ProGate component
4. Add gates to Pro widgets
5. Create upgrade prompts
6. Test free/pro experiences
