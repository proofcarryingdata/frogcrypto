import _ from 'lodash';

import * as p from '@parcnet-js/podspec';
import { POD_INT_MAX, POD_INT_MIN, PODEntries } from '@pcd/pod';

import { compressBigInt, decompressBigInt } from '../bigint';
import { logger } from '../logger';
import { Biome, IFrogData, Rarity, Temperament } from './base';

export type FrogPOD = IFrogData & {
  signature: string;
  signerPublicKey: string;
};

export const POD_TYPE_FROGCRYPTO_FROG = "frogcrypto.frog";

function enumToRange<T extends Record<string, number | string>>(
  enumObj: T
): { min: bigint; max: bigint } {
  const values = Object.values(enumObj)
    .filter((x) => typeof x === "number")
    .map((x) => BigInt(x));
  if (values.length === 0) {
    return { min: POD_INT_MIN, max: POD_INT_MAX };
  }
  const [min, max] = values.reduce(
    ([min, max], x) => [x > min ? min : x, x < max ? max : x],
    [values[0] ?? POD_INT_MAX, values[0] ?? POD_INT_MIN]
  );
  return { min, max };
}

export const FrogSpec = p.entries({
  pod_type: {
    type: "string",
    isMemberOf: [{ type: "string", value: POD_TYPE_FROGCRYPTO_FROG }],
  },

  name: { type: "string" },
  description: { type: "string" },
  imageUrl: { type: "string" },

  frogId: { type: "int", inRange: { min: 0n, max: POD_INT_MAX } },
  biome: { type: "int", inRange: enumToRange(Biome) },
  rarity: { type: "int", inRange: enumToRange(Rarity) },
  temperament: { type: "int", inRange: enumToRange(Temperament) },
  jump: { type: "int" },
  speed: { type: "int" },
  intelligence: { type: "int" },
  beauty: { type: "int" },

  timestampSigned: { type: "int" },
  owner: { type: "cryptographic", isOwnerID: true },
  ownerPubKey: { type: "optional", innerType: { type: "eddsa_pubkey" } },
});

export function parseFrogPOD(pod: p.PODData): FrogPOD {
  const entries = pod.entries;
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
    ownerEddsaPublicKey: parsed.ownerPubKey?.value ?? null,

    ..._.pick(pod, ["signature", "signerPublicKey"]),
  } satisfies FrogPOD;
}

export function toFrogPODEntries(frog: IFrogData): PODEntries {
  const res = FrogSpec.safeParse(
    {
      ...frog,
      pod_type: POD_TYPE_FROGCRYPTO_FROG,
      owner: decompressBigInt(frog.ownerSemaphoreId),
      ...(frog.ownerEddsaPublicKey
        ? {
            ownerPubKey: frog.ownerEddsaPublicKey,
          }
        : {}),
      timestampSigned: Date.now(),
    },
    { coerce: true }
  );
  if (!res.isValid) {
    console.debug("Invalid frog data", res.issues);
    throw new Error("Invalid frog data");
  }

  return res.value;
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
  profileName: { type: "string" },
  telegramUsername: { type: "string" },
  farcasterUsername: { type: "string" },
});

export type ProfileFrogPOD = FrogPOD & {
  profileId: string;
  profileName: string;
  telegramUsername: string;
  farcasterUsername: string;
};

export function parseProfileFrogPOD(pod: p.PODData): ProfileFrogPOD | null {
  const entries = pod.entries;
  const res = ProfileFrogSpec.safeParse(entries);
  if (!res.isValid) {
    logger.debug("Invalid profile frog POD", res.issues);
    return null;
  }
  const parsed = res.value;

  return {
    ...parseFrogPOD(pod),
    profileId: compressBigInt(parsed.profileId.value),
    profileName: parsed.profileName.value,
    telegramUsername: parsed.telegramUsername.value,
    farcasterUsername: parsed.farcasterUsername.value,
  };
}

export function toProfileFrogPODEntries(frog: ProfileFrogPOD): PODEntries {
  const res = ProfileFrogSpec.safeParse(
    {
      ...frog,
      pod_type: POD_TYPE_FROGCRYPTO_FROG,
      owner: decompressBigInt(frog.ownerSemaphoreId),
      ...(frog.ownerEddsaPublicKey
        ? {
            ownerPubKey: frog.ownerEddsaPublicKey,
          }
        : {}),
      profileId: decompressBigInt(frog.profileId),
      timestampSigned: Date.now(),
    },
    { coerce: true }
  );
  if (!res.isValid) {
    console.debug("Invalid profile frog data", res.issues);
    throw new Error("Invalid profile frog data");
  }

  return res.value;
}
