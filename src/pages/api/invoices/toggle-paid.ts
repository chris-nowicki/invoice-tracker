import type { APIRoute } from "astro";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../../../../convex/_generated/api";
import { json } from "../../../lib/json";

export const prerender = false;

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);
const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
  try {
    const { invoiceId } = await request.json();
    if (!invoiceId) {
      return json({ error: "invoiceId is required" }, 400);
    }

    const invoice = await convex.query(api.invoices.getById, { id: invoiceId });
    if (!invoice) {
      return json({ error: "Invoice not found" }, 404);
    }

    const markingAsPaid = !invoice.paidAt;

    await convex.mutation(api.invoices.togglePaid, { id: invoiceId });

    const eventType = markingAsPaid
      ? "invoice.marked_paid"
      : "invoice.marked_unpaid";
    await convex.mutation(api.webhookEvents.create, {
      invoiceId,
      eventType,
      payload: JSON.stringify({ paidAt: markingAsPaid ? Date.now() : null }),
    });

    // If marking as paid and there's a scheduled reminder, cancel it
    if (markingAsPaid && invoice.scheduledReminderId) {
      try {
        await resend.emails.cancel(invoice.scheduledReminderId);
        await convex.mutation(api.invoices.clearScheduledReminderId, {
          id: invoiceId,
        });
      } catch (cancelErr) {
        console.error("Failed to cancel scheduled reminder:", cancelErr);
      }
    }

    return json({ success: true, paidAt: markingAsPaid });
  } catch (err) {
    console.error("Toggle paid error:", err);
    return json({ error: "Failed to toggle paid status" }, 500);
  }
};
