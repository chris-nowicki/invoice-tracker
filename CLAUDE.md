# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invoice Tracker app built with Astro + React islands + Convex (real-time backend) + Tailwind CSS.

## Commands

- `pnpm dev` — Start Astro dev server
- `pnpm build` — Production build to `./dist/`
- `pnpm preview` — Preview production build
- `pnpm format` — Format with Prettier (astro + tailwindcss plugins)
- `npx convex dev` — Start Convex dev server (syncs schema/functions)
- `npx convex deploy` — Deploy Convex to production

## Architecture

**Astro + React Islands**: Astro handles pages and layouts (`src/pages/`, `src/layouts/`). React components under `src/components/react/` are loaded as interactive islands via `client:load`.

**Convex Backend**: `convex/schema.ts` defines the database schema (invoices, webhookEvents tables). Query and mutation functions live in `convex/invoices.ts` and `convex/webhookEvents.ts`. The `convex/_generated/` directory is auto-generated — never edit these files directly.

**Data Flow**: React components use Convex hooks (`useQuery`, `useMutation`) from `convex/react` for real-time data. The `ConvexProvider` is initialized in `App.tsx` with the `PUBLIC_CONVEX_URL` env var.

**Styling**: Tailwind CSS v4 via Vite plugin (configured in `astro.config.mjs`). Global styles in `src/styles/global.css`. Dark theme throughout.

## Key Types

Types in `src/types/types.ts` are derived from Convex document types (`Doc<"invoices">`, `Doc<"webhookEvents">`). Invoice statuses: `"pending" | "sent" | "delivered" | "opened" | "bounced" | "delayed"`.

## Environment Variables

- `PUBLIC_CONVEX_URL` — Convex deployment URL (required, must use PUBLIC_ prefix for client access)
