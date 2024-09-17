import { POD, PODValue } from "@pcd/pod";
import { IFrogData, Biome, Rarity, Temperament } from "@pcd/eddsa-frog-pcd";
import { p } from "@pcd/podspec";
import { compressBigInt, decompressBigInt } from "./bigint";

export type FrogPOD = IFrogData & {
  contentID: bigint;
  signature: string;
  signerPublicKey: string;
};

export const POD_TYPE_FROGCRYPTO_FROG = "frogcrypto.frog";

function enumToEntryList<T extends Record<string, number | string>>(
  enumObj: T
): bigint[] {
  return Object.values(enumObj)
    .filter((x) => typeof x === "number")
    .map((x) => BigInt(x));
}

const FrogSpec = p.entries({
  name: p.string({ coerce: true }),
  description: p.string({ coerce: true }),
  imageUrl: p.string({ coerce: true }),

  frogId: p.int({ coerce: true }),
  biome: p.int({ coerce: true }).list(enumToEntryList(Biome)),
  rarity: p.int({ coerce: true }).list(enumToEntryList(Rarity)),
  temperament: p.int({ coerce: true }).list(enumToEntryList(Temperament)),
  jump: p.int({ coerce: true }),
  speed: p.int({ coerce: true }),
  intelligence: p.int({ coerce: true }),
  beauty: p.int({ coerce: true }),

  timestampSigned: p.int({ coerce: true }),
  owner: p.cryptographic({ coerce: true }),
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

    contentID: pod.contentID,
    signature: pod.signature,
    signerPublicKey: pod.signerPublicKey,
  };
}

export function toFrogPODEntries(frog: IFrogData): Record<string, PODValue> {
  const res = FrogSpec.safeParse({
    ...frog,
    owner: decompressBigInt(frog.ownerSemaphoreId),
  });
  if (!res.isValid) {
    console.debug("Invalid frog data", res.issues);
    throw new Error("Invalid frog data");
  }
  return res.value;
}
