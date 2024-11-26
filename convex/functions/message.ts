// functions to interact with the messages table

import { ConvexError, v } from "convex/values";
import { Doc, Id } from "../_generated/dataModel";
import { QueryCtx } from "../_generated/server";
import { authenticatedMutation, authenticatedQuery } from "./helpers";
import { internal } from "../_generated/api";

// return all messages
// query is a function that fetches data
// 'collect()' gathers and returns it all
// ctx: is a common object in convex. It is used to provide access to utilities and services, such as the DB.
// query functions use ".collect()" to gather the output and expose in the return statement.
// handler: is a function that defines the logic for processing a query or mutation.
export const list = authenticatedQuery({
  args: {
    directMessage: v.id("directMessages"),
  },
  handler: async (ctx, { directMessage }) => {
    // get the user object
    const member = await userMessageAuthorization(ctx, directMessage);
    if (!member) throw new Error("You are not a member of this DM");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_direct_message", (q) =>
        q.eq("directMessage", directMessage)
      )
      .collect();
    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.sender);
        const attachment = msg.attachment
          ? await ctx.storage.getUrl(msg.attachment)
          : undefined;
        return {
          ...msg,
          attachment,
          sender,
        };
      })
    );
  },
});

// create a new message
// mutation is a function that modifies data in a db (also creates it)
// conve requires use the "v" object to assign types and enable runtime verification
export const create = authenticatedMutation({
  args: {
    content: v.string(),
    directMessage: v.id("directMessages"),
    attachment: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { content, attachment, directMessage }) => {
    const welcome = await userMessageAuthorization(ctx, directMessage);
    if (!welcome) throw new Error("You are not a member of this DM");
    const messageId = await ctx.db.insert("messages", {
      sender: ctx.user._id,
      content,
      attachment,
      directMessage: directMessage,
    });
    await ctx.scheduler.runAfter(0, internal.functions.typing.remove, {
      directMessage,
      user: ctx.user._id,
    });
    await ctx.scheduler.runAfter(0, internal.functions.moderation.run, {
      id: messageId,
    });
  },
});

const userMessageAuthorization = async (
  ctx: QueryCtx & { user: Doc<"users"> },
  directMessage: Id<"directMessages">
) => {
  const member = await ctx.db
    .query("directMessageMembers")
    .withIndex("by_direct_message_user", (q) =>
      q.eq("directMessage", directMessage).eq("user", ctx.user._id)
    )
    .first();
  if (!member) throw new ConvexError("You are not a member of this DM");
  else return true;
};

export const remove = authenticatedMutation({
  args: {
    id: v.id("messages"),
  },
  handler: async (ctx, { id }) => {
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message not found");
    if (message.sender !== ctx.user._id)
      throw new Error("You are not the sender of this message");

    await ctx.db.delete(id);
    if (message.attachment) {
      await ctx.storage.delete(message.attachment);
    }
  },
});

export const generateUploadUrl = authenticatedMutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
