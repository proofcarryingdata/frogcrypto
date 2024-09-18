import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { auth } from "./auth";

/**
 * Creates context for an incoming request
 * {@link https://trpc.io/docs/v11/context}
 */
export const createContext = async (opts: CreateExpressContextOptions) => {
  const session = await auth(opts.req);

  return {
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
