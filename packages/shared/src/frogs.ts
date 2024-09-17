import { POD, PODIntValue } from "@pcd/pod";
import { IFrogData, Biome, Rarity, Temperament } from "@pcd/eddsa-frog-pcd";
import * as p from "@parcnet-js/podspec";
import { compressBigInt, decompressBigInt } from "./bigint";
import _ from "lodash";

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
  podType: { type: "string", value: POD_TYPE_FROGCRYPTO_FROG },

  name: { type: "string" },
  description: { type: "string" },
  imageUrl: { type: "string" },

  frogId: { type: "int", isMemberOf: enumToEntryList(Biome) },
  biome: { type: "int", isMemberOf: enumToEntryList(Biome) },
  rarity: { type: "int", isMemberOf: enumToEntryList(Rarity) },
  temperament: { type: "int", isMemberOf: enumToEntryList(Temperament) },
  jump: { type: "int" },
  speed: { type: "int" },
  intelligence: { type: "int" },
  beauty: { type: "int" },

  timestampSigned: { type: "int" },
  owner: { type: "cryptographic" },
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
    },
    { coerce: true }
  );
  if (!res.isValid) {
    console.debug("Invalid frog data", res.issues);
    throw new Error("Invalid frog data");
  }

  return POD.sign(res.value, privateKey);
}
