import { sql, eq, count, or, and, inArray } from "drizzle-orm";
import { socialRequestsTable, userIdsTable, userScoresTable } from "./schema";
import { db, type Transaction } from ".";

export const incrementScore = async (
  tx: Transaction,
  semaphoreId: string,
  increment = 1
): Promise<typeof userScoresTable.$inferSelect> => {
  const [result] = await tx
    .insert(userScoresTable)
    .values({
      semaphoreId,
      score: increment,
      friendCount: 0,
    })
    .onConflictDoUpdate({
      target: userScoresTable.semaphoreId,
      set: {
        score: sql`${userScoresTable.score} + ${increment}`,
      },
    })
    .returning();

  if (!result) {
    throw new Error("Failed to increment score");
  }

  return result;
};

export const recordFriendCount = async (
  tx: Transaction,
  semaphoreIds: [string, string]
): Promise<(typeof userScoresTable.$inferInsert)[]> => {
  const result = await tx
    .update(userScoresTable)
    .set({
      friendCount: sql`${userScoresTable.friendCount} + 1`,
      score: sql`${userScoresTable.score} + 1`,
    })
    .where(inArray(userScoresTable.semaphoreId, semaphoreIds))
    .returning();

  if (result.length === 0) {
    throw new Error("Failed to record friend count");
  }

  return result;
};

export async function getSemaphoreId(
  signerPk: string
): Promise<string | undefined> {
  const userId = await db
    .select({ semaphoreId: userIdsTable.semaphoreId })
    .from(userIdsTable)
    .where(eq(userIdsTable.signerPk, signerPk));
  return userId[0]?.semaphoreId;
}
