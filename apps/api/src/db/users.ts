import { sql, SQL, and, eq } from "drizzle-orm";
import { db, Transaction } from ".";
import { userScoresTable } from "./schema";

export const incrementScore = async (
  db: Transaction,
  semaphoreId: string,
  increment: number = 1
) => {
  const result = await db
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

  return result[0];
};
