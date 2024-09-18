import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  /**
   * {@link https://trpc.io/docs/v11/data-transformers}
   */
  transformer: superjson,
  /**
   * {@link https://trpc.io/docs/v11/error-formatting}
   */
  errorFormatter({ shape }) {
    return shape;
  },
});

export const createCallerFactory = t.createCallerFactory;

/**
 * Create a router
 * {@link https://trpc.io/docs/v11/router}
 */
export const router = t.router;

/**
 * Create an unprotected procedure
 * {@link https://trpc.io/docs/v11/procedures}
 **/
export const publicProcedure = t.procedure;

/**
 * {@link https://trpc.io/docs/v11/merging-routers}
 */
export const mergeRouters = t.mergeRouters;

/**
 * Protected base procedure
 */
export const authedProcedure = t.procedure.use(function isAuthed(opts) {
  const user = opts.ctx.session?.user;

  if (!user?.semaphoreId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return opts.next({
    ctx: {
      user: {
        ...user,
      },
    },
  });
});
