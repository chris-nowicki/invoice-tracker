import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { ConvexHttpClient } from "convex/browser";
import { Resend } from "resend";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  invoiceEmailHtml,
  reminderEmailHtml,
} from "../lib/emailTemplate";
import { formatCurrency } from "../lib/formatCurrency";
import { generateInvoicePdf } from "../lib/pdf";

const convex = new ConvexHttpClient(import.meta.env.PUBLIC_CONVEX_URL);
const resend = new Resend(import.meta.env.RESEND_API_KEY);

const FROM_EMAIL = "invoices@invoices.chrisnowicki.dev";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

async function getInvoiceOrThrow(id: Id<"invoices">) {
  const invoice = await convex.query(api.invoices.getById, { id });
  if (!invoice) {
    throw new ActionError({ code: "NOT_FOUND", message: "Invoice not found" });
  }
  return invoice;
}

export const server = {
  invoices: {
    createAndSend: defineAction({
      input: z.object({
        clientName: z.string().min(1, "Client name is required"),
        clientEmail: z.string().email("Invalid email address"),
        amount: z.number().positive("Amount must be greater than 0"),
        description: z.string().min(1, "Description is required"),
        dueDate: z.string().min(1, "Due date is required"),
      }),
      handler: async (input) => {
        const { clientEmail, amount, dueDate } = input;

        if (new Date(dueDate + "T00:00:00") <= new Date()) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Due date must be in the future",
          });
        }

        const invoiceId = await convex.mutation(api.invoices.create, input);
        const shortId = (invoiceId as string).slice(-8).toUpperCase();
        const formattedAmount = formatCurrency(amount);
        const emailData = { ...input, invoiceId: shortId };

        const pdfBuffer = generateInvoicePdf(emailData);

        const { data: emailResult, error: emailError } =
          await resend.emails.send({
            from: FROM_EMAIL,
            to: [clientEmail],
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
          throw new ActionError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send email",
          });
        }

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
        const dueDateObj = new Date(dueDate + "T00:00:00");
        const threeDaysFromNow = new Date(Date.now() + THREE_DAYS_MS);

        if (dueDateObj > threeDaysFromNow) {
          const reminderDate = new Date(dueDateObj.getTime() - THREE_DAYS_MS);

          try {
            const { data: reminderResult } = await resend.emails.send({
              from: FROM_EMAIL,
              to: [clientEmail],
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

        return {
          success: true,
          invoiceId,
          emailId: emailResult!.id,
          scheduledReminderId,
        };
      },
    }),

    togglePaid: defineAction({
      input: z.object({
        invoiceId: z.string(),
      }),
      handler: async ({ invoiceId: rawId }) => {
        const invoiceId = rawId as Id<"invoices">;
        const invoice = await getInvoiceOrThrow(invoiceId);
        const markingAsPaid = !invoice.paidAt;

        await convex.mutation(api.invoices.togglePaid, { id: invoiceId });

        await convex.mutation(api.webhookEvents.create, {
          invoiceId,
          eventType: markingAsPaid
            ? "invoice.marked_paid"
            : "invoice.marked_unpaid",
          payload: JSON.stringify({
            paidAt: markingAsPaid ? Date.now() : null,
          }),
        });

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

        return { success: true, paidAt: markingAsPaid };
      },
    }),

    cancelReminder: defineAction({
      input: z.object({
        invoiceId: z.string(),
      }),
      handler: async ({ invoiceId: rawId }) => {
        const invoiceId = rawId as Id<"invoices">;
        const invoice = await getInvoiceOrThrow(invoiceId);

        if (!invoice.scheduledReminderId) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "No scheduled reminder to cancel",
          });
        }

        await resend.emails.cancel(invoice.scheduledReminderId);
        await convex.mutation(api.invoices.clearScheduledReminderId, {
          id: invoiceId,
        });

        return { success: true };
      },
    }),
  },
};
