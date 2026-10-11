# BizFlow Ethiopia - Software Requirements Specification (SRS)

## 1. Executive Summary
BizFlow Ethiopia is a multi-tenant business management and Point of Sale (POS) SaaS platform designed specifically for Ethiopian small and medium-sized businesses (retail stores, mini-markets, pharmacies, wholesalers, and service businesses).

### Target Audience
- **Primary Market:** Small & medium retailers and wholesalers in Ethiopia.
- **Key Personas:** Business Owners, Managers, Cashiers, Inventory Staff, Platform Admin.
- **Default Currency:** Ethiopian Birr (ETB).

## 2. System Roles & Access Matrix
| Role | Products & Categories | Inventory Movements | POS Sales & Checkout | Expenses | Reports & Financials | Staff & Settings | Tenant Subscriptions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Platform Admin** | - | - | - | - | Platform Level | Global | Full Control |
| **Business Owner** | Full | Full | Full | Full | Full (incl. COGS/Profit) | Full | Manage Own Plan |
| **Manager** | Full | Full | Full | Full | Operational | View Only | View Only |
| **Cashier** | Read Only | View Stock | Create/Receipt | None | Shift/Sales only | None | None |
| **Inventory Staff**| Full | Receive/Adjust | None | None | Stock Reports | None | None |

## 3. Core Functional Requirements (FR)
- **FR-01: User Authentication & Sessions:** Secure sign up, login, token/session management, password reset.
- **FR-02: Multi-Tenant Business Profile:** Business isolation, ETB currency settings, address, tax/TIN identification.
- **FR-03: Product Catalog:** SKU uniqueness per tenant, categories, cost price, selling price, barcode, reorder levels.
- **FR-04: Inventory Ledger:** Strict stock movement ledger (RECEIPT, SALE, ADJUSTMENT, RETURN, DAMAGE), mandatory adjustment reasons, non-negative stock enforcement.
- **FR-05: POS Sales & Checkout:** Product search, quick cart, stock verification, atomic sale commit, snapshotting unit price & cost.
- **FR-06: Payment Tracking:** Multi-payment support (Cash, Telebirr manual transfer, CBE Birr manual transfer, Bank Transfer), split payments, outstanding balance tracking.
- **FR-07: Receipts:** Clean printable receipts with business header, reference numbers, line items, and payment breakdown.
- **FR-08: Expenses:** Expense recording by category (Rent, Utilities, Salary, Logistics, Misc) for accurate P&L.
- **FR-09: Financial Dashboard & Analytics:** Real-time KPI cards (Today's Sales, Profit, Low Stock Alerts, Monthly Expenses).
- **FR-10: Audit Logging:** Complete auditable trace of all inventory adjustments, price edits, and transaction reversals.

## 4. Key Business Rules (BR)
- **BR-01 Tenant Isolation:** Every single database query and mutation MUST be scoped to the authenticated `business_id`.
- **BR-02 Stock Non-Negativity:** A sale cannot finalize if quantity exceeds available stock unless backorders are explicitly enabled.
- **BR-03 Price & Cost Snapshot:** Unit selling price and cost are snapshotted in `SaleItem` at time of purchase.
- **BR-04 Manual Verification:** Third-party digital payments (Telebirr/CBE) are tagged with manual transaction codes and verified by human staff.
