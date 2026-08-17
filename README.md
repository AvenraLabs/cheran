# Cheran Plast - Horticulture Government Project Management System

Production-grade internal management system for Cheran Plast, tracking Tamil Nadu government micro-irrigation and horticulture projects, status transitions, dealer resolution, and operational metrics.

---

## 📁 Repository Structure

```
cheran/
├── backend/                                  # Node.js + Express + Sequelize + PostgreSQL API
│   ├── config/                               # Sequelize CLI configuration
│   ├── migrations/                           # Database schema migrations
│   ├── seeders/                              # 27 TN Horticulture statuses seeder
│   ├── src/
│   │   ├── config/                           # Database connection & automated migration runner
│   │   ├── models/                           # Central model associations
│   │   ├── shared/                           # Error handlers, middlewares, uploaders
│   │   ├── utils/                            # Excel parser, date parser, normalization
│   │   └── modules/
│   │       ├── dealers/                      # Dealers management & resolution
│   │       ├── statuses/                     # Government status reference
│   │       ├── projects/                     # Operational project records & status history
│   │       └── imports/                      # 2-step Excel import engine (Preview -> Resolve -> Commit)
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/                                 # React + Vite + Tailwind CSS + Lucide Admin Panel
│   ├── src/
│   │   ├── api/                              # Axios client with toast notifications
│   │   ├── components/                       # Layout, Navbar, Sidebar, MetricCard, StatusBadge, Modal
│   │   ├── pages/                            # Dashboard, Projects, ProjectDetail, Imports, Dealers
│   │   ├── App.jsx                           # React Router routes
│   │   └── index.css                         # Warm neutral design tokens & Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── backend-skill.md                          # Universal backend architecture reference
├── frontend-skill.md                         # Admin panel frontend design system reference
└── README.md
```

---

## 🚀 Getting Started

### 1. Start the Backend API

```bash
cd backend
npm install
npm run dev
```
- Backend runs on: `http://localhost:5000`
- Automatically connects to PostgreSQL and applies pending migrations and seeders on boot.

### 2. Start the Frontend Admin Panel

```bash
cd frontend
npm install
npm run dev
```
- Frontend runs on: `http://localhost:3000`
- Proxies `/api` requests to `http://localhost:5000`.

---

## 🎯 Key Capabilities

- **Deterministic Excel Import**: Upload `.xls` and `.xlsx` files with SHA-256 duplicate detection.
- **Staged Dealer Resolution**: Unmatched dealer spellings are staged for human verification before commit.
- **Observed Status History**: Strictly records observed state transitions without guessing intermediate government workflow stages.
- **Duration Analytics**: Automatically computes days between consecutive observed stages using PostgreSQL window functions.
- **Operational Data Table**: Filter projects by status, district, block, village, dealer, and search keywords.
