import { v } from "convex/values";
import { authenticatedMutation, authenticatedQuery } from "./helpers";
import { internalMutation } from "../_generated/server";

export const upsert = authenticatedMutation({
  args: {
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { directMessage }) => {
    // check if dm already exists
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_direct_message", (q) =>
        q.eq("user", ctx.user._id).eq("directMessage", directMessage)
      )
      .unique();
    const expiresAt = Date.now() + 1000 * 5;
    // update it if it exists
    if (existing) {
      await ctx.db.patch(existing._id, {
        user: ctx.user._id,
        directMessage,
        expiresAt,
      });
      // create it if it doesn't exist
    } else {
      await ctx.db.insert("typingIndicators", {
        user: ctx.user._id,
        directMessage,
        expiresAt,
      });
    }
  },
});

export const list = authenticatedQuery({
  args: {
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { directMessage }) => {
    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_direct_message", (q) =>
        q.eq("directMessage", directMessage)
      )
      .filter((q) => q.neq(q.field("user"), ctx.user._id))
      .collect();

    return await Promise.all(
      typingIndicators.map(async (indicator) => {
        const user = await ctx.db.get(indicator.user);
        if (!user) {
          throw new Error("User does not exist.");
        }
        return user.username;
      })
    );
  },
});

export const remove = internalMutation({
  args: {
    directMessage: v.id("directMessages"),
    user: v.id("users"),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { directMessage, expiresAt }) => {
    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_direct_message", (q) =>
        q.eq("directMessage", directMessage)
      )
      .first();
    if (existing && (!expiresAt || existing.expiresAt === expiresAt)) {
      await ctx.db.delete(existing._id);
    }
  },
});
