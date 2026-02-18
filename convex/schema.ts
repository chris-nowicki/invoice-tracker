import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  invoices: defineTable({
    clientName: v.string(),
    clientEmail: v.string(),
    amount: v.number(),
    description: v.string(),
    dueDate: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("bounced"),
      v.literal("delayed"),
    ),
    resendEmailId: v.optional(v.string()),
    scheduledReminderId: v.optional(v.string()),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_resendEmailId", ["resendEmailId"])
    .index("by_scheduledReminderId", ["scheduledReminderId"]),
  webhookEvents: defineTable({
    invoiceId: v.id("invoices"),
    eventType: v.string(),
    payload: v.string(),
    createdAt: v.number(),
  }).index("by_invoiceId", ["invoiceId"]),
});
