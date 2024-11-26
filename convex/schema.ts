// Defines the database tables and types

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// v is a helper object that will both define the TypeScript object type and validate it during runtime
export default defineSchema({
  // users
  users: defineTable({
    username: v.string(),
    image: v.string(),
    clerkId: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  // friends
  friends: defineTable({
    sender: v.id("users"),
    target: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
  })
    .index("by_sender_status", ["sender", "status"])
    .index("by_target_status", ["target", "status"]),

  // direct messages
  directMessages: defineTable({}),
  directMessageMembers: defineTable({
    directMessage: v.id("directMessages"),
    user: v.id("users"),
  })
    .index("by_direct_message", ["directMessage"])
    .index("by_direct_message_user", ["directMessage", "user"])
    .index("by_user", ["user"]),

  // messages
  messages: defineTable({
    sender: v.id("users"),
    content: v.string(),
    directMessage: v.id("directMessages"),
    attachment: v.optional(v.id("_storage")),
    deleted: v.optional(v.boolean()),
    deletedReason: v.optional(v.string()),
  }).index("by_direct_message", ["directMessage"]),

  // typing indicators
  typingIndicators: defineTable({
    user: v.id("users"),
    directMessage: v.id("directMessages"),
    expiresAt: v.number(),
  })
    .index("by_direct_message", ["directMessage"])
    .index("by_user_direct_message", ["user", "directMessage"]),
});