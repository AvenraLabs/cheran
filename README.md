# Cheran Irrigation - Enterprise Horticulture & Government Project ERP

Production-grade AI-powered internal management system for **Cheran Irrigation**, purpose-built for managing Tamil Nadu government micro-irrigation schemes (MIG/PMKSY/Horticulture), commercial direct sales, dealer commissions, factory stock inventory, raw material procurement, and multi-tier company financials.

---

## 📁 Repository Structure

```
cheran/
├── backend/                                  # Node.js + Express + Sequelize + PostgreSQL API
│   ├── config/                               # Sequelize CLI configuration
│   ├── migrations/                           # Database schema migrations
│   ├── seeders/                              # Government status master & reference seeders
│   ├── src/
│   │   ├── config/                           # Database connection & automated migration runner
│   │   ├── models/                           # Central model associations (initModels.js)
│   │   ├── shared/                           # Error handlers, JWT auth, RBAC middlewares, file uploaders
│   │   ├── utils/                            # Excel parsers, date normalizers, financial calculation engine
│   │   └── modules/
│   │       ├── auth/                         # JWT authentication & session management
│   │       ├── users/                        # 3-tier user management (ADMIN, USER, DEALER)
│   │       ├── dashboard/                    # Executive analytics & stage duration metrics
│   │       ├── projects/                     # Government project records, stages & status timeline
│   │       ├── imports/                      # 2-step Excel Annexure import engine (Preview -> Resolve -> Commit)
│   │       ├── invoices/                     # Load order batch ingestion & bulk invoice mapping
│   │       ├── dealers/                      # Dealer profiles, commission settlement & merging engine
│   │       ├── settings/                     # Dynamic date-based Scheme GST & Fittings tax slabs
│   │       ├── sales/                        # Commercial direct sales, invoices & PDF generation
│   │       ├── inventory/                    # On-hand inventory, raw material procurement & production batches
│   │       ├── items/                        # Item master catalog & finished goods
│   │       ├── units/                        # Units of measure (UOM)
│   │       ├── suppliers/                    # Raw material vendor registry
│   │       ├── customers/                    # Commercial client database
│   │       ├── expenses/                     # Operating expenditure (Opex) tracking
│   │       ├── employees/                    # Staff directory, daily attendance sheets & payroll
│   │       └── reports/                      # P&L statement, 55%/45% Govt milestones & procurement spend
│   ├── .env.example
│   └── package.json
├── frontend/                                 # React + Vite + Tailwind CSS + Lucide Icons (PWA-ready)
│   ├── public/                               # PWA manifest, service worker & official brand assets
│   ├── src/
│   │   ├── api/                              # Axios client with auto JWT attachment & interceptors
│   │   ├── context/                          # Authentication & session state
│   │   ├── components/                       # Reusable UI (Navbar, Sidebar, Modal, MetricCard, Pagination)
│   │   ├── pages/                            # Full suite of responsive domain pages
│   │   ├── utils/                            # Date formatting, numbers & currency utilities
│   │   ├── App.jsx                           # Role-based route guards (AdminRoute, UserOrAdminRoute)
│   │   └── index.css                         # Warm neutral design tokens & Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── workflow.md                               # Project execution roadmap & completed milestones
└── README.md
```

---

## 👥 3-Tier Role Access System

The ERP implements a strict Role-Based Access Control (RBAC) hierarchy across backend API endpoints and frontend navigation:

| Module / Page | `ADMIN` | `USER` | `DEALER` |
| :--- | :---: | :---: | :---: |
| **Executive Dashboard** (`/`) | ✅ Full Access | ✅ Access | ❌ Forbidden *(Redirects to Projects)* |
| **Govt Projects & Detail** (`/projects`) | ✅ Full Access | ✅ Access | ✅ Access |
| **Direct Commercial Sales** (`/sales`) | ✅ Full Access | ✅ Access | ❌ Forbidden |
| **Load Order Batch Upload** (`/imports/load-order`) | ✅ Full Access | ✅ Access | ❌ Forbidden |
| **Excel Annexure Imports** (`/imports`) | ✅ Full Access | ✅ Access | ✅ Access |
| **Dealers Directory** (`/dealers`) | ✅ Full Access | ✅ Access | ✅ Access |
| **Stock On-Hand & Materials** (`/inventory`) | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Purchase Receipts (Procurement)** (`/inventory/receipts`) | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Daily Production Batches** (`/inventory/production`) | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Master Catalogs (Items / UOM / Suppliers)** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Commercial Customers & Expenses** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Staff Attendance & Payroll** (`/employees`) | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Financial Intelligence & P&L Reports** (`/reports`) | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **User Management & Scheme GST Settings** (`/users`, `/settings`) | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |

---

## 🎯 Key Capabilities & Business Logic

### 1. Government Scheme Inflows (55% & 45% Milestones)
- Tracks subsidy fund releases from the Tamil Nadu Horticulture Department:
  - **1st Fund Milestone (55%)**: Automatically credited as cash inflow upon reaching *First Fund Credited (UTR Updated)* status.
  - **Final Fund Milestone (45%)**: Automatically credited upon reaching *Final Fund Credited (UTR Updated)* status.
- Computes overall scheme fund recovery rates and pending government receivables.

### 2. Dynamic Date-Based Scheme GST & Fittings Settings (`/settings`)
- Configurable date ranges for statutory deduction calculations:
  - **Pre-22/09/2025**: 12% GST + 5% Fittings deduction.
  - **Post-22/09/2025**: 5% GST + 5% Fittings deduction.
- Dealer commission base is dynamically computed using the project's **Invoiced Date** against active tax slabs without hardcoded rates:
  $$\text{Base Amount} = \frac{\text{Quotation Subsidy Amount}}{(1 + \text{GST\%}) \times (1 + \text{Fittings\%})}$$

### 3. Load Order Batch Upload & Inventory Ingestion (`/imports/load-order`)
- Batch dispatch ingestion from daily lorry load order spreadsheets:
  - Auto-detects dispatch date from header and parses project Application IDs.
  - **Dual Material Entry**: Captures **Govt Count (On-Paper)** alongside **Actual Count (Physical)**.
  - **Inventory Protection**: Deducts physical warehouse inventory **strictly for Actual counts**.
  - **Smart Invoice Numbering**: Pure numeric increment auto-suggest (e.g. typing `300` automatically sequences `301`, `302`, etc., with per-row manual editing).
  - Automatically updates linked Government Projects with `INVOICED` status and dispatch date.

### 4. Raw Material Procurement & Financial Intelligence (`/reports`)
- Comprehensive P&L Statement and Cash Position tracking:
  - **Total Cash Inflows**: Government Funds (55% + 45%) + Direct Sales Collections.
  - **Total Cash Outflows**: Raw Material Purchases (`StockReceipt`) + Operating Expenses + Staff Payroll + Dealer Commissions Paid.
  - Detailed procurement breakdown by vendor, material item, and purchase bill history.

### 5. Multi-Device Progressive Web App (PWA)
- Complete standalone installation support across:
  - **Android (Chrome / Samsung Browser)**: 1-click native install prompt with fallback menu guide.
  - **iOS (Safari)**: Step-by-step Share -> Add to Home Screen modal.
  - **Desktop (Chrome / Edge / Brave)**: Native address bar omnibox installation.
  - Brand-consistent icons and splash screens.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Backend Setup & Run

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Set DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET in .env

# Run database migrations and seeders
npm run db:migrate

# Start development server
npm run dev
```
- Backend API runs on: `http://localhost:5000`
- Seed initial admin account: `npm run seed:admin`

### 2. Frontend Setup & Run

```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```
- Frontend client runs on: `http://localhost:3000`
- Production build: `npm run build`

---

## 🛡️ Production Verification & Quality Standards

- **Zero TypeScript overhead**: Clean, maintainable JavaScript (React 19 + Node.js + Express).
- **Strict Tenant & Role Scoping**: All destructive routes are guarded against privilege escalation.
- **Transactional Writes**: All batch Excel imports, load order stock deductions, and dealer merges run inside atomic PostgreSQL transactions.
