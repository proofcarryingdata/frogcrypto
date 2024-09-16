import { POD } from "@pcd/pod";
import { IFrogData, Biome, Rarity, Temperament } from "@pcd/eddsa-frog-pcd";

export type FrogPOD = IFrogData & {
  contentID: bigint;
  signature: string;
  signerPublicKey: string;
};

export const POD_TYPE_FROGCRYPTO_FROG = "frogcrypto.frog";

// bounds are inclusive
export function randomInRangeInclusive(minVal: number, maxVal: number): number {
  return Math.floor(minVal + (maxVal - minVal + 1) * Math.random());
}

export function parseFrogPOD(pod: POD): FrogPOD {
  const entries = pod.content.asEntries();

  return {
    name: entries.name.value as string,
    description: entries.description.value as string,
    imageUrl: entries.imageUrl.value as string,

    frogId: Number(entries.frogId.value),
    biome: Number(entries.biome.value) as Biome,
    rarity: Number(entries.rarity.value) as Rarity,
    temperament: Number(entries.temperament.value) as Temperament,
    jump: Number(entries.jump.value),
    speed: Number(entries.speed.value),
    intelligence: Number(entries.intelligence.value),
    beauty: Number(entries.beauty.value),

    timestampSigned: Number(entries.timestampSigned.value),
    ownerSemaphoreId: entries.owner.value as string,

    contentID: pod.contentID,
    signature: pod.signature,
    signerPublicKey: pod.signerPublicKey,
  };
}
