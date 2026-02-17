import type { APIRoute } from "astro";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { Webhook } from "svix";
import { api } from "../../../../convex/_generated/api";
import { json } from "../../../lib/json";

export const prerender = false;

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);
const resend = new Resend(import.meta.env.RESEND_API_KEY);

const EVENT_STATUS_MAP: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.opened": "opened",
  "email.bounced": "bounced",
  "email.delivery_delayed": "delayed",
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.text();

  // Verify webhook signature
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return json({ error: "Missing svix headers" }, 400);
  }

  let payload: { type: string; data: { email_id: string } };

  try {
    const wh = new Webhook(import.meta.env.RESEND_WEBHOOK_SECRET);
    payload = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as typeof payload;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return json({ error: "Invalid signature" }, 401);
  }

  const eventType = payload.type;
  const emailId = payload.data.email_id;

  // Look up the invoice by Resend email ID, then fall back to scheduled reminder ID
  let invoice = await convex.query(api.invoices.getByResendEmailId, {
    resendEmailId: emailId,
  });
  if (!invoice) {
    invoice = await convex.query(api.invoices.getByScheduledReminderId, {
      scheduledReminderId: emailId,
    });
  }

  if (!invoice) {
    // Return 200 to prevent retries — email ID may not match any invoice
    return json({ received: true, matched: false });
  }

  // Map event type to status and update
  const status = EVENT_STATUS_MAP[eventType];
  if (status) {
    await convex.mutation(api.invoices.updateStatus, {
      id: invoice._id,
      status: status as "sent" | "delivered" | "opened" | "bounced" | "delayed",
    });
  }

  // Log webhook event
  await convex.mutation(api.webhookEvents.create, {
    invoiceId: invoice._id,
    eventType,
    payload: body,
  });

  // On bounce, cancel scheduled reminder
  if (eventType === "email.bounced" && invoice.scheduledReminderId) {
    try {
      await resend.emails.cancel(invoice.scheduledReminderId);
    } catch (cancelErr) {
      console.error("Failed to cancel scheduled reminder:", cancelErr);
    }
  }

  return json({ received: true, matched: true, eventType });
};
