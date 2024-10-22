import { Rarity } from "./base";

/**
 * Number of free rolls that a user globally
 *
 * User's lastFetchedAt is set to 0 if their score is less than this value
 */
export const FROG_FREEROLLS = 2;

/**
 * The maximum score that a user can have
 *
 * Once a user reaches this score, they will no longer be able to earn more PCDs from this feed
 */
export const FROG_SCORE_CAP = 10000;

/**
 * User score data and computed rank
 */
export interface FrogCryptoScore {
  semaphoreIdHash: string;
  score: number;
  rank: number;
  friendCount: number;
  imgUrl?: string;
}

/**
 * A subset of frog attributes relevant in the DEX
 */
export interface DexFrog {
  id: number;
  rarity: Rarity;
}
