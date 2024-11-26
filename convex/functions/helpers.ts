/* middleware functionality to check if the user is authenticated */

import {
    customQuery,
    customMutation,
    customCtx,
  } from "convex-helpers/server/customFunctions";
  import { mutation, query } from "../_generated/server";
  import { getCurrentUser } from "./user";
  
  export const authenticatedQuery = customQuery(
    query,
    customCtx(async (ctx) => {
      const user = await getCurrentUser(ctx);
      if (!user) {
        throw new Error("Unauthorized");
      }
      return { user };
    })
  );
  
  export const authenticatedMutation = customMutation(
    mutation,
    customCtx(async (ctx) => {
      const user = await getCurrentUser(ctx);
      if (!user) {
        throw new Error("Unauthorized");
      }
      return { user };
    })
  );