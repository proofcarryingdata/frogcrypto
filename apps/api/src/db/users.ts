import { sql, eq } from "drizzle-orm";
import { userIdsTable, userScoresTable } from "./schema";
import { db, type Transaction } from ".";

export const incrementScore = async (
  tx: Transaction,
  semaphoreId: string,
  increment = 1
): Promise<typeof userScoresTable.$inferInsert> => {
  const [result] = await tx
    .insert(userScoresTable)
    .values({
      semaphoreId,
      score: increment,
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

export async function getSemaphoreId(
  signerPk: string
): Promise<string | undefined> {
  const userId = await db
    .select({ semaphoreId: userIdsTable.semaphoreId })
    .from(userIdsTable)
    .where(eq(userIdsTable.signerPk, signerPk));
  return userId[0]?.semaphoreId;
}
