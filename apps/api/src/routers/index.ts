/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from "../trpc";
import { trpcFeedsRouter } from "./feeds";
import { trpcUsersRouter } from "./users";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  users: trpcUsersRouter,
  feeds: trpcFeedsRouter,
});

export type AppRouter = typeof appRouter;
