# BizFlow Ethiopia 🇪🇹

Multi-tenant Business Management & Point of Sale (POS) SaaS designed specifically for Ethiopian retail shops, supermarkets, pharmacies, and small wholesalers.

## 🚀 Key Features
- **Multi-Tenant SaaS Architecture:** Complete data isolation per business.
- **Role-Based Access Control:** Tailored roles for Business Owner, Store Manager, Cashier, Inventory Staff, and Platform Admin.
- **Fast POS & Checkout:** Quick product lookup, cart, discount controls, and immediate stock validation.
- **Ethiopian Payment Methods:** Cash and manual digital payment confirmation (Telebirr, CBE Birr, Bank Transfer) with reference recording.
- **Inventory & Ledger:** Stock receiving, audit-logged adjustments with mandatory reasons, and automated low-stock warnings.
- **Financial Analytics & P&L:** Estimated gross profit, revenue snapshots, expense categorization, and exportable reports.
- **Localisation Ready:** Ethiopian Birr (ETB) default, with planned multilingual support for English, Amharic, and Afaan Oromo.

## 🛠 Tech Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database & ORM:** PostgreSQL with Prisma ORM
- **Styling & UI:** Tailwind CSS, Lucide Icons
- **Testing:** Vitest (Unit/Integration) & Playwright (E2E)

## 📦 Getting Started
1. **Clone & install dependencies:**
   ```bash
   npm install
   ```
2. **Setup environment:**
   ```bash
   cp .env.example .env
   ```
3. **Database initialization:**
   ```bash
   npx prisma generate
   # If running PostgreSQL locally or in Docker:
   # docker-compose up -d
   # npx prisma db push
   ```
4. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Documentation
Detailed specifications are in the [`docs/`](./docs) folder:
- [Software Requirements Specification (SRS)](./docs/SRS.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Database Schema](./docs/DATABASE.md)
- [API Conventions](./docs/API.md)
- [Security Model](./docs/SECURITY.md)
- [Testing Guide](./docs/TESTING.md)
- [Deployment Instructions](./docs/DEPLOYMENT.md)
