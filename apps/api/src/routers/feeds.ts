import {
  Biome,
  FeedSchema,
  FROG_FREEROLLS,
  FROG_SCORE_CAP,
  logger,
  toFrogPODEntries,
} from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db";
import { getFeeds, updateUserFeedState } from "../db/feeds";
import { generateFrogData, sampleFrogData } from "../db/frogs";
import { userFeedsTable } from "../db/schema";
import { incrementScore } from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { computeUserFeedState } from "../utils";

const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY;
if (!ISSUER_PRIVATE_KEY) {
  throw new Error("ISSUER_PRIVATE_KEY is not set");
}

export const feedsRouter = router({
  list: publicProcedure.output(z.array(FeedSchema)).query(() => {
    return getFeeds().filter((f) => !f.private);
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
        const feed = getFeeds().find((f) => f.id === feedId);
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

            const frogDataSpec = await sampleFrogData(feed.biomes);
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

            const frogPOD = POD.sign(
              toFrogPODEntries(frogData),
              ISSUER_PRIVATE_KEY
            );

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
  getCyberFrog: authedProcedure
    .input(
      z.object({
        signature: z.string(),
      })
    )
    .output(
      z.object({
        pod: z
          .custom<POD>((x) => x instanceof POD && x.verifySignature())
          .optional(),
      })
    )
    .mutation(async ({ input: { signature } }) => {
      return {
        pod: undefined,
      };
    }),
});
