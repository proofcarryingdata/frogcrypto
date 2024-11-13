import { FrogCryptoFrogDataSchema, ServerFeedSchema } from "@frogcrypto/shared";
import { inArray, sql, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import {
  feedsTable,
  frogsTable,
  socialRequestsTable,
  userScoresTable,
} from "../db/schema";
import { adminProcedure, router } from "../trpc";
import { refreshFeeds } from "../db/feeds";
import { refreshFrogCache } from "../db/frog-cache";

/**
 * Admin router for managing frogs.
 */
export const adminRouter = router({
  /**
   * List frogs in the database.
   */
  listFrogs: adminProcedure.query(() => {
    return db.select().from(frogsTable);
  }),
  /**
   * Upsert frogs in the database.
   */
  upsertFrogs: adminProcedure
    .input(z.array(FrogCryptoFrogDataSchema))
    .mutation(async ({ input: frogs }) => {
      const values = frogs.map((frog) => ({
        id: frog.id,
        uuid: frog.uuid,
        frog,
      }));

      await db
        .insert(frogsTable)
        .values(values)
        .onConflictDoUpdate({
          target: [frogsTable.id],
          set: { uuid: sql`excluded.uuid`, frog: sql`excluded.frog` },
        });

      await refreshFrogCache();
    }),

  /**
   * Delete frogs from the database.
   */
  deleteFrogs: adminProcedure
    .input(z.array(z.number()))
    .mutation(async ({ input }) => {
      await db.delete(frogsTable).where(inArray(frogsTable.id, input));

      await refreshFrogCache();
    }),

  /**
   * List feeds in the database.
   */
  listFeeds: adminProcedure.query(() => {
    return db.select().from(feedsTable);
  }),

  /**
   * Upsert feeds in the database.
   */
  upsertFeeds: adminProcedure
    .input(z.array(ServerFeedSchema))
    .mutation(async ({ input: feeds }) => {
      const values = feeds.map((feed) => ({
        id: feed.id,
        feed,
      }));

      await db
        .insert(feedsTable)
        .values(values)
        .onConflictDoUpdate({
          target: [feedsTable.id],
          set: { feed: sql`excluded.feed` },
        });

      await refreshFeeds();
    }),

  /**
   * Delete feeds from the database.
   */
  deleteFeeds: adminProcedure
    .input(z.array(z.string()))
    .mutation(async ({ input }) => {
      await db.delete(feedsTable).where(inArray(feedsTable.id, input));

      await refreshFeeds();
    }),

  dumpUsers: adminProcedure.query(async () => {
    const users = await db
      .select({
        semaphoreId: userScoresTable.semaphoreId,
        eddsaPublicKey: userScoresTable.eddsaPublicKey,
      })
      .from(userScoresTable);

    return users;
  }),

  dumpFrogConnections: adminProcedure.query(async () => {
    const frogConnections = await db
      .select({
        party1: socialRequestsTable.party1,
        party2: socialRequestsTable.party2,
        updatedAt: socialRequestsTable.updatedAt,
      })
      .from(socialRequestsTable)
      .where(eq(socialRequestsTable.status, "connected"));

    return frogConnections;
  }),

  dumpAllUsers: adminProcedure.query(async () => {
    const users = await db
      .select({
        semaphoreId: userScoresTable.semaphoreId,
        score: userScoresTable.score,
        friends: userScoresTable.friendCount,
      })
      .from(userScoresTable)
      .orderBy(desc(userScoresTable.score));
    return users;
  }),
});
