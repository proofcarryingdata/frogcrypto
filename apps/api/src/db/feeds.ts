import { and, eq } from "drizzle-orm";
import { logger, type ServerFeed } from "@frogcrypto/shared";
import { feedsTable, userFeedsTable } from "./schema";
import { db, type Transaction } from ".";

let cachedFeeds: ServerFeed[] = [];
let refreshInterval: NodeJS.Timeout | null = null;

export function getFeeds(): ServerFeed[] {
  return cachedFeeds;
}

export async function refreshFeeds(): Promise<void> {
  const feeds = await db.select().from(feedsTable);
  cachedFeeds = feeds.map((feed) => ({
    id: feed.id,
    ...feed.feed,
  }));
}

// Call this function when your server starts
export async function initializeFeedCache() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(refreshFeeds, 1000 * 60);
  await refreshFeeds();
  logger.info("Feed cache initialized");
}

/**
 * Update the last time a user has polled a feed.
 *
 * The primary invariant of this query is that the user state is updated
 * atomically:
 * - Last fetched timestamp is updated if and only if user is eligible to fetch
 *   a frog and ended up issued a frog.
 * - Any concurrent requests must process in sequence and will not deadlock.
 *
 * This query should be used in a transaction where the server can perform
 * additional logic or queries based on the user state returned by this query.
 * Ther server should only COMMIT the transaction at the end of these
 * operations. This ensures that the user state update is automatically rolled
 * back in case of error.
 *
 * This query uses `SELECT FOR UPDATE NOWAIT` to acquire a lock on the row. If
 * the row is already locked by another transaction, this query will throw an
 * error. This ensures any concurrent transactions will not deadlock on this row
 * or read and exploit stale data.
 *
 * - If `NOWAIT` is not specified, a second query could wait for the lock to be
 *   released until timeout. This doesn't hurt correctness but due to the
 *   cooldown mechanics, it is unlikely that the second query will be able to
 *   fetch a frog.
 * - If `SELECT FOR UPDATE` is not specified, the row will only be locked when
 *   transactions are committed in sequence. As is, the query will return stale
 *   data and makes the concurent request eligible for double issuance. Instead,
 *   we would have to codify "compare and set" logic in the query, which is more
 *   error prone and complicated. We need to first fetch the old value, then
 *   update the row only if the old value still matches the expected value. This
 *   requires two queries and additional logic in the case of bail.
 *
 * Note the seemingly complicated situation is due to:
 * - Our issuing logic requires use of Transaction for easy rollback.
 * - Our cooldown logic requires atomic update where row-level locks is one of
 *   the easiest and more robust solutions.
 *
 * @returns the old last_fetched_at value or undefined if the row was not found.
 */
export const updateUserFeedState = async (
  tx: Transaction,
  semaphoreId: string,
  feedId: string,
  /**
   *  can be used to reset cooldown to give a free roll
   */
  lastFetchedAt: Date = new Date()
): Promise<Date | null> => {
  const locks = await tx
    .select({
      id: userFeedsTable.id,
      lastFetchedAt: userFeedsTable.lastFetchedAt,
    })
    .from(userFeedsTable)
    .where(
      and(
        eq(userFeedsTable.semaphoreId, semaphoreId),
        eq(userFeedsTable.feedId, feedId)
      )
    )
    .for("update", { skipLocked: true });

  if (!locks[0]) {
    throw new Error("could not obtain lock");
  }

  const result = await tx
    .update(userFeedsTable)
    .set({ lastFetchedAt })
    .where(eq(userFeedsTable.id, locks[0].id))
    .returning({
      id: userFeedsTable.id,
      lastFetchedAt: userFeedsTable.lastFetchedAt,
    });

  if (result.length === 0) {
    throw new Error(
      `could not find user feed row for ${semaphoreId} ${feedId} at #${String(locks[0].id)}`
    );
  }

  return locks[0].lastFetchedAt ?? new Date(0);
};
