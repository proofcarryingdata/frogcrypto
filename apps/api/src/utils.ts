import _ from "lodash";
import {
  decompressBigInt,
  type Feed,
  parseFrogEnum,
  Rarity,
  Temperament,
  COMMON_TEMPERAMENT_SET,
} from "@frogcrypto/shared";
import type { UserFeed } from "./db/schema";
import { sha256 } from "@noble/hashes/sha2";

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
  feed: Feed,
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
  rarity?: Rarity,
): number {
  return _.random(
    Math.round(min ?? 0),
    Math.round(max ?? (rarity === Rarity.Common ? 7 : 15)),
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
 * Compares two semaphore IDs and returns a negative number if id1 \< id2,
 * a positive number if id1 \> id2, or zero if they are equal.
 */
export function compareIds(id1: string, id2: string): number {
  const bigInt1 = decompressBigInt(id1);
  const bigInt2 = decompressBigInt(id2);

  if (bigInt1 < bigInt2) return -1;
  if (bigInt1 > bigInt2) return 1;
  return 0;
}

export function numberToUint8Array(num: number): Uint8Array {
  const arr = new Uint8Array(4);
  for (let i = 0; i < 4; i++) {
    arr[3 - i] = num & 0xff;
    num = num >> 8;
  }
  return arr;
}

/*
 * Converts an ECDSA public key to UUIDv5 format by sha256 hashing it.
 * The first 16 bytes of the hash are used for the UUID.
 */
export function publicKeyToUUID(publicKeyHex: string): string {
  const publicKeyBuffer = Buffer.from(publicKeyHex, "hex");
  const hash = sha256.create().update(publicKeyBuffer).digest();
  // Use the first 16 bytes of the hash to form the UUID
  const uuidBytes = Buffer.from(hash.slice(0, 16));
  // Set the version to 5 (UUIDv5) -- bits 12-15 of the UUID (byte index 6)
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x50; // 0x50 = version 5
  // Set the variant to RFC 4122 -- bits 6-7 of the clock_seq_hi_and_reserved (byte index 8)
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
  const uuid = [
    uuidBytes.toString("hex", 0, 4), // time_low (4 bytes)
    uuidBytes.toString("hex", 4, 6), // time_mid (2 bytes)
    uuidBytes.toString("hex", 6, 8), // time_hi_and_version (2 bytes)
    uuidBytes.toString("hex", 8, 10), // clock_seq (2 bytes)
    uuidBytes.toString("hex", 10, 16), // node (6 bytes)
  ].join("-");
  return uuid;
}
