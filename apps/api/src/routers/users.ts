import { logger } from "@frogcrypto/shared";
import { GPCPCDPackage, GPCPCDTypeName, type GPCPCD } from "@pcd/gpc-pcd";
import { type FrogCryptoUserStateResponseValue } from "@pcd/passport-interface";
import { type SerializedPCD } from "@pcd/pcd-types";
import { type POD } from "@pcd/pod";
import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import _ from "lodash";
import { z } from "zod";
import { db } from "../db";
import { testPossibleFrogs } from "../db/mock";
import { userFeedsTable, userIdsTable, userScoresTable } from "../db/schema";
import { getSemaphoreId } from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { computeUserFeedState } from "../utils";
import { FEEDS } from "./feeds";
import { TRPCError } from "@trpc/server";

export const trpcUsersRouter = router({
  auth: publicProcedure
    .input(
      z.object({
        gpc: z.object({
          type: z.string(),
          pcd: z.string(),
        }),
      })
    )
    .mutation(async ({ input: { gpc } }) => {
      if (gpc.type !== GPCPCDTypeName) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid PCD type",
        });
      }
      const pcd = await GPCPCDPackage.deserialize(gpc.pcd);
      // TODO: validate pcd proof config
      const playerIDPOD = pcd.claim.revealed.pods.id;
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
  query: authedProcedure
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
          .nullable(),
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
        possibleFrogs: testPossibleFrogs,
        myScore: scores[0],
      };
    }),
});
