import {
  compressBigInt,
  type FeedBiomeConfigs,
  toFrogData,
  type FrogCryptoFrogData,
  parseFrogEnum,
  Biome,
  type IFrogData,
  Rarity,
} from "@frogcrypto/shared";
import { sql } from "drizzle-orm";
import _ from "lodash";
import { parseFrogTemperament, sampleFrogAttribute } from "../utils";
import { getSpiritFrogs } from "./frog-cache";
import { cyberfrogNullifiersTable, frogsTable } from "./schema";
import { createRawSqlArray, jsonbField } from "./utils";
import { db } from "./index";

/**
 * Sample a single frog based on drop_weight scaled by biome specific scaling factor.
 *
 * https://utopia.duth.gr/~pefraimi/research/data/2007EncOfAlg.pdf
 */
export async function sampleFrogData(
  biomes: FeedBiomeConfigs
): Promise<FrogCryptoFrogData | undefined> {
  _.chain(biomes)
    .entries()
    .map(([biome, config]) => [biome, config]);
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

    where cast(${jsonbField(frogsTable.frog, "drop_weight")} as double precision) > 0

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

export async function getSpiritFrog(
  semaphoreId: bigint
): Promise<IFrogData | undefined> {
  const spiritFrogs = await getSpiritFrogs();
  const spiritFrogIndex = Math.abs(
    Number(semaphoreId % BigInt(spiritFrogs.length))
  );
  const spiritFrog = spiritFrogs[spiritFrogIndex];
  if (!spiritFrog) {
    return undefined;
  }

  return generateFrogData(spiritFrog, semaphoreId);
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

export async function tryConsumeCyberfrogNullifier(
  nullifier: string
): Promise<boolean> {
  const result = await db
    .insert(cyberfrogNullifiersTable)
    .values({ nullifier })
    .onConflictDoNothing();

  return result.rowCount === 1;
}
