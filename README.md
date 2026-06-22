# 🚀 Autonomous AI Career Partner & Job Hunting Pipeline

An end-to-end, autonomous AI pipeline designed to completely automate the job-hunting process. Built for **Laila**, a 3rd-year Software Engineering student, this system continuously scours the internet for high-quality backend engineering internships, evaluates them using Google Gemini 2.5 Pro against her specific skills, and alerts her in real-time.

It features a **Node.js Autonomous Daemon** running on a local server, connected via Supabase Realtime to a **Next-Gen React Dashboard** deployed on Vercel.

---

## ✨ Core Architecture

The platform is split into three main highly-integrated components:

### 1. 🤖 The Autonomous Daemon (`/inbox-agent`)
A resilient, always-on Node.js background service that acts as the brain of the operation.
*   **Web Scraper (`live_scraper.js`)**: Runs hourly via cron. Scrapes Wuzzuf, LinkedIn, and university portals to find fresh Software Engineering and Backend developer roles.
*   **AI Evaluator**: Pipes the scraped jobs directly into **Google Gemini 2.5 Pro**. The LLM evaluates the job description against Laila's personal CV, scoring it on an ATS-compatibility scale and highlighting potential skill gaps.
*   **WhatsApp Web Bridge**: Integrates with `whatsapp-web.js` to instantly ping Laila's phone when a "Platinum" (high-match) job is found.
*   **Cloud Synchronizer**: Pushes evaluated jobs, telemetry logs, and state updates to a Google Sheet and Supabase.

### 2. 🌐 The Command Dashboard (`/dashboard`)
An ultra-premium, dark-mode, glassmorphism React application built with Vite and deployed on Vercel. It serves as the visual command center.
*   **Live Telemetry Stream**: A continuous, real-time feed of the daemon's internal thoughts, scraped jobs, and AI evaluations.
*   **AI Commander (Terminal)**: A sleek chat interface wired directly to the local daemon via **Supabase Realtime**. You can issue commands from your phone anywhere in the world (e.g., `/scrape`, `/status`, `/cv`), and the daemon will process it and reply instantly.
*   **Career Strategy Board**: A dynamic view fetching data from Supabase. It includes an actionable TODO list for closing skill gaps and a dynamic **Radar Chart** (built with Recharts) mapping current skills against 2026 market demands.
*   **Networking CRM**: A built-in Kanban/Table system to track networking contacts, coffee chats, and application statuses.

### 3. ☁️ The Supabase Cloud Data Layer
The entire system state is synchronized through a PostgreSQL cloud database on Supabase.
*   **`agent_chat`**: Powers the bidirectional realtime chat between the Vercel frontend and the local Node.js daemon.
*   **`skill_metrics`**: Stores dynamic skill evaluation scores.
*   **`action_items`**: Tracks strategic career moves.
*   **`networking_contacts`**: Stores CRM data.

---

## 🛠️ Technology Stack

*   **Frontend**: React, Vite, Recharts, Vanilla CSS (Glassmorphism & Micro-animations)
*   **Backend Daemon**: Node.js, Puppeteer, `whatsapp-web.js`, `node-cron`
*   **AI Engine**: Google Gemini 2.5 Pro SDK (`@google/genai`)
*   **Database & Realtime**: Supabase (PostgreSQL), Google Sheets API
*   **Hosting**: Vercel (Frontend), Local Server (Daemon)

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Supabase Project
*   A Google Gemini API Key
*   A WhatsApp account (for the bot)

### 1. Database Setup
Execute the `supabase_schema.sql` script in your Supabase SQL editor to provision the required tables and enable Realtime on `agent_chat`.

### 2. Backend Daemon Setup
1. Navigate to the `inbox-agent` directory:
   ```bash
   cd inbox-agent
   npm install
   ```
2. Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY`.
3. Start the daemon:
   ```bash
   node index.js
   ```
4. A QR code will appear in the terminal. Scan it with WhatsApp (Linked Devices) to authenticate the notification bot.

### 3. Frontend Dashboard Setup
1. Navigate to the `dashboard` directory:
   ```bash
   cd dashboard
   npm install
   ```
2. Create a `.env` file with your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Or build for production (what Vercel does automatically):
   ```bash
   npm run build
   ```

---

## 🔒 Security & Persistence
*   **Resiliency**: The scraper daemon runs on a strict hourly cron schedule. If the process crashes, the cron scheduler ensures it resurrects automatically on the next tick.
*   **Lock Bypassing**: Custom startup logic forcefully clears corrupted Puppeteer session locks (`.wwebjs_auth`) to guarantee the bot boots unattended.
*   **Cloud Isolation**: The dashboard does not talk to the backend via insecure local HTTP ports. All bidirectional communication is safely routed through Supabase Postgres replication.

---
*Built autonomously by Antigravity AI for Laila.*
