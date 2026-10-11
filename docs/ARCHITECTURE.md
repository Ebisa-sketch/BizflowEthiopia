# Architecture Overview - BizFlow Ethiopia

## High-Level Architecture
BizFlow Ethiopia is built as a **Modular Monolith** using **Next.js 15 (App Router)** and **PostgreSQL** with **Prisma ORM**.

```
[ Client / Browser / PWA ]
           │
           ▼
[ Next.js Middleware (Tenant & Session Guard) ]
           │
           ├──────────────┬──────────────┬──────────────┐
           ▼              ▼              ▼              ▼
     (marketing)       (auth)       (dashboard)      (admin)
           │              │              │              │
           └──────────────┴──────┬───────┴──────────────┘
                                 ▼
                     [ Domain Features Layer ]
    (sales, inventory, products, expenses, staff, subscriptions)
                                 ▼
                   [ Core Infrastructure Lib ]
   (db/prisma, tenant isolation, money/ETB, permissions, idempotency)
                                 ▼
                   [ PostgreSQL Database (Prisma) ]
```

## Directory Organization Strategy

- **`src/app/(marketing)`**: Public-facing landing pages, pricing tiers (Starter, Business, Pro), contact and about pages.
- **`src/app/(auth)`**: Authentication flows (login, register, password recovery).
- **`src/app/(dashboard)`**: Tenant business operations workspace (POS sales, inventory, products, expenses, reports).
- **`src/app/(admin)`**: Platform super-administrator console for managing tenants and billing.
- **`src/features/*`**: Domain boundaries containing services, validation schemas, repository functions, and domain UI.
- **`src/lib/*`**: Cross-cutting foundation packages:
  - `lib/db`: Prisma singleton instance.
  - `lib/tenant`: Tenant context extraction and query isolation helpers.
  - `lib/permissions`: Role-based access control engine (RBAC).
  - `lib/money`: Ethiopian Birr precision rounding and currency formatting.
  - `lib/idempotency`: Sale submission deduplication to prevent double transactions.
  - `lib/i18n`: Multi-lingual dictionary loader (`en`, `am`, `om`).
