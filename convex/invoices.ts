import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("invoices").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByResendEmailId = query({
  args: { resendEmailId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_resendEmailId", (q) =>
        q.eq("resendEmailId", args.resendEmailId),
      )
      .unique();
  },
});

export const getByScheduledReminderId = query({
  args: { scheduledReminderId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .withIndex("by_scheduledReminderId", (q) =>
        q.eq("scheduledReminderId", args.scheduledReminderId),
      )
      .unique();
  },
});

export const clearScheduledReminderId = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { scheduledReminderId: undefined });
  },
});

export const create = mutation({
  args: {
    clientName: v.string(),
    clientEmail: v.string(),
    amount: v.number(),
    description: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("invoices", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("invoices"),
    status: v.union(
      v.literal("pending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("bounced"),
      v.literal("delayed"),
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const setResendEmailId = mutation({
  args: {
    id: v.id("invoices"),
    resendEmailId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { resendEmailId: args.resendEmailId });
  },
});

export const setScheduledReminderId = mutation({
  args: {
    id: v.id("invoices"),
    scheduledReminderId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      scheduledReminderId: args.scheduledReminderId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("invoices"),
    clientName: v.string(),
    clientEmail: v.string(),
    amount: v.number(),
    description: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const togglePaid = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.id);
    if (!invoice) throw new Error("Invoice not found");
    await ctx.db.patch(args.id, {
      paidAt: invoice.paidAt ? undefined : Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("invoices") },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("webhookEvents")
      .withIndex("by_invoiceId", (q) => q.eq("invoiceId", args.id))
      .collect();
    for (const event of events) {
      await ctx.db.delete(event._id);
    }
    await ctx.db.delete(args.id);
  },
});
