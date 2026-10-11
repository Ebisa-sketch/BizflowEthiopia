# API Specification - BizFlow Ethiopia

## Base Conventions
- All internal API endpoints are structured under `/api/...`.
- Tenant context is automatically derived from the authenticated session.
- Response payloads follow a standard JSON envelope:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null
  }
  ```

## Key API Endpoints
- `GET /api/businesses/current` - Active business profile
- `PATCH /api/businesses/current` - Update business settings & currency
- `GET /api/products` - Filtered & paginated product catalog
- `POST /api/products` - Create new product
- `GET /api/inventory/movements` - Stock movement ledger
- `POST /api/inventory/receipts` - Stock receiving intake
- `POST /api/inventory/adjustments` - Manual adjustment with mandatory reason
- `GET /api/sales` - Sales history & receipts
- `POST /api/sales` - Idempotent POS sale creation & checkout
- `POST /api/sales/:id/reversals` - Audited transaction refund/void
- `GET /api/expenses` - Categorized business expenses
- `POST /api/expenses` - Create new expense
- `GET /api/reports/dashboard` - High-level metrics for dashboard
- `GET /api/reports/sales` - Exportable sales metrics
