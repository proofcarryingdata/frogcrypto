import {
  logger,
  parseFrogEnum,
  type DexFrog,
  type FrogCryptoFrogData,
  Rarity,
  toFrogData,
  type Biome,
} from "@frogcrypto/shared";
import { max } from "drizzle-orm";
import { frogsTable } from "./schema";
import { db } from ".";

// Hard-coded list of spirit frog IDs
const SPIRIT_FROG_BIOMS: (keyof typeof Biome)[] = ["Swamp"];
const CACHE_DURATION = 1000 * 60; // 1 minute

let cachedSpiritFrogs: FrogCryptoFrogData[] = [];
let cachedDexFrogs: DexFrog[] = [];
let lastUpdateTimestamp: Date | null = null;
let refreshInterval: NodeJS.Timeout | null = null;

export async function getSpiritFrogs(): Promise<FrogCryptoFrogData[]> {
  await refreshCacheIfNeeded();
  return cachedSpiritFrogs;
}

export async function getAllFrogs(): Promise<DexFrog[]> {
  await refreshCacheIfNeeded();
  return cachedDexFrogs;
}

async function getLatestUpdateTimestamp(): Promise<Date> {
  const result = await db
    .select({ maxUpdatedAt: max(frogsTable.updatedAt) })
    .from(frogsTable);

  return new Date(result[0]?.maxUpdatedAt ?? 0);
}

async function refreshCacheIfNeeded() {
  if (
    lastUpdateTimestamp &&
    Date.now() - lastUpdateTimestamp.getTime() < CACHE_DURATION
  ) {
    logger.info("Using cached frog data");
    return;
  }

  const latestUpdate = await getLatestUpdateTimestamp();
  if (!lastUpdateTimestamp || latestUpdate > lastUpdateTimestamp) {
    await refreshFrogCache();
  }
}

export async function refreshFrogCache() {
  try {
    const allFrogs = await db
      .select()
      .from(frogsTable)
      .then((frogs) => frogs.map((frog) => toFrogData(frog)))
      .then((frogs) => frogs.sort((a, b) => a.id - b.id));

    cachedDexFrogs = allFrogs
      .map((frog) => ({
        id: frog.id,
        rarity: parseFrogEnum(Rarity, frog.rarity),
      }))
      .filter((frog) => frog.rarity !== Number(Rarity.Object));

    cachedSpiritFrogs = allFrogs
      .filter((frog) =>
        SPIRIT_FROG_BIOMS.includes(frog.biome as keyof typeof Biome)
      )
      .sort((a, b) => a.id - b.id);

    lastUpdateTimestamp = new Date();
  } catch (e) {
    logger.error("Failed to refresh frog cache", e);
  }
}

// Call this function when your server starts
export async function initializeFrogCache() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setInterval(refreshFrogCache, 1000 * 60);
  await refreshFrogCache();
  logger.info("Frog cache initialized");
}
