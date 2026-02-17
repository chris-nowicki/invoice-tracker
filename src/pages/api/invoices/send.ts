import type { APIRoute } from "astro";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../../../../convex/_generated/api";
import { invoiceEmailHtml, reminderEmailHtml } from "../../../lib/emailTemplate";
import { formatCurrency } from "../../../lib/formatCurrency";
import { json } from "../../../lib/json";
import { generateInvoicePdf } from "../../../lib/pdf";

export const prerender = false;

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);
const resend = new Resend(import.meta.env.RESEND_API_KEY);

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

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

    const formattedAmount = formatCurrency(invoice.amount);
    const shortId = invoice._id.slice(-8).toUpperCase();

    const emailData = {
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      invoiceId: shortId,
      amount: invoice.amount,
      description: invoice.description,
      dueDate: invoice.dueDate,
    };

    const pdfBuffer = generateInvoicePdf(emailData);

    const { data: emailResult, error: emailError } =
      await resend.emails.send({
        from: "invoices@invoices.chrisnowicki.dev",
        to: [invoice.clientEmail],
        subject: `Invoice — ${formattedAmount}`,
        html: invoiceEmailHtml(emailData),
        attachments: [
          {
            filename: `invoice-${shortId}.pdf`,
            content: pdfBuffer,
          },
        ],
      });

    if (emailError) {
      console.error("Resend API error:", emailError);
      return json({ error: "Failed to send email", details: emailError }, 500);
    }

    // Update invoice status and store email ID
    await convex.mutation(api.invoices.updateStatus, {
      id: invoiceId,
      status: "sent",
    });
    await convex.mutation(api.invoices.setResendEmailId, {
      id: invoiceId,
      resendEmailId: emailResult!.id,
    });

    // Schedule reminder if due date is more than 3 days away
    let scheduledReminderId: string | null = null;
    const dueDate = new Date(invoice.dueDate + "T00:00:00");
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + THREE_DAYS_MS);

    if (dueDate > threeDaysFromNow) {
      const reminderDate = new Date(dueDate.getTime() - THREE_DAYS_MS);

      try {
        const { data: reminderResult } = await resend.emails.send({
          from: "invoices@invoices.chrisnowicki.dev",
          to: [invoice.clientEmail],
          subject: `Payment Reminder — ${formattedAmount}`,
          html: reminderEmailHtml(emailData),
          scheduledAt: reminderDate.toISOString(),
        });

        if (reminderResult) {
          scheduledReminderId = reminderResult.id;
          await convex.mutation(api.invoices.setScheduledReminderId, {
            id: invoiceId,
            scheduledReminderId: reminderResult.id,
          });
        }
      } catch (reminderErr) {
        console.error("Failed to schedule reminder:", reminderErr);
      }
    }

    return json({
      success: true,
      emailId: emailResult!.id,
      scheduledReminderId,
    });
  } catch (err) {
    console.error("Send invoice error:", err);
    return json({ error: "Internal server error" }, 500);
  }
};
