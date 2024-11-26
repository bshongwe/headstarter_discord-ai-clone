import { authenticatedMutation } from "./helpers";
import { v } from "convex/values";

// wrapper on toip of a mutation. it guarantees that there is a user signed in
export const remove = authenticatedMutation({
  // the mutation takes an object with the parameters and a function as handler
  args: {
    // v.id indicates this is not a random string, but an id for the specified table
    // internal table in convex to store uploaded files
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
  },
});
