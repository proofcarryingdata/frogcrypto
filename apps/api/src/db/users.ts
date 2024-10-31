import { eq, inArray, sql } from "drizzle-orm";
import { type FrogCryptoScore } from "@frogcrypto/shared";
import { userScoresTable } from "./schema";
import { db, type Transaction } from ".";

export const incrementScore = async (
  tx: Transaction,
  semaphoreId: string,
  increment = 1
): Promise<typeof userScoresTable.$inferSelect> => {
  const [result] = await tx
    .update(userScoresTable)
    .set({
      score: sql`${userScoresTable.score} + ${increment}`,
    })
    .where(eq(userScoresTable.semaphoreId, semaphoreId))
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

export const userScoresView = db.$with("user_scores_view").as(
  db
    .select({
      semaphoreId: userScoresTable.semaphoreId,
      semaphoreIdHash:
        sql<string>`'0x' || encode(sha256('frogcrypto_' || ${userScoresTable.semaphoreId}::bytea), 'hex')`.as(
          "semaphoreIdHash"
        ),
      score: userScoresTable.score,
      rank: sql<number>`cast(rank() over (order by ${userScoresTable.score} desc) as int)`.as(
        "rank"
      ),
      friendCount: userScoresTable.friendCount,
      socialId: userScoresTable.socialId,
      devcon7TicketId: userScoresTable.devcon7TicketId,
    })
    .from(userScoresTable)
);

export async function getUserScore(semaphoreId: string | bigint): Promise<
  | (FrogCryptoScore & {
      socialId: string | null;
      devcon7TicketId: string | null;
    })
  | undefined
> {
  const [score] = await db
    .with(userScoresView)
    .select()
    .from(userScoresView)
    .where(eq(userScoresView.semaphoreId, String(semaphoreId)));
  return score;
}

export async function getUserScoreLite(
  semaphoreId: string | bigint
): Promise<{ score: number } | undefined> {
  const [score] = await db
    .with(userScoresView)
    .select({
      score: userScoresView.score,
    })
    .from(userScoresView)
    .where(eq(userScoresView.semaphoreId, String(semaphoreId)));

  return score;
}
