# Relok8 — Convex Setup & Environment Variables Guide

This guide walks you through connecting **Convex** to Relok8, configuring all required environment variables, and deploying backend functions and schemas.

---

## 1. Overview: What Convex Does in Relok8

Relok8 has transitioned to **Convex** for its real-time data and transactional engine:
- **Reactive Queries:** Listings update instantaneously across all connected browsers.
- **15-minute EarlyLock Atomic Holds (`convex/listings.ts`):** Deterministic hold mutation with automatic countdown timer preventing double-booking during lease takeovers.
- **Stripe Escrow Manual Capture (`convex/payments.ts`):** Creates an authorization hold (149 PLN base hold + 39 PLN Verification + 59 PLN Meldunek Pack).
- **WhatsApp Cloud API Integration (`convex/whatsapp.ts`):** Pushes interactive lease approval requests to landlords with quick reply buttons (`APPROVE_LEASE` / `REJECT_LEASE`).
- **AI Proxy Messaging (`convex/aiMessages.ts`):** Gemini-powered queries for university proximity calculations and listing embedding similarity.

---

## 2. All Variables Checklist

### A. Frontend / Client Variables (Set in `.env` or in AI Studio)
| Variable Name | Required | Default / Example | Purpose |
|---|---|---|---|
| `VITE_CONVEX_URL` | **Yes** | `https://your-deployment-name.convex.cloud` | Connects the React client (`convexClient` & `useQuery` / `useMutation`) to your Convex deployment. |
| `CONVEX_DEPLOYMENT` | **Yes** (for CLI) | `dev:your-deployment-name` | Identifies which Convex cloud deployment is targeted when running `npx convex dev` or `npx convex deploy`. |

> **Note:** Relok8 includes an in-app URL tester and connection manager in the Admin Console / Account page. You can paste your `https://*.convex.cloud` URL directly into the UI to test and connect instantly!

---

### B. Backend Action Variables (Set in Convex Cloud Dashboard)
Convex backend actions run in the cloud and access variables via `process.env`. Configure these in **Convex Dashboard > Settings > Environment Variables** (or via `npx convex env set`):

| Variable Name | Required | Example | Purpose |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Optional / For Payments | `sk_test_...` or `sk_live_...` | Authorizes Stripe manual capture escrow intents in `convex/payments.ts`. |
| `STRIPE_PUBLISHABLE_KEY` | Optional | `pk_test_...` | For Stripe client checkout widgets. |
| `WHATSAPP_TOKEN` | Optional / For WhatsApp | `EAAG...` | Meta WhatsApp Cloud API access token for dispatching landlord notifications. |
| `WHATSAPP_PHONE_NUMBER_ID` | Optional / For WhatsApp | `1029384756` | Meta WhatsApp Business phone number ID. |
| `GEMINI_API_KEY` | Optional / Injected | `AIzaSy...` | Powers Gemini AI proxy and embedding calculations in `convex/aiMessages.ts`. |

---

## 3. Step-by-Step Setup Instructions

### Step 1: Sign Up & Install Convex
If you don't already have a Convex account:
1. Open [dashboard.convex.dev](https://dashboard.convex.dev) and log in with GitHub or email.
2. In your project terminal, run:
```bash
npx convex dev
```
3. Convex will prompt you to log in in your browser and will automatically configure your project.

### Step 2: Retrieve Your Deployment URL
When `npx convex dev` finishes starting, it prints your deployment URL:
```
Deploying to: https://swift-otter-412.convex.cloud
```
You can also copy this URL anytime from **Convex Dashboard > Settings > URL & Deploy Key**.

### Step 3: Add to Environment
In your `.env` file (or host configuration):
```env
VITE_CONVEX_URL="https://swift-otter-412.convex.cloud"
CONVEX_DEPLOYMENT="dev:swift-otter-412"
```

### Step 4: Configure Backend Secrets in Convex
Set backend secrets using the Convex CLI or dashboard:
```bash
npx convex env set STRIPE_SECRET_KEY=sk_test_51...
npx convex env set WHATSAPP_TOKEN=EAAG...
npx convex env set WHATSAPP_PHONE_NUMBER_ID=1092837465
npx convex env set GEMINI_API_KEY=your_gemini_key
```

### Step 5: Deploy Functions & Schema
To deploy all schemas and backend mutations to production:
```bash
npx convex deploy
```

---

## 4. Testing Your Setup in Relok8

1. Go to the **Admin Console** (or Account > Admin Console tab).
2. Click on the **Convex Engine** tab.
3. Check the **Connection Mode**:
   - 🟢 **Live Convex Cloud**: Connected and receiving real-time updates!
   - 🟡 **Local Deterministic Engine**: Active in-memory/localStorage fallback mode.
4. Click **Ping** to measure round-trip latency to your Convex deployment.
5. Try clicking **Reserve** on any listing to test the 15-minute EarlyLock atomic hold mutation in real-time.

---

## 5. Troubleshooting & FAQs

- **Q: What if I haven't run `npx convex dev` yet?**  
  **A:** Relok8 automatically runs its deterministic reactive engine. All features—EarlyLock hold timer, escrow reservation calculation, and AI proxy—work 100% out of the box.

- **Q: Can I test my Convex URL without restarting the dev server?**  
  **A:** Yes! Open the Convex Guide in the app, paste your `https://*.convex.cloud` URL into the URL field, and click **Connect & Test**. It saves the URL to your browser session and connects immediately.
