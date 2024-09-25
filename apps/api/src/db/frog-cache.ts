import { logger, parseFrogEnum } from "@frogcrypto/shared";
import { Rarity } from "@pcd/eddsa-frog-pcd";
import { type DexFrog, type FrogCryptoFrogData } from "@pcd/passport-interface";
import { sql } from "drizzle-orm";
import { toFrogData } from "./frogs";
import { frogsTable } from "./schema";
import { db } from ".";

// Hard-coded list of spirit frog IDs
const SPIRIT_FROG_IDS = [1, 2, 3, 4]; // Replace with actual spirit frog IDs

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
    .select({ maxUpdatedAt: sql<Date>`MAX(${frogsTable.updatedAt})` })
    .from(frogsTable);

  return result[0]?.maxUpdatedAt ?? new Date(0);
}

async function refreshCacheIfNeeded() {
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
