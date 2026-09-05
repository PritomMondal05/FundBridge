# 🌉 FundBridge

> **University Startup Crowdfunding & Angel Investment Marketplace for Bangladesh**

FundBridge is a trust-focused, milestone-driven crowdfunding and angel investment marketplace tailored for Bangladeshi university student entrepreneurs, young graduates, and corporate alumni angel investors. 

The platform bridges the trust and funding gap in early-stage student startups by combining identity verification (Student ID, NID), milestone-based escrow tranches, flexible return structures (Revenue Share, Equity, Convertible Notes, Debt), real-time direct messaging, and AI-powered pitch generation.

---

## 🚀 Features

### 🎓 Student Founder Portal
* **Campaign & Pitch Creation**: Launch fundraising campaigns with financial targets, video embeds, equity models, and milestone schedules.
* **AI Pitch Optimizer**: Generate impactful pitch bios, slogans, and progress updates using AI assistants (`/api/ai/generate`).
* **Milestone Payouts & Escrow**: Request tranche releases as milestones are verified and completed.
* **Proposal Management**: Review, accept, or reject incoming investment term sheets from investors.
* **Public Timeline Updates**: Publish milestone progress updates and announcements directly to supporters.

### 💼 Alumni Backer & Investor Portal
* **Startup Marketplace & Discovery**: Browse verified campaigns filtered by category, funding target, startup stage, and university/location.
* **3-Startup Comparison Matrix**: Evaluate up to 3 ventures head-to-head on key metrics, valuation, traction, and milestone timelines.
* **Term Sheet Generator**: Create customized investment proposals supporting Revenue Share, Equity %, Convertible Notes, and Debt.
* **Watchlist & Bookmarking**: Pin promising startups for quick tracking and comparison.
* **Direct Real-Time Chat**: Engage directly with founders (<300ms latency) via built-in chat messaging.

### 🛡️ Super Administrator Portal
* **Verification & Vetting**: Review and verify student IDs, National IDs (NID), passports, and credentials.
* **Campaign Moderation**: Audit pending campaigns before public listing.
* **Financial Oversight & Escrow**: Monitor wallet transactions, milestone payouts, and hash receipts.

---

## 🛠️ Tech Stack

### **Frontend**
* **Framework**: React 19 + Vite 8
* **Styling**: Tailwind CSS v4 & Custom Design System (Horizon Sky-Blue `#0284c7` & Lush Pine Green `#059669`)
* **Animations**: GSAP (GreenSock Animation Platform)
* **Icons**: Lucide React Icons
* **HTTP Client**: Axios

### **Backend & Database**
* **Runtime**: Node.js & Express.js (RESTful API & Serverless API via `api/server.js`)
* **Architecture**: Clean MVC (Model-View-Controller) architecture
* **Database**: Supabase Cloud PostgreSQL Database (`supabase/01_schema_and_tables.sql`)
* **Real-time Messaging**: Socket.io
* **Authentication**: JSON Web Tokens (JWT) & Bcrypt password hashing
* **Deployment**: Configured for Vercel Cloud deployment (`vercel.json`)

---

## 📁 Project Structure

```text
FundBridge/
├── backend/                  # Express.js REST API & Supabase database integration
│   ├── config/               # Supabase and Socket.IO configurations
│   ├── controllers/          # Business logic controllers (auth, campaign, proposal, wallet, etc.)
│   ├── middlewares/          # Upload and error handling middlewares
│   ├── models/               # Supabase data models & fallback sync operations
│   ├── routes/               # Modular Express API route definitions
│   ├── utils/                # In-memory stores, file persistence & data normalizers
│   ├── app.js                # Express app setup and middleware wiring
│   └── server.js             # Server startup and Socket.IO listener (Port 5001)
├── frontend/                 # React (Vite) Single Page Application
│   ├── src/
│   │   ├── components/       # Reusable UI components & modals
│   │   ├── context/          # Auth & App state providers
│   │   ├── pages/            # Application views (Founders, Investors, Admin, Pitch)
│   │   └── utils/            # Helper functions & API instances
│   └── vite.config.js        # Vite build configuration
├── supabase/                 # Supabase PostgreSQL SQL scripts organized by purpose
│   ├── 01_schema_and_tables.sql      # Core tables, relations, and RLS policies
│   ├── 02_seed_initial_data.sql      # 100 founders, 30 investors, 50 campaigns
│   ├── 03_realtime_notifications.sql # Realtime pub/sub & notification indexes
│   └── README.md                     # Database setup and execution instructions
├── api/                      # Vercel Serverless Function entrypoint (`api/server.js`)
├── Assets/                   # Visual assets & branding graphics
├── PRD.txt                   # Product Requirement Document
├── INSTRUCTION.txt           # Setup and execution guide
├── package.json              # Workspace root configuration & script runner
└── vercel.json               # Vercel deployment configuration
```

---

## ⚡ Quick Start & Installation

### Prerequisites
* **Node.js** (v18.0.0 or higher, recommended v20 LTS)
* **npm** (v9.0.0 or higher)
* **Supabase Account** (optional — platform includes automatic offline fallback catalog)

---

### 1. Install Dependencies
Run the command below in the root directory to install dependencies for the root workspace, frontend, and backend simultaneously:

```bash
npm run install-all
```

---

### 2. Database Setup (Supabase / In-Memory Fallback)

#### Option A: Supabase Cloud PostgreSQL (Recommended for Production)
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing project.
3. Open the **SQL Editor** -> **New query**.
4. Run the SQL migration scripts in this order:
   - `supabase/01_schema_and_tables.sql` (Creates all 18 tables, relations, and pgcrypto)
   - `supabase/02_seed_initial_data.sql` (Populates 100 founders, 30 investors, 50 campaigns)
   - `supabase/03_realtime_notifications.sql` (Configures real-time notifications and indexes)
5. Test your database connection anytime from terminal:
   ```bash
   npm run test:db
   ```

#### Option B: Offline / In-Memory Fallback (Zero Setup)
If Supabase is not configured, the backend automatically boots using its built-in JSON catalog with 100 verified founders, 30 investors, 2 admins, and 50 startup campaigns. All edits and milestones persist locally to `backend/s3_*.json`.

---

### 3. Environment Setup

Pre-configured `.env` files are already included for local development. You can customize them if desired:

**`backend/.env`**:
```env
PORT=5001
SUPABASE_URL=https://eefbczvxcnceqjilrype.supabase.co
SUPABASE_KEY=sb_publishable_zCJDrvH8o0SHZK_iDcU68w_ZyCAg9W8
JWT_SECRET=fundbridge_jwt_secret_dev_2026
GEMINI_API_KEY=your_optional_gemini_api_key
```

**`frontend/.env`**:
```env
VITE_API_URL=http://localhost:5001
VITE_API_BASE=http://localhost:5001
```

---

### 4. Run the Application
Start both the Frontend and Backend concurrently with a single command:

```bash
npm start
```

* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
* **Backend Campaigns Endpoint**: [http://localhost:5001/api/campaigns](http://localhost:5001/api/campaigns)

> **Tip:** You can also run them in separate terminals:
> - Backend only: `npm run backend` (or `cd backend && npm run dev`)
> - Frontend only: `npm run frontend` (or `cd frontend && npm run dev`)

---

## 🔑 Demo Login Credentials

The frontend Auth Modal includes **One-Click Demo Login** buttons for instant access:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **👑 Super Admin** | `admin@fundbridge.com` | `admin123` | Full verification, escrow approvals, campaign audits |
| **💼 Alumni Investor** | `nazmus@gmail.com` | `1234` | Portfolio management, term sheets, direct chat |
| **🚀 Student Founder** | `adibnayem@gmail.com` | `1234` | Pitch creation, milestone tranche claims, updates |
| **🛡️ Backup Admin** | `admin2@fundbridge.com` | `admin123` | Secondary administrative management |

---

## 📜 Available NPM Scripts

From the workspace root directory, you can run:

* `npm start`: Runs both frontend (Vite :5173) and backend (Express :5001) concurrently.
* `npm run install-all`: Installs root, frontend, and backend packages.
* `npm run frontend`: Starts only the React frontend dev server (`http://localhost:5173`).
* `npm run backend`: Starts only the Node.js backend server (`http://localhost:5001`).
* `npm run test:db`: Tests Supabase connection and displays user table counts.
* `npm run seed`: Generates and updates backend seed data.
* `npm run build`: Installs all dependencies and builds the production bundle for frontend.

---

## 🌐 Deployment

FundBridge is ready for deployment on **Vercel**:
1. Connect your repository to Vercel.
2. Select Node.js as the runtime.
3. Configure the environment variables (`SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`).
4. Vercel automatically detects [`vercel.json`](vercel.json) and routes API traffic through [`api/server.js`](api/server.js).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

