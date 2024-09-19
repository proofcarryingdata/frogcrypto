import {
  compressBigInt,
  FeedSchema,
  logger,
  signFrogData,
} from "@frogcrypto/shared";
import { Biome, type IFrogData, Rarity } from "@pcd/eddsa-frog-pcd";
import {
  FROG_FREEROLLS,
  FROG_SCORE_CAP,
  type FrogCryptoFeed,
  type FrogCryptoFrogData,
} from "@pcd/passport-interface";
import { TRPCError } from "@trpc/server";
import _ from "lodash";
import { z } from "zod";
import { db } from "../db";
import { updateUserFeedState } from "../db/feeds";
import { testFrogs } from "../db/mock";
import { userFeedsTable } from "../db/schema";
import { incrementScore } from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import {
  computeUserFeedState,
  parseFrogEnum,
  parseFrogTemperament,
  sampleFrogAttribute,
} from "../utils";
import { POD } from "@pcd/pod";

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
function sanitizeFeed(feed: FrogCryptoFeed): z.infer<typeof FeedSchema> {
  return {
    id: feed.id,
    name: feed.name,
    description: feed.description,
    private: feed.private,
    activeUntil: feed.activeUntil,
    cooldown: feed.cooldown,
  };
}

function generateFrogData(
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

export const trpcFeedsRouter = router({
  list: publicProcedure.output(z.array(FeedSchema)).query(() => {
    return FEEDS.map(sanitizeFeed);
  }),
  search: authedProcedure
    .input(
      z.object({
        feedId: z.string(),
      })
    )
    .output(
      z.object({
        pod: z.custom<POD>((x) => x instanceof POD && x.verifySignature()),
      })
    )
    .mutation(
      async ({
        input: { feedId },
        ctx: {
          user: { semaphoreId },
        },
      }) => {
        const feed = FEEDS.find((f) => f.id === feedId);
        if (!feed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Feed not found",
          });
        }
        if (feed.activeUntil <= Date.now() / 1000) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Feed is not active",
          });
        }

        await db
          .insert(userFeedsTable)
          .values({
            feedId,
            semaphoreId: semaphoreId.toString(),
          })
          .onConflictDoNothing();

        return db
          .transaction(async (tx) => {
            const lastFetchedAt = await updateUserFeedState(
              tx,
              semaphoreId.toString(),
              feedId
            );
            if (!lastFetchedAt) {
              const e = new Error("User feed state unexpectedly not found!");
              logger.error("Error encountered while serving feed", e);
              throw e;
            }

            const { nextFetchAt } = computeUserFeedState(
              {
                lastFetchedAt,
              },
              feed
            );
            if (nextFetchAt > Date.now()) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: `Next fetch available at ${String(nextFetchAt)}`,
              });
            }

            const frogDataSpec = _.sample(testFrogs);
            if (!frogDataSpec) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Frog Not Found",
              });
            }

            const frogData = generateFrogData(
              frogDataSpec,
              BigInt(semaphoreId)
            );

            const { score: scoreAfterRoll } = await incrementScore(
              tx,
              semaphoreId.toString(),
              // non-frog frog doesn't get point
              frogData.biome === Biome.Unknown ? 0 : 1
            );

            if (scoreAfterRoll > FROG_SCORE_CAP) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "Frog faucet off.",
              });
            }

            // rollback last fetched timestamp if user has free rolls left
            if (scoreAfterRoll <= FROG_FREEROLLS) {
              await updateUserFeedState(
                tx,
                semaphoreId.toString(),
                feedId,
                lastFetchedAt
              );
            }

            const frogPOD = signFrogData(frogData, ISSUER_PRIVATE_KEY);

            return {
              pod: frogPOD,
            };
          })
          .catch((e: unknown) => {
            if (
              e instanceof Error &&
              e.message.includes("could not obtain lock")
            ) {
              throw new TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "There is another frog request in flight!",
              });
            }

            throw e;
          });
      }
    ),
});
