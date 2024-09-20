import { logger } from "@frogcrypto/shared";
import { type GPCRevealedClaims } from "@pcd/gpc-pcd";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import _ from "lodash";
import { z } from "zod";
import { db } from "../db";
import { userFeedsTable, userIdsTable, userScoresTable } from "../db/schema";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { computeUserFeedState } from "../utils";
import { getPossibleFrogs } from "../db/frogs";
import { FEEDS } from "./feeds";

export const usersRouter = router({
  auth: publicProcedure
    .input(
      z.object({
        proof: z.any(),
        boundConfig: z.any(),
        revealedClaims: z.any(),
      })
    )
    .mutation(async ({ input: { revealedClaims } }) => {
      // TODO: validate pcd proof config
      const playerIDPOD = (revealedClaims as GPCRevealedClaims).pods.id;
      if (!playerIDPOD) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No player ID POD found in GPC",
        });
      }
      const signer = playerIDPOD.signerPublicKey;
      if (!signer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No signer found in GPC",
        });
      }
      const owner = playerIDPOD.entries?.owner.value.toString();
      if (!owner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No owner found in GPC",
        });
      }
      logger.info(`Got GPC for user ${owner} with signer ${signer}`);

      // FIXME: GPC verification is disabled until we can get it working
      //   const isValid = await GPCPCDPackage.verify(pcd);
      //   if (!isValid) {
      //     return res.status(400).json({ error: "Invalid GPC" });
      //   }

      await db
        .insert(userIdsTable)
        .values({ semaphoreId: owner, signerPk: signer })
        .onConflictDoNothing();
    }),
  me: authedProcedure
    .input(z.object({ feedIds: z.array(z.string()) }))
    .output(
      z.object({
        feeds: z.array(
          z.object({
            feedId: z.string(),
            nextFetchAt: z.number(),
            lastFetchedAt: z.number(),
            active: z.boolean(),
          })
        ),
        possibleFrogs: z.array(
          z.object({
            id: z.number(),
            rarity: z.number(),
          })
        ),
        myScore: z
          .object({
            score: z.number(),
            rank: z.number(),
          })
          .optional(),
      })
    )
    .query(async ({ input: { feedIds }, ctx }) => {
      const semaphoreId = ctx.user.semaphoreId;
      const userFeeds = _.keyBy(
        await db
          .select()
          .from(userFeedsTable)
          .where(eq(userFeedsTable.semaphoreId, String(semaphoreId))),
        "feedId"
      );

      const scores = await db
        .select({
          semaphoreIdHash: sql<string>`'0x' || encode(sha256('frogcrypto_' || ${userScoresTable.semaphoreId}::bytea), 'hex')`,
          score: userScoresTable.score,
          rank: sql<number>`cast(rank() over (order by ${userScoresTable.score} desc) as int)`,
        })
        .from(userScoresTable)
        .where(eq(userScoresTable.semaphoreId, String(semaphoreId)));

      const allFeeds = FEEDS.filter((feed) => feedIds.includes(feed.id));

      return {
        feeds: allFeeds.map((feed) =>
          computeUserFeedState(userFeeds[feed.id], feed)
        ),
        possibleFrogs: await getPossibleFrogs(),
        myScore: scores[0],
      };
    }),
});
