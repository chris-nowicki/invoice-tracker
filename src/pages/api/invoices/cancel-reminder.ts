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

    if (!invoice.scheduledReminderId) {
      return json({ error: "No scheduled reminder to cancel" }, 400);
    }

    await resend.emails.cancel(invoice.scheduledReminderId);

    await convex.mutation(api.invoices.clearScheduledReminderId, {
      id: invoiceId,
    });

    return json({ success: true });
  } catch (err) {
    console.error("Cancel reminder error:", err);
    return json({ error: "Failed to cancel reminder" }, 500);
  }
};
