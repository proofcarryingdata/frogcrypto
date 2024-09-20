/**
 * This file contains the root router of your tRPC-backend
 */
import { publicProcedure, router } from "../trpc";
import { feedsRouter } from "./feeds";
import { usersRouter } from "./users";
import { adminRouter } from "./admin";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  admin: adminRouter,
  users: usersRouter,
  feeds: feedsRouter,
});

export type AppRouter = typeof appRouter;
