import { eq, inArray, sql, asc, and, isNotNull, or } from "drizzle-orm";
import { logger, type FrogCryptoScore } from "@frogcrypto/shared";
import redis from "../redis";
import {
  frogsocialNullifiersTable,
  socialRequestsTable,
  userScoresTable,
} from "./schema";
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

  void redis.set(`frogcrypto:users:score:${String(semaphoreId)}`, result.score);

  return result;
};

export const recordFriendCount = async (
  tx: Transaction,
  semaphoreIds: [string, string]
): Promise<void> => {
  const [row1, row2] = await tx
    .select({
      ticketId: userScoresTable.devcon7TicketId,
    })
    .from(userScoresTable)
    .where(inArray(userScoresTable.semaphoreId, semaphoreIds))
    .orderBy(asc(userScoresTable.devcon7TicketId));

  if (!row1?.ticketId || !row2?.ticketId) {
    throw new Error(
      "Failed to record friend count because at least one of the tickets is missing"
    );
  }

  const { rowCount } = await tx
    .insert(frogsocialNullifiersTable)
    .values({
      party1: row1.ticketId,
      party2: row2.ticketId,
    })
    .onConflictDoNothing();

  // If the row already exists, they got credits for this already
  if (rowCount === 0) {
    logger.warn(
      `Friend count already recorded for tickets ${row1.ticketId} and ${row2.ticketId}, initiated by ${semaphoreIds[0]} and ${semaphoreIds[1]}.`
    );
    return;
  }

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
};

export async function recordPendingRequest(semaphoreId: string): Promise<void> {
  try {
    const requests = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(socialRequestsTable)
      .where(
        and(
          or(
            and(
              eq(socialRequestsTable.party1, semaphoreId),
              isNotNull(socialRequestsTable.party2POD)
            ),
            and(
              eq(socialRequestsTable.party2, semaphoreId),
              isNotNull(socialRequestsTable.party1POD)
            )
          ),
          eq(socialRequestsTable.status, "pending")
        )
      );

    void redis.set(
      `frogcrypto:users:pendingRequests:${String(semaphoreId)}`,
      Number(requests[0]?.count ?? 0)
    );
  } catch (error) {
    logger.error(`Failed to record pending requests for ${semaphoreId}`, {
      error,
    });
  }
}

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
      hasPk: isNotNull(userScoresTable.eddsaPublicKey).as<boolean>("hasPk"),
      eddsaPublicKey: userScoresTable.eddsaPublicKey,
    })
    .from(userScoresTable)
);

export async function getUserScore(semaphoreId: string | bigint): Promise<
  | (FrogCryptoScore & {
      socialId: string | null;
      devcon7TicketId: string | null;
      hasPk: boolean;
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
