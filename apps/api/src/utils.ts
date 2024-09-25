import {
  COMMON_TEMPERAMENT_SET,
  Rarity,
  Temperament,
} from "@pcd/eddsa-frog-pcd";
import type {
  FrogCryptoClientFeed,
  FrogCryptoComputedUserState,
  FrogCryptoFeed,
} from "@pcd/passport-interface";
import _ from "lodash";
import type { UserFeed } from "./db/schema";
import { parseFrogEnum } from "@frogcrypto/shared";

export function computeUserFeedState(
  state: Pick<UserFeed, "lastFetchedAt"> | undefined,
  feed: FrogCryptoFeed
): FrogCryptoComputedUserState {
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
 * Sanitize a feed object to return only feed data to the client.
 */
export function sanitizeFeed(feed: FrogCryptoFeed): FrogCryptoClientFeed {
  return {
    id: feed.id,
    name: feed.name,
    description: feed.description,
    permissions: feed.permissions,
    credentialRequest: feed.credentialRequest,
    autoPoll: feed.autoPoll,
    private: feed.private,
    activeUntil: feed.activeUntil,
    cooldown: feed.cooldown,
  };
}

/**
 * Compares two semaphore IDs and returns a negative number if id1 < id2,
 * a positive number if id1 > id2, or zero if they are equal.
 */
export function compareIds(id1: string, id2: string): number {
  const bigInt1 = BigInt(id1);
  const bigInt2 = BigInt(id2);

  if (bigInt1 < bigInt2) return -1;
  if (bigInt1 > bigInt2) return 1;
  return 0;
}
