import { parseFrogEnum } from "@frogcrypto/shared";
import { Rarity } from "@pcd/eddsa-frog-pcd";
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

/**
 * Returns a list of possible frogs
 */
export async function getPossibleFrogs(): Promise<DexFrog[]> {
  const frogs = await db
    .select({
      id: frogsTable.id,
      rarity: jsonbField(frogsTable.frog, "rarity"),
    })
    .from(frogsTable)
    .where(not(eq(jsonbField(frogsTable.frog, "rarity"), "object")))
    .orderBy(frogsTable.id)
    .execute();

  return frogs.map((row) => ({
    id: row.id,
    rarity: parseFrogEnum(Rarity, row.rarity),
  }));
}

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

  const { rows: frogs } = await db.execute<typeof frogsTable.$inferSelect>(sql`
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

  if (frogs.length === 0) {
    return undefined;
  }

  return toFrogData(frogs[0]);
}

function toFrogData(dbFrogData: FrogCryptoDbFrogData): FrogCryptoFrogData {
  return {
    id: dbFrogData.id,
    uuid: dbFrogData.uuid,
    ...dbFrogData.frog,
  };
}
