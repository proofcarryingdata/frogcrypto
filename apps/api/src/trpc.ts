import { logger } from "@frogcrypto/shared";
import { type JSONPOD, POD } from "@pcd/pod";
import { initTRPC, TRPCError } from "@trpc/server";
import { registerCustom, SuperJSON } from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

registerCustom<POD, string>(
  {
    isApplicable: (v): v is POD => v instanceof POD && v.verifySignature(),
    serialize: (v) => JSON.stringify(v.toJSON()),
    deserialize: (v) => POD.fromJSON(JSON.parse(v) as JSONPOD),
  },
  "pcd-pod"
);

const t = initTRPC.context<Context>().create({
  /**
   * {@link https://trpc.io/docs/v11/data-transformers}
   */
  transformer: SuperJSON,
  /**
   * {@link https://trpc.io/docs/v11/error-formatting}
   */
  errorFormatter(opts) {
    const { shape, error } = opts;

    logger.error(error.cause ?? error);

    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
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
 * Protected procedure where user must have a valid signature but not necessarily be logged in
 */
export const protectedProcedure = t.procedure.use(function isAuthed(opts) {
  const user = opts.ctx.session?.user;

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return opts.next({
    ctx: {
      user,
    },
  });
});

/**
 * Authenticated base procedure where user must have been enrolled in the app
 */
export const authedProcedure = t.procedure.use(function isAuthed(opts) {
  const user = opts.ctx.session?.user;

  if (!user?.isLoggedIn) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not logged in",
    });
  }

  return opts.next({
    ctx: {
      user,
    },
  });
});

/**
 * Protected admin procedure
 */
export const adminProcedure = t.procedure.use(function isAuthed(opts) {
  const user = opts.ctx.session?.user;

  if (!user?.isAdmin) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not admin",
    });
  }

  return opts.next({
    ctx: {
      user,
    },
  });
});
