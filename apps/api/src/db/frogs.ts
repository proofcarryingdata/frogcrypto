import { compressBigInt, logger, parseFrogEnum } from "@frogcrypto/shared";
import { Biome, IFrogData, Rarity } from "@pcd/eddsa-frog-pcd";
import {
  type DexFrog,
  type FrogCryptoDbFrogData,
  type FrogCryptoFeedBiomeConfigs,
  type FrogCryptoFrogData,
} from "@pcd/passport-interface";
import { eq, not, sql } from "drizzle-orm";
import _ from "lodash";
import { frogsTable } from "./schema";
import { createRawSqlArray, jsonbField } from "./utils";
import { db } from "./index";
import { getSpiritFrogs } from "./frog-cache";
import { parseFrogTemperament, sampleFrogAttribute } from "../utils";

/**
 * Sample a single frog based on drop_weight scaled by biome specific scaling factor.
 *
 * https://utopia.duth.gr/~pefraimi/research/data/2007EncOfAlg.pdf
 */
export async function sampleFrogData(
  biomes: FrogCryptoFeedBiomeConfigs
): Promise<FrogCryptoFrogData | undefined> {
  const biomeKeys = Object.keys(biomes)
    .filter((biome) => biomes[biome as keyof typeof biomes]?.dropWeightScaler)
    .map(String);
  const scalingFactors = biomeKeys.map((biome) =>
    String(biomes[biome as keyof typeof biomes]?.dropWeightScaler ?? 0)
  );

  const {
    rows: [frog],
  } = await db.execute<typeof frogsTable.$inferSelect>(sql`
    with biome_scaling as (
      select unnest(${createRawSqlArray(biomeKeys, "text")}) as biome, unnest(${createRawSqlArray(scalingFactors, "float")}) as scaling_factor
    )

    select * from ${frogsTable}
    join biome_scaling on replace(lower(${jsonbField(frogsTable.frog, "biome")}), ' ', '') = lower(biome_scaling.biome)

    order by
    -- prevent underflow
    random() ^ least(1.0 / cast(${jsonbField(frogsTable.frog, "drop_weight")} as double precision) / scaling_factor, 10)
    desc

    limit 1`);

  if (!frog) {
    return undefined;
  }

  return toFrogData(frog);
}

export function toFrogData(
  dbFrogData: FrogCryptoDbFrogData
): FrogCryptoFrogData {
  return {
    id: dbFrogData.id,
    uuid: dbFrogData.uuid,
    ...dbFrogData.frog,
  };
}

export async function getSpiritFrog(
  semaphoreIdHash: string | undefined
): Promise<IFrogData | undefined> {
  if (!semaphoreIdHash) {
    return undefined;
  }

  const spiritFrogs = await getSpiritFrogs();
  const spiritFrogIndex =
    Math.abs(hashCode(semaphoreIdHash)) % spiritFrogs.length;
  const spiritFrog = spiritFrogs[spiritFrogIndex];
  if (!spiritFrog) {
    return undefined;
  }

  return generateFrogData(spiritFrog, BigInt(0));
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise -- this is a hash function
    hash = (hash << 5) - hash + char;
    // eslint-disable-next-line no-bitwise -- this is a hash function
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function generateFrogData(
  frogData: FrogCryptoFrogData,
  ownerSemaphoreId: bigint
): IFrogData {
  const rarity = parseFrogEnum(Rarity, frogData.rarity);

  return {
    ..._.pick(frogData, "name", "description"),
    imageUrl: `${process.env.FROGCRYPTO_ASSETS_URL}/${frogData.uuid}`,
    frogId: frogData.id,
    biome: parseFrogEnum(Biome, frogData.biome),
    rarity,
    temperament: parseFrogTemperament(frogData.temperament),
    jump: sampleFrogAttribute(frogData.jump_min, frogData.jump_max, rarity),
    speed: sampleFrogAttribute(frogData.speed_min, frogData.speed_max, rarity),
    intelligence: sampleFrogAttribute(
      frogData.intelligence_min,
      frogData.intelligence_max,
      rarity
    ),
    beauty: sampleFrogAttribute(
      frogData.beauty_min,
      frogData.beauty_max,
      rarity
    ),
    timestampSigned: Date.now(),
    ownerSemaphoreId: compressBigInt(ownerSemaphoreId),
  };
}
