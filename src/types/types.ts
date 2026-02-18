import type { Doc } from "../../convex/_generated/dataModel";

export type Invoice = Doc<"invoices">;
export type WebhookEvent = Doc<"webhookEvents">;

export type InvoiceStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "opened"
  | "bounced"
  | "delayed";
