import {
  COMMON_TEMPERAMENT_SET,
  Rarity,
  Temperament,
} from "@pcd/eddsa-frog-pcd";
import _ from "lodash";
import { decompressBigInt, type Feed, parseFrogEnum } from "@frogcrypto/shared";
import type { UserFeed } from "./db/schema";

/**
 * Individual feed level state for a user.
 */
export interface UserFeedState {
  feedId: string;
  lastFetchedAt: number;
  nextFetchAt: number;
  active: boolean;
}

export function computeUserFeedState(
  state: Pick<UserFeed, "lastFetchedAt"> | undefined,
  feed: Feed
): UserFeedState {
  const lastFetchedAt = state?.lastFetchedAt?.getTime() ?? 0;
  const nextFetchAt = lastFetchedAt + feed.cooldown * 1000;

  return {
    feedId: feed.id,
    lastFetchedAt,
    nextFetchAt,
    active: feed.activeUntil > Date.now() / 1000,
  };
}

export function sampleFrogAttribute(
  min?: number,
  max?: number,
  rarity?: Rarity
): number {
  return _.random(
    Math.round(min ?? 0),
    Math.round(max ?? (rarity === Rarity.Common ? 7 : 15))
  );
}

export function parseFrogTemperament(value?: string): Temperament {
  if (!value) {
    return _.sample(COMMON_TEMPERAMENT_SET) ?? Temperament.N_A; // fallback makes TS happy
  }
  if (value === "N/A") {
    return Temperament.N_A;
  }
  if (value === "???") {
    return Temperament.UNKNOWN;
  }
  return parseFrogEnum(Temperament, value);
}

/**
 * Compares two semaphore IDs and returns a negative number if id1 < id2,
 * a positive number if id1 > id2, or zero if they are equal.
 */
export function compareIds(id1: string, id2: string): number {
  const bigInt1 = decompressBigInt(id1);
  const bigInt2 = decompressBigInt(id2);

  if (bigInt1 < bigInt2) return -1;
  if (bigInt1 > bigInt2) return 1;
  return 0;
}
