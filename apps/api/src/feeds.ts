import {
  DexFrog,
  FROG_FREEROLLS,
  FROG_SCORE_CAP,
  FrogCryptoClientFeed,
  FrogCryptoFeed,
  FrogCryptoFrogData,
  ListFeedsResponseValue,
} from "@pcd/passport-interface";
import { Router } from "express";
import { db } from "./db";
import { incrementScore } from "./db/users";
import { userFeedsTable } from "./db/schema";
import { updateUserFeedState } from "./db/feeds";
import { POD } from "@pcd/pod";
import { computeUserFeedState, getSemaphoreId } from "./users";
import { log } from "@frogcrypto/logger";
import { Biome, IFrogData, Rarity } from "@pcd/eddsa-frog-pcd";
import _ from "lodash";
import {
  parseFrogEnum,
  parseFrogTemperament,
  sampleFrogAttribute,
} from "./utils";
import { decompressBigInt, POD_TYPE_FROGCRYPTO_FROG } from "@frogcrypto/shared";

const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY;
if (!ISSUER_PRIVATE_KEY) {
  throw new Error("ISSUER_PRIVATE_KEY is not set");
}

export const FEEDS = [
  {
    id: "7d27baf6-c568-4069-92c7-fc5daae854f6",
    name: "Swamp",
    description:
      "Veiled in mist and teeming with life, the labyrinthine Swamp is home to a plethora of frogs.",
    permissions: [{ folder: "FrogCrypto", type: "AppendToFolder_permission" }],
    credentialRequest: { signatureType: "sempahore-signature-pcd" },
    autoPoll: false,
    private: false,
    activeUntil: 1893484800,
    cooldown: 15,
    biomes: {
      1: { dropWeightScaler: 1 },
    },
  },
] satisfies FrogCryptoFeed[];

/**
 * Sanitize a feed object to return only feed data to the client.
 */
function sanitizeFeed(feed: FrogCryptoFeed): FrogCryptoClientFeed {
  return {
    id: feed.id,
    name: feed.name,
    description: feed.description,
    permissions: feed.permissions,
    credentialRequest: feed.credentialRequest,
    autoPoll: feed.autoPoll,
    private: feed.private,
    activeUntil: feed.activeUntil,
    cooldown: feed.cooldown,
  };
}

export const feedsRouter: Router = Router();

feedsRouter.get("/", async (req, res) => {
  return res.json({
    providerUrl: "https://api.getfrogs.xyz",
    providerName: "FrogCrypto",
    feeds: FEEDS.map(sanitizeFeed),
  } satisfies ListFeedsResponseValue);
});

feedsRouter.post("/:feedId", async (req, res) => {
  const { feedId } = req.params;
  const feed = FEEDS.find((f) => f.id === feedId);
  if (!feed) {
    return res.status(404).json({ error: "Feed not found" });
  }
  if (feed.activeUntil <= Date.now() / 1000) {
    return res.status(403).json({ error: "Feed is not active" });
  }

  const pod = req.body as POD;
  const semaphoreId = await getSemaphoreId(pod.signerPublicKey);
  if (!semaphoreId) {
    return res.status(404).json({ error: "No semaphore ID found" });
  }

  await db
    .insert(userFeedsTable)
    .values({
      feedId,
      semaphoreId,
    })
    .onConflictDoNothing();

  await db
    .transaction(async (tx) => {
      const lastFetchedAt = await updateUserFeedState(tx, semaphoreId, feedId);
      if (!lastFetchedAt) {
        const e = new Error("User feed state unexpectedly not found!");
        log(`Error encountered while serving feed:`, e);
        throw e;
      }

      const { nextFetchAt } = computeUserFeedState(
        {
          lastFetchedAt,
        },
        feed
      );
      if (nextFetchAt > Date.now()) {
        return res
          .status(403)
          .json({ error: `Next fetch available at ${nextFetchAt}` });
      }

      const frogDataSpec = _.sample(testFrogs);
      if (!frogDataSpec) {
        return res.status(404).json({ error: "Frog Not Found" });
      }

      const frogData = generateFrogData(frogDataSpec, semaphoreId);

      const { score: scoreAfterRoll } = await incrementScore(
        tx,
        semaphoreId,
        // non-frog frog doesn't get point
        frogData.biome === Biome.Unknown ? 0 : 1
      );

      if (scoreAfterRoll > FROG_SCORE_CAP) {
        return res.status(403).json({ error: "Frog faucet off." });
      }

      // rollback last fetched timestamp if user has free rolls left
      if (scoreAfterRoll <= FROG_FREEROLLS) {
        await updateUserFeedState(tx, semaphoreId, feedId, lastFetchedAt);
      }

      const frogPOD = signFrogData(frogData);

      return res.json({
        success: true,
        pod: frogPOD.serialize(),
      });
    })
    .catch((e) => {
      if (e.message.includes("could not obtain lock")) {
        return res
          .status(429)
          .json({ error: "There is another frog request in flight!" });
      }
      throw e;
    });
});

function generateFrogData(
  frogData: FrogCryptoFrogData,
  ownerSemaphoreId: string
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
    ownerSemaphoreId,
  };
}

function signFrogData(frogData: IFrogData): POD {
  return POD.sign(
    {
      pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_FROG },
      name: { type: "string", value: frogData.name },
      description: { type: "string", value: frogData.description },
      imageUrl: { type: "string", value: frogData.imageUrl },
      frogId: { type: "int", value: BigInt(frogData.frogId) },
      biome: { type: "int", value: BigInt(frogData.biome) },
      rarity: { type: "int", value: BigInt(frogData.rarity) },
      temperament: { type: "int", value: BigInt(frogData.temperament) },
      jump: { type: "int", value: BigInt(frogData.jump) },
      speed: { type: "int", value: BigInt(frogData.speed) },
      intelligence: { type: "int", value: BigInt(frogData.intelligence) },
      beauty: { type: "int", value: BigInt(frogData.beauty) },
      timestampSigned: {
        type: "int",
        value: BigInt(frogData.timestampSigned),
      },
      owner: {
        type: "cryptographic",
        value: BigInt(frogData.ownerSemaphoreId),
      },
    },
    ISSUER_PRIVATE_KEY!
  );
}

export const testFrogs: FrogCryptoFrogData[] = [
  {
    id: 1,
    name: "Purple Fluorescent Frog",
    biome: "Jungle",
    rarity: "common",
    drop_weight: 50,
    description:
      "The purple fluorescent frog is a rare species found in the jungles of India.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "b5af0796-c038-4f47-9aa2-1cff2b005ad7",
  },
  {
    id: 2,
    name: "Mossy Frog",
    biome: "Jungle",
    rarity: "common",
    drop_weight: 50,
    description:
      "The mossy frog is a rare species found in the jungles of Vietnam.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "78c8c92e-466b-49f8-b82f-b0b29dccb567",
  },
  {
    id: 3,
    name: "Black Rain Frog",
    biome: "Desert",
    rarity: "common",
    drop_weight: 50,
    description:
      "The black rain frog is a rare species found in the deserts of South Africa.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "b5ce3905-4ac7-4b46-9d9d-f9b816de9fae",
  },
  {
    id: 4,
    name: "Goliath Frog",
    biome: "Desert",
    rarity: "common",
    drop_weight: 50,
    description:
      "The Goliath frog is a rare species found in the deserts of West Africa.",
    jump_min: 0,
    jump_max: 7,
    speed_min: 0,
    speed_max: 7,
    intelligence_min: 0,
    intelligence_max: 7,
    beauty_min: 0,
    beauty_max: 7,
    uuid: "aef1c9f6-0c14-4ebb-99c7-951b23580970",
  },
];

export const testPossibleFrogs: DexFrog[] = testFrogs.map((frog) => ({
  id: frog.id,
  rarity: parseFrogEnum(Rarity, frog.rarity),
}));
