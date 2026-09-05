# FundBridge Supabase Database Scripts

All Supabase PostgreSQL database scripts have been organized into this single directory according to their specific purpose and workflow.

---

## 📁 File Structure & Purpose

| File | Purpose / Work | Description |
|---|---|---|
| **[`01_schema_and_tables.sql`](01_schema_and_tables.sql)** | **Database Schema & Table Creation** | Creates the `pgcrypto` extension, all 18 core relational tables (`users`, `campaigns`, `proposals`, `payouts`, `wallet_deposits`, `wallet_accounts`, `disputes`, `audit_logs`, `messages`, `watchlist`, `investor_connections`, `bookmarked_founders`, `campaign_updates`, `relief_campaigns`, `relief_donations`, `trash`, `notifications`, `investment_trends`, `partnerships`), safe foreign keys, indexes, and disables Row Level Security (RLS) for seamless platform operations. |
| **[`02_seed_initial_data.sql`](02_seed_initial_data.sql)** | **Initial Seed Data** | Populates the database with clean UPSERT (`ON CONFLICT DO UPDATE`) statements for: <br/>• **1 Default Super Admin** (`admin@fundbridge.com`)<br/>• **100 Verified Student Founders** (`usr_founder_1` to `usr_founder_100`)<br/>• **30 Verified Investors & Angels** (`usr_investor_1` to `usr_investor_30`)<br/>• **50 Startup Campaigns** (`camp_1` to `camp_50`) with realistic milestones<br/>• **Default Audit Hash & Sample Deals** |
| **[`03_realtime_notifications.sql`](03_realtime_notifications.sql)** | **Realtime Pub/Sub & Indexes** | Configures Supabase Realtime publication (`supabase_realtime`) on the `notifications` table, adds `sender_id`, `link_url`, and `event_key` columns, and applies composite performance indexes for sub-millisecond query latency. |

---

## 🚀 Execution Order in Supabase SQL Editor

If you are setting up or resetting your Supabase database:

1. Open your **Supabase Project Dashboard** → **SQL Editor**.
2. Run **`01_schema_and_tables.sql`** to create all tables and structures.
3. Run **`02_seed_initial_data.sql`** to insert all 100 student founders, 30 investors, and 50 campaigns.
4. Run **`03_realtime_notifications.sql`** to enable real-time notifications and indexes.
