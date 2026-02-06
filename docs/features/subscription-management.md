# Feature: Subscription Management

## Status: PENDING
**Task Reference**: 3.3 Subscription Management

## Objective
Implement Stripe-based subscription system for Pro features with monthly and yearly billing options.

## Scope
- Stripe integration
- Subscription plans (Free, Pro Monthly, Pro Yearly)
- Checkout flow
- Subscription status tracking
- Billing portal access
- Webhook handling

## Dependencies
- Backend API Setup (3.2) must be complete
- User Authentication (3.1) must be complete

## Impacted Files

### Backend
| File | Change |
|------|--------|
| `server/src/routes/v1/subscription.ts` | NEW - Subscription routes |
| `server/src/services/stripeService.ts` | NEW - Stripe logic |
| `server/src/webhooks/stripe.ts` | NEW - Webhook handler |
| `server/prisma/schema.prisma` | UPDATE - Subscription model |

### Extension
| File | Change |
|------|--------|
| `src/stores/subscriptionStore.ts` | NEW - Subscription state |
| `src/components/ui/UpgradeModal.tsx` | NEW - Upgrade UI |
| `src/components/ui/ProBadge.tsx` | NEW - Pro indicator |

## Implementation Details

### Subscription Schema
```prisma
model Subscription {
  id                 String   @id @default(cuid())
  userId             String   @unique
  user               User     @relation(fields: [userId], references: [id])
  stripeCustomerId   String   @unique
  stripeSubscriptionId String? @unique
  plan               Plan     @default(FREE)
  status             SubscriptionStatus @default(ACTIVE)
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean  @default(false)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

enum Plan {
  FREE
  PRO_MONTHLY
  PRO_YEARLY
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}
```

### Pricing
| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | Basic features |
| Pro Monthly | $4.99/mo | All features |
| Pro Yearly | $39.99/yr | All features (33% off) |

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/subscription` | Get subscription status |
| POST | `/api/v1/subscription/checkout` | Create checkout session |
| POST | `/api/v1/subscription/portal` | Create billing portal session |
| POST | `/webhooks/stripe` | Stripe webhook handler |

### Stripe Events to Handle
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Data Model
See Prisma schema above.

## Test Plan
- [ ] Checkout creates subscription
- [ ] Webhook updates subscription status
- [ ] Billing portal accessible
- [ ] Cancellation works
- [ ] Extension reflects subscription status
- [ ] Free users see upgrade prompts

## Rollout
1. Set up Stripe account and products
2. Add Subscription schema
3. Create checkout flow
4. Implement webhooks
5. Build billing portal integration
6. Create extension subscription store
7. Add upgrade modal UI
