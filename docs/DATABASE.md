# Database Design & Multi-Tenant Schema - BizFlow Ethiopia

## Schema Principles
1. **Tenant Scoping:** All core operational tables include `business_id` with foreign key referencing `Business(id)` with cascade/restrict policies.
2. **Numeric Precision:** Monetary values use `Decimal(12, 2)` or integer cents to eliminate floating point rounding errors.
3. **Immutable Ledgers:** `StockMovement` and `SaleItem` retain immutable records and snapshots at the moment of creation.

## Entity Relationship Overview
- **Business**: The tenant container.
- **User & Membership**: Users have accounts and belong to one or more businesses via `Membership` with specific roles (`OWNER`, `MANAGER`, `CASHIER`, `INVENTORY`).
- **Category & Product**: Products have SKU unique per business, stock quantity, cost price, and selling price.
- **StockMovement**: Append-only ledger recording all quantity adjustments (`RECEIPT`, `SALE`, `ADJUSTMENT`, `RETURN`, `DAMAGE`).
- **Sale & SaleItem**: Transactional POS orders capturing subtotal, discount, tax, payment status, and snapshot line items.
- **Payment**: Payment ledger recording cash or electronic references (`TELEBIRR`, `CBE_BIRR`, `BANK_TRANSFER`, `CASH`).
- **Expense**: Overhead expenditure logs by category and date.
- **Subscription**: SaaS subscription tracking tier, status, and expiration.
- **AuditLog**: Traceability for critical business mutations.
