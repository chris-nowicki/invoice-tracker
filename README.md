# Invoice Tracker

A full-stack invoice tracking app built to demonstrate Resend's transactional email capabilities — including sending, PDF attachments, scheduled reminders, webhook event tracking, and real-time status updates.

## Features

- **Send invoices** — transactional email with an HTML template via Resend
- **PDF attachments** — generates an invoice PDF with jsPDF and attaches it via Resend's `attachments` field
- **Scheduled reminders** — auto-schedules a payment reminder 3 days before the due date using Resend's `scheduledAt`
- **Webhook event tracking** — receives Resend webhook events (sent, delivered, opened, bounced, delayed), verifies signatures with Svix, and updates invoice status in real time
- **Smart cancellation** — cancels scheduled reminders automatically when an invoice is marked paid or an email bounces; also supports manual cancellation from the UI
- **Real-time dashboard** — Convex powers live updates so webhook events appear instantly without polling

## Tech Stack

- **Astro + React islands** — Astro handles routing and layouts, React powers interactive components
- **Convex** — real-time database and backend functions
- **Resend** — transactional email (send, schedule, cancel, webhooks)
- **Svix** — webhook signature verification
- **jsPDF** — client-side PDF generation
- **Tailwind CSS v4** — styling

## Project Structure

```
src/
  actions/index.ts              — Astro server actions (send invoice, toggle paid, cancel reminder)
  pages/api/webhooks/resend.ts  — Webhook endpoint (signature verified via Svix)
  components/react/
    App.tsx                     — Convex provider setup
    InvoiceDashboard.tsx        — Main dashboard with filtering
    InvoiceForm.tsx             — Create/edit invoice form
    InvoiceRow.tsx              — Expandable invoice row with timeline
    StatusBadge.tsx             — Invoice status badge
    WebhookTimeline.tsx         — Visual event timeline
  lib/
    emailTemplate.ts            — Invoice + reminder HTML email templates
    pdf.ts                      — PDF invoice generation
    formatCurrency.ts           — Shared currency formatter
convex/
  schema.ts                     — Database schema (invoices, webhookEvents)
  invoices.ts                   — Invoice queries and mutations
  webhookEvents.ts              — Webhook event queries and mutations
```

## Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- **Convex account** — will provide `CONVEX_DEPLOYMENT` and `PUBLIC_CONVEX_URL` ([dashboard.convex.dev](https://dashboard.convex.dev))
- **Resend account** — will provide `RESEND_API_KEY` and `RESEND_WEBHOOK_SECRET`; requires a verified sending domain ([resend.com](https://resend.com))

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Convex — from dashboard.convex.dev → your project → Settings → URL & Deploy Key
CONVEX_DEPLOYMENT=
PUBLIC_CONVEX_URL=
PUBLIC_CONVEX_SITE_URL=

# Resend — from resend.com/api-keys
RESEND_API_KEY=

# Resend Webhooks — from resend.com/webhooks → select endpoint → Signing Secret
RESEND_WEBHOOK_SECRET=
```

## Setup

### Step 1: Clone & install

```sh
git clone <repo-url>
cd invoice-tracker
pnpm install
```

### Step 2: Convex

2. Go to [https://www.convex.dev/](https://www.convex.dev/) and setup an account

1. Back in the terminal run the following to setup your convex account and project:
```sh
npx convex dev
```

You will be prompted to setup a new project and from there convex will autogenerate your `.env` variables in `.env.local`

### Step 3: Resend

1. Ensure you have an account setup at [resend.com](https://www.resend.com)
2. Go to [resend.com/api-keys](https://resend.com/api-keys) → **Create API Key**
3. Copy the value into your `.env.local` `RESEND_API_KEY` variable
11. Verify a sending domain under the **Domains** tab in the Resend dashboard
12. Update the `FROM_EMAIL` constant in `src/actions/index.ts` to use your verified domain

### Step 4: Webhook setup

When you send an email through Resend, it tracks the email's full lifecycle. As the email moves through states: sent, delivered, opened — Resend POSTs events to your webhook endpoint. This app verifies each webhook signature using Svix, maps the event to an invoice status, logs it to the database, and updates the UI in real time via Convex. This is what powers the event timeline visible in each invoice row.

Choose the option that matches your environment:

**Option A — Local development with ngrok**

1. Install [ngrok](https://ngrok.com) and run:
   ```sh
   ngrok http 4321
   ```
2. Copy the forwarding URL (e.g. `https://abc123.ngrok-free.app`)
3. In Resend, go to **Webhooks → Add webhook**
4. Set the endpoint URL to:
   ```
   https://abc123.ngrok-free.app/api/webhooks/resend
   ```
5. Subscribe to all 5 events: `email.sent`, `email.delivered`, `email.opened`, `email.bounced`, `email.delivery_delayed`
6. Click into the webhook → **Signing Secret** → copy the value into your `.envl.local` `RESEND_WEBHOOK_SECRET` variable

**Option B — Deployed URL**

1. Deploy the app (e.g. Vercel)
2. In Resend, go to **Webhooks → Add webhook**
3. Set the endpoint URL to:
   ```
   https://<your-domain>/api/webhooks/resend
   ```
4. Subscribe to all 5 events: `email.sent`, `email.delivered`, `email.opened`, `email.bounced`, `email.delivery_delayed`
5. Click into the webhook → **Signing Secret** → copy value → `RESEND_WEBHOOK_SECRET`

### Step 5: Run the app

```sh
# Terminal 1 — sync Convex schema and functions
npx convex dev

# Terminal 2 — start Astro dev server
pnpm dev
```

App runs at `http://localhost:4321`.
