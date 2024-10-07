import _ from 'lodash';
import { z } from 'zod';

import * as p from '@parcnet-js/podspec';
import { Biome, IFrogData, Rarity, Temperament } from '@pcd/eddsa-frog-pcd';
import { POD, POD_INT_MAX, PODIntValue } from '@pcd/pod';

import { compressBigInt, decompressBigInt } from './bigint';

export type FrogPOD = IFrogData & {
  contentID: bigint;
  signature: string;
  signerPublicKey: string;
};

export const POD_TYPE_FROGCRYPTO_FROG = "frogcrypto.frog";

function enumToEntryList<T extends Record<string, number | string>>(
  enumObj: T
): PODIntValue[] {
  return Object.values(enumObj)
    .filter((x) => typeof x === "number")
    .map((x) => ({ type: "int", value: BigInt(x) }));
}

export const FrogSpec = p.entries({
  podType: {
    type: "string",
    isMemberOf: [{ type: "string", value: POD_TYPE_FROGCRYPTO_FROG }],
  },

  name: { type: "string" },
  description: { type: "string" },
  imageUrl: { type: "string" },

  frogId: { type: "int", inRange: { min: 0n, max: POD_INT_MAX } },
  biome: { type: "int", isMemberOf: enumToEntryList(Biome) },
  rarity: { type: "int", isMemberOf: enumToEntryList(Rarity) },
  temperament: { type: "int", isMemberOf: enumToEntryList(Temperament) },
  jump: { type: "int" },
  speed: { type: "int" },
  intelligence: { type: "int" },
  beauty: { type: "int" },

  timestampSigned: { type: "int" },
  owner: { type: "cryptographic", isOwnerID: true },
});

// bounds are inclusive
export function randomInRangeInclusive(minVal: number, maxVal: number): number {
  return Math.floor(minVal + (maxVal - minVal + 1) * Math.random());
}

export function parseFrogPOD(pod: POD): FrogPOD {
  const entries = pod.content.asEntries();
  const res = FrogSpec.safeParse(entries);
  if (!res.isValid) {
    console.debug("Invalid frog POD", res.issues);
    throw new Error("Invalid frog POD");
  }
  const parsed = res.value;

  return {
    name: parsed.name.value,
    description: parsed.description.value,
    imageUrl: parsed.imageUrl.value,

    frogId: Number(parsed.frogId.value),
    biome: Number(parsed.biome.value) as Biome,
    rarity: Number(parsed.rarity.value) as Rarity,
    temperament: Number(parsed.temperament.value) as Temperament,
    jump: Number(parsed.jump.value),
    speed: Number(parsed.speed.value),
    intelligence: Number(parsed.intelligence.value),
    beauty: Number(parsed.beauty.value),

    timestampSigned: Number(parsed.timestampSigned.value),
    ownerSemaphoreId: compressBigInt(parsed.owner.value),

    ..._.pick(pod, ["contentID", "signature", "signerPublicKey"]),
  } satisfies FrogPOD;
}

export function signFrogData(frog: IFrogData, privateKey: string): POD {
  const res = FrogSpec.safeParse(
    {
      ...frog,
      podType: POD_TYPE_FROGCRYPTO_FROG,
      owner: decompressBigInt(frog.ownerSemaphoreId),
      timestampSigned: Date.now(),
    },
    { coerce: true }
  );
  if (!res.isValid) {
    console.debug("Invalid frog data", res.issues);
    throw new Error("Invalid frog data");
  }

  return POD.sign(res.value, privateKey);
}

export function parseFrogEnum(
  e: Record<number, string>,
  value: string
): number {
  const key = _.findKey(
    e,
    (v) =>
      typeof v === "string" &&
      v.toLowerCase() === value.toLowerCase().replace(/ /g, "")
  );
  if (key === undefined) {
    throw new Error(`invalid enum value ${value}`);
  }
  return parseInt(key);
}

export const ProfileFrogSpec = p.entries({
  ...FrogSpec.schema,
  profileId: { type: "cryptographic" },
  telegramUsername: { type: "string" },
  farcasterUsername: { type: "string" },
});

export type ProfileFrogPOD = FrogPOD & {
  profileId: string;
  telegramUsername: string;
  farcasterUsername: string;
};

export function parseProfileFrogPOD(pod: POD): ProfileFrogPOD {
  const entries = pod.content.asEntries();
  const res = ProfileFrogSpec.safeParse(entries);
  if (!res.isValid) {
    console.debug("Invalid profile frog POD", res.issues);
    throw new Error("Invalid profile frog POD");
  }
  const parsed = res.value;

  return {
    ...parseFrogPOD(pod),
    profileId: compressBigInt(parsed.profileId.value),
    telegramUsername: parsed.telegramUsername.value,
    farcasterUsername: parsed.farcasterUsername.value,
  };
}

export function signProfileFrogData(
  frog: ProfileFrogPOD,
  privateKey: string
): POD {
  const res = ProfileFrogSpec.safeParse(
    {
      ...frog,
      podType: POD_TYPE_FROGCRYPTO_FROG,
      owner: decompressBigInt(frog.ownerSemaphoreId),
      profileId: decompressBigInt(frog.profileId),
      timestampSigned: Date.now(),
    },
    { coerce: true }
  );
  if (!res.isValid) {
    console.debug("Invalid profile frog data", res.issues);
    throw new Error("Invalid profile frog data");
  }

  return POD.sign(res.value, privateKey);
}

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
 * The prototype specification for frog creation
 *
 * This represents the raw specification of a frog, which is then used to generate the {@link IFrogData} in the {@link EdDSAFrogPCD}. Some attributes are optional and will be randomly selected if not specified.
 * This mirrors the specification from the design spreadsheet and is wrapped as {@link FrogCryptoDbFrogData} to store in the database.
 * See {@link FrogCryptoFeed} for the feed configuration and how Frog prototypes are selected.
 *
 * Undefined numeric attribute means that the value will be randomly selected from [0, 10].
 */
export const FrogCryptoFrogDataSchema = z.object({
  id: z.number().nonnegative().int(),
  uuid: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  biome: z.string().min(1),
  rarity: z.string().min(1),
  /**
   * undefined means the temperament will be randomly selected
   */
  temperament: z.string().optional(),
  drop_weight: z.number().nonnegative(),
  jump_min: z.number().gte(0).lte(15).optional(),
  jump_max: z.number().gte(0).lte(15).optional(),
  speed_min: z.number().gte(0).lte(15).optional(),
  speed_max: z.number().gte(0).lte(15).optional(),
  intelligence_min: z.number().gte(0).lte(15).optional(),
  intelligence_max: z.number().gte(0).lte(15).optional(),
  beauty_min: z.number().gte(0).lte(15).optional(),
  beauty_max: z.number().gte(0).lte(15).optional(),
});

export type FrogCryptoFrogData = z.infer<typeof FrogCryptoFrogDataSchema>;

/**
 * DB schema for frog data
 */
export interface FrogCryptoDbFrogData {
  id: number;
  uuid: string;
  frog: Omit<FrogCryptoFrogData, "id" | "uuid">;
}

/**
 * User score data and computed rank
 */
export interface FrogCryptoScore {
  semaphoreIdHash: string;
  score: number;
  rank: number;
  friendCount: number;
}

/**
 * A subset of frog attributes relevant in the DEX
 */
export interface DexFrog {
  id: number;
  rarity: Rarity;
}
