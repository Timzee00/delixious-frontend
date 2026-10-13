# Delixious — Merchant workspace production-readiness contract

Target: a usable restaurant operating system, not a collection of nonfunctional settings cards. No "fully functional" claim until backend, database, UI, and security acceptance tests pass in staging.

## Implemented in development branches (NOT shipped)

| Owner capability | API/data dependency | Acceptance gate |
| --- | --- | --- |
| Profile/branding and media | Existing restaurant update and upload APIs | Owner can create, edit and view public listing |
| Menu and item availability | Existing menu APIs | Changed price/stock appears publicly |
| Order queue | Existing order management endpoints | Only authorized owner can update order state |
| Payment onboarding | GET banks, POST bank-details, provider integration | Verify test account; only masked result visible; checkout refuses test/live mode mismatches |
| Payout status | restaurant/mine, computed from provider code | UI distinguishes approved vs payout-ready |
| Weekly operating hours | restaurant_operating_settings migration + owner GET/PUT | Closed periods shown on marketplace and block checkout; manual pause overrides |
| Account password change | Auth current-password verification + server update | Correct current password required; existing browser signs out after change |
| Customer availability badges | Public restaurant API derived accepting_orders | Cards and detail match checkout decision |

## Release prerequisites and sequence

1. Back up the production DB. Create **isolated staging** Supabase database with scrubbed/synthetic users, restaurants, and orders.
2. Apply backend PR migrations in staging, including `profiles.is_suspended`, moderation indexes, `restaurant_operating_settings`, and `restaurants.payout_mode`. Audit existing subaccounts before assigning modes. DO NOT run baseline `schema.sql` over existing data.
3. Deploy backend development branch to an isolated staging service with **Paystack test keys**. Confirm correct Supabase URL and test credentials without exposing secrets in logs.
4. Point the **staging frontend** to that same-origin staging backend. Keep public Netlify production locked.
5. Pass automated tests, then confirm owner and customer journeys in Chrome, Firefox and Android.
6. Verify all bank data is masked, other owners cannot read or change each other's settings, CSRF/roles/limits are enforced, and secret keys never reach the frontend.
7. Confirm payment initialization, payout-mode compatibility and webhook idempotency using **test** payments. Do not send live bank or charge data during staging.
8. Capture performance and rollback evidence, then schedule a reviewed migration and deployment.

## Next essential modules — still NOT implemented

- Owner/staff RBAC with invitations, scope by restaurant/branch, and revocation
- Multiple branches, kitchen/service areas, delivery configuration and prep-time promises
- Sales/payout reporting reconciled to payment ledger, downloadable statements and refunds
- Inventory, item availability scheduling, stock warnings, options/add-ons, allergens
- Order chat and support tickets with audit trails and retention
- Vacation exceptions/holiday overrides and temporary pause reasons
- Marketing campaigns, vouchers, customer feedback and review moderation
- Business identity/KYC, tax settings, invoice rules, ownership transfer review
- Account MFA, trusted devices, login session management, data export/deletion
- Durable event-driven notifications, campaign queues, operational analytics and alerting
- Admin audit logs, fraud defenses, risk review and documented incident response

## Engineering gates for a serious acquisition review

- CI green for both repos; database migrations reproducible; staging parity and rollback drills
- Security review for Paystack settlement and sensitive bank metadata; limit retention of full account data
- Measured cold-start time, homepage P95, checkout error budgets and mobile accessibility
- Authorization tests across customer, owner, rider and HQ roles
- Tested reconciliation of duplicate/partial payments and safe retry behavior
- Load testing with stepwise scale targets; no untested claim that a single Render instance supports millions of users
