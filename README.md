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
│   └── server.js             # Server startup and Socket.IO listener (Port 5000)
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
* **Node.js** (v18.0.0 or higher)
* **npm** (v9.0.0 or higher)
* **Supabase Account** (for PostgreSQL database host)

---

### 1. Install Dependencies
Run the command below in the root directory to install dependencies for the root workspace, frontend, and backend simultaneously:

```bash
npm run install-all
```

---

### 2. Database Setup (Supabase)
1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Create a new project or select an existing project.
3. Open the **SQL Editor** -> **New query**.
4. Run `supabase/01_schema_and_tables.sql` to initialize all 18 tables and relationships.
5. Run `supabase/02_seed_initial_data.sql` to populate 100 verified founders, 30 investors, and 50 startup campaigns.
6. Run `supabase/03_realtime_notifications.sql` to configure real-time notifications.

---

### 3. Environment Setup

Create `.env` files in both `backend` and `frontend` folders (or root as required):

**`backend/.env`**:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=gemini_api_key
```

**`frontend/.env`**:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

### 4. Run the Application
Start both the Frontend and Backend concurrently with a single command:

```bash
npm start
```

* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 📜 Available NPM Scripts

From the workspace root directory, you can run:

* `npm run install-all`: Installs root, frontend, and backend packages.
* `npm start`: Runs both frontend (Vite) and backend (Express) concurrently.
* `npm run frontend`: Starts only the React frontend dev server (`http://localhost:5173`).
* `npm run backend`: Starts only the Node.js backend server (`http://localhost:5000`).
* `npm run seed`: Seeds initial demo campaigns and accounts into the database.
* `npm run build`: Installs all dependencies and builds the production bundle for frontend.

---

## 🌐 Deployment

FundBridge is ready for deployment on **Vercel**:
1. Connect your repository to Vercel.
2. Select Node.js as the runtime.
3. Configure the environment variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `JWT_SECRET`).
4. Vercel automatically detects [`vercel.json`](file:///e:/WWW/FundBridge/vercel.json) and routes API traffic through [`api/server.js`](file:///e:/WWW/FundBridge/api/server.js).

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
