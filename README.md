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

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Convex](https://convex.dev) account (free tier works)
- A [Resend](https://resend.com) account with a verified domain

### Setup

1. Clone the repo and install dependencies:

   ```sh
   git clone <repo-url>
   cd invoice-app
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```sh
   cp .env.example .env
   ```

   | Variable | Where to find it |
   | :--- | :--- |
   | `CONVEX_DEPLOYMENT` | Convex dashboard → Settings |
   | `PUBLIC_CONVEX_URL` | Convex dashboard → Settings |
   | `PUBLIC_CONVEX_SITE_URL` | Convex dashboard → Settings |
   | `RESEND_API_KEY` | Resend dashboard → Settings → API Keys |
   | `RESEND_WEBHOOK_SECRET` | Resend dashboard → Webhooks → signing secret |

3. Start the Convex dev server (syncs schema and functions):

   ```sh
   npx convex dev
   ```

4. In a separate terminal, start the Astro dev server:

   ```sh
   pnpm dev
   ```

   The app will be running at `http://localhost:4321`.

### Webhook Setup

1. In the Resend dashboard, go to **Webhooks** and create a new endpoint pointing to:

   ```
   https://<your-domain>/api/webhooks/resend
   ```

2. Subscribe to these events: `email.sent`, `email.delivered`, `email.opened`, `email.bounced`, `email.delivery_delayed`

3. For local development, use a tunnel like [ngrok](https://ngrok.com) to expose localhost:

   ```sh
   ngrok http 4321
   ```

4. Copy the signing secret from the webhook details page into `RESEND_WEBHOOK_SECRET` in your `.env`

## How Webhooks Work

When you send an email through Resend, it tracks the email's full lifecycle. As the email moves through states — sent, delivered, opened — Resend POSTs events to your webhook endpoint. This app verifies each webhook signature using Svix, maps the event to an invoice status, logs it to the database, and updates the UI in real time via Convex. This is what powers the event timeline visible in each invoice row.

## Project Structure

```
src/
  pages/api/
    invoices/send.ts            — Send invoice email + schedule reminder
    invoices/toggle-paid.ts     — Toggle paid status, cancel reminder if paid
    invoices/cancel-reminder.ts — Cancel a scheduled reminder
    webhooks/resend.ts          — Receive and process Resend webhook events
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
    json.ts                     — JSON response helper
convex/
  schema.ts                     — Database schema (invoices, webhookEvents)
  invoices.ts                   — Invoice queries and mutations
  webhookEvents.ts              — Webhook event queries and mutations
```
