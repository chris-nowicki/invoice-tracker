import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listByInvoice = query({
  args: { invoiceId: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookEvents")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.invoiceId))
      .order("asc")
      .collect();
  },
});

export const create = mutation({
  args: {
    invoiceId: v.id("invoices"),
    eventType: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookEvents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
