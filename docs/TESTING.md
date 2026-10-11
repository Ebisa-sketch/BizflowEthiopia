# Testing Strategy - BizFlow Ethiopia

## Test Pyramid
1. **Unit Tests (`tests/unit/`):**
   - Money calculations (ETB rounding, discount percentages, tax).
   - Permission check logic (Owner vs. Cashier vs. Manager permissions).
   - Schema and input validation schemas.
2. **Integration Tests (`tests/integration/`):**
   - Stock transactions: Verifying atomic balance deductions on checkout.
   - Tenant isolation: Ensuring Business A cannot query or mutate Business B's data.
   - Sale reversals & audit logging.
3. **End-to-End Tests (`tests/e2e/`):**
   - Playwright automated browser tests covering login -> add product -> POS checkout -> receipt view -> verify stock deduction.

## Running Tests
- Unit & Integration: `npm run test`
- E2E: `npm run test:e2e`
