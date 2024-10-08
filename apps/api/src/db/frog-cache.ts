import {
  logger,
  parseFrogEnum,
  type DexFrog,
  type FrogCryptoFrogData,
} from "@frogcrypto/shared";
import { Rarity } from "@pcd/eddsa-frog-pcd";
import { max, sql } from "drizzle-orm";
import { toFrogData } from "./frogs";
import { frogsTable } from "./schema";
import { db } from ".";

// Hard-coded list of spirit frog IDs
const SPIRIT_FROG_IDS = [6, 16, 24]; // Replace with actual spirit frog IDs
const CACHE_DURATION = 1000 * 60; // 1 minute

let cachedSpiritFrogs: FrogCryptoFrogData[] = [];
let cachedDexFrogs: DexFrog[] = [];
let lastUpdateTimestamp: Date | null = null;

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
    return;
  }

  const latestUpdate = await getLatestUpdateTimestamp();
  if (!lastUpdateTimestamp || latestUpdate > lastUpdateTimestamp) {
    await refreshCache();
  }
}

async function refreshCache() {
  const allFrogs = await db
    .select()
    .from(frogsTable)
    .then((frogs) => frogs.map((frog) => toFrogData(frog)))
    .then((frogs) => frogs.sort((a, b) => a.id - b.id));

  cachedDexFrogs = allFrogs
    .map((frog) => ({
      ...frog,
      rarity: parseFrogEnum(Rarity, frog.rarity),
    }))
    .filter((frog) => frog.rarity !== Number(Rarity.Object));

  cachedSpiritFrogs = allFrogs.filter((frog) =>
    SPIRIT_FROG_IDS.includes(frog.id)
  );

  lastUpdateTimestamp = new Date();
}

// Call this function when your server starts
export async function initializeFrogCache() {
  await refreshCache();
  logger.info("Frog cache initialized");
}
