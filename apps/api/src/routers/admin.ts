import { inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { FrogCryptoFrogDataSchema } from "@frogcrypto/shared";
import { db } from "../db";
import { frogsTable } from "../db/schema";
import { adminProcedure, router } from "../trpc";

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
    }),

  /**
   * Delete frogs from the database.
   */
  deleteFrogs: adminProcedure
    .input(z.array(z.number()))
    .mutation(async ({ input }) => {
      await db.delete(frogsTable).where(inArray(frogsTable.id, input));
    }),
});
