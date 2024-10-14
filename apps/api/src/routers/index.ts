/**
 * This file contains the root router of your tRPC-backend
 */
import { type inferRouterOutputs } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { feedsRouter } from "./feeds";
import { usersRouter } from "./users";
import { adminRouter } from "./admin";
import { socialRouter } from "./social";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),

  admin: adminRouter,
  users: usersRouter,
  feeds: feedsRouter,
  social: socialRouter,
});

export type AppRouter = typeof appRouter;
export type RouterOutputs = inferRouterOutputs<AppRouter>;
