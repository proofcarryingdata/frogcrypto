import {
  compressBigInt,
  decompressBigInt,
  logger,
  PlayerIDSpec,
  userPublicKeyToUserId,
} from "@frogcrypto/shared";
import { type IFrogData } from "@pcd/eddsa-frog-pcd";
import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import _ from "lodash";
import { z } from "zod";
import { db } from "../db";
import { getAllFrogs } from "../db/frog-cache";
import { getSpiritFrog } from "../db/frogs";
import { userFeedsTable, userIdsTable } from "../db/schema";
import { getUserScore, userScoresView } from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { computeUserFeedState } from "../utils";
import { FEEDS } from "./feeds";

export const usersRouter = router({
  auth: publicProcedure
    .input(z.custom<POD>((x) => x instanceof POD && x.verifySignature()))
    .mutation(async ({ input: pod }) => {
      const playerIDPOD = PlayerIDSpec.safeParse(pod.content.asEntries());
      if (!playerIDPOD.isValid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid player ID POD",
        });
      }
      const signer = pod.signerPublicKey;
      if (!signer) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No signer found in GPC",
        });
      }
      const owner = userPublicKeyToUserId(signer);
      const signerPk = playerIDPOD.value.playerPk.value.toString();
      if (!signerPk) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No playerPk found in POD",
        });
      }
      logger.info(`Got auth POD for user ${owner} with signer ${signerPk}`);

      await db
        .insert(userIdsTable)
        .values({ semaphoreId: owner, signerPk })
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
            semaphoreIdHash: z.string(),
            score: z.number(),
            rank: z.number(),
            friendCount: z.number(),
          })
          .optional(),
        // FIXME: add zod schema for IFrogData
        spiritFrog: z.custom<IFrogData>().optional(),
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

      const myScore = await getUserScore(semaphoreId);

      const allFeeds = FEEDS.filter((feed) => feedIds.includes(feed.id));

      return {
        feeds: allFeeds.map((feed) =>
          computeUserFeedState(userFeeds[feed.id], feed)
        ),
        possibleFrogs: await getAllFrogs(),
        myScore,
        spiritFrog: await getSpiritFrog(myScore?.semaphoreIdHash),
      };
    }),
  getSpiritFrog: authedProcedure
    .input(
      z.object({
        // TODO: change this to qr code uuid otherwise one could brute force all spirit frogs
        profileId: z.string(),
      })
    )
    .output(
      z.object({
        friendCount: z.number(),
        frogCount: z.number(),
        semaphoreIdBase64: z.string(),
        // FIXME: add zod schema for IFrogData
        spiritFrog: z.custom<IFrogData>(),
      })
    )
    .query(async ({ input: { profileId } }) => {
      const semaphoreId = decompressBigInt(profileId);
      const myScore = await getUserScore(semaphoreId);

      if (!myScore) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const spiritFrog = await getSpiritFrog(myScore.semaphoreIdHash);
      if (!spiritFrog) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Spirit frog not found",
        });
      }

      return {
        friendCount: myScore.friendCount,
        frogCount: myScore.score,
        semaphoreIdBase64: compressBigInt(semaphoreId),
        spiritFrog,
      };
    }),
});
