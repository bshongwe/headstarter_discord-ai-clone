import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./helpers";

export const listPending = authenticatedQuery({
  handler: async (ctx) => {
    // Friends: all rows with target as current user and status "pending"
    const friends = await ctx.db
      .query("friends")
      .withIndex("by_target_status", (q) =>
        q.eq("target", ctx.user._id).eq("status", "pending")
      )
      .collect();
    // Get the sender of the friends
    return await getPartyOfInterest(ctx, friends, "sender");
  },
});

export const listAccepted = authenticatedQuery({
  handler: async (ctx) => {
    // Friends1: rows with sender as current user and status "accepted"
    const friends1 = await ctx.db
      .query("friends")
      .withIndex("by_sender_status", (q) =>
        q.eq("sender", ctx.user._id).eq("status", "accepted")
      )
      .collect();
    // Friends2: rows with target as current user and status "accepted"
    const friends2 = await ctx.db
      .query("friends")
      .withIndex("by_target_status", (q) =>
        q.eq("target", ctx.user._id).eq("status", "accepted")
      )
      .collect();
    // Get the target of the friends that current user is the sender
    const friendsWithUser1 = await getPartyOfInterest(ctx, friends1, "target");
    // Get the sender of the friends that current user is the target
    const friendsWithUser2 = await getPartyOfInterest(ctx, friends2, "sender");
    return [...friendsWithUser1, ...friendsWithUser2];
  },
});

export const createFriendRequest = authenticatedMutation({
  args: {
    username: v.string(),
  },
  handler: async (ctx, { username }) => {
    // Lookup user by username
    const target = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", username))
      .first(); // Changed from .unique() to .first()

    // Handle error if user not found
    if (!target) throw new Error("User not found");
    else if (target._id === ctx.user._id) throw new Error("Cannot add self");

    // Create a friend request if the target is valid
    await ctx.db.insert("friends", {
      sender: ctx.user._id,
      target: target._id,
      status: "pending",
    });
  },
});

export const updateStatus = authenticatedMutation({
  args: {
    id: v.id("friends"),
    status: v.union(v.literal("accepted"), v.literal("rejected")),
  },
  handler: async (ctx, { id, status }) => {
    // Find the friend with the specified ID
    const friend = await ctx.db.get(id);
    if (!friend) throw new Error("Friend not found");
    if (friend.sender !== ctx.user._id && friend.target !== ctx.user._id) {
      throw new Error("Unauthorized");
    }
    // Update the status of the friend request
    await ctx.db.patch(id, { status });
  },
});

// Generic function to map over friends and get the user object
const getPartyOfInterest = async <
  role extends "sender" | "target",
  T extends { [key in role]: Id<"users"> },
>(
  ctx: QueryCtx,
  items: T[],
  key: role
) => {
  const result = await Promise.allSettled(
    items.map(async (item) => {
      const user = await ctx.db.get(item[key]);
      if (!user) throw new Error("User not found");
      return { ...item, user };
    })
  );
  return result
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<T & { user: any }>).value);
};
