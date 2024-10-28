import {
  compressBigInt,
  decompressBigInt,
  getUsernameFromHash,
  logger,
  PlayerIDSpec,
  userPublicKeyToUserId,
  type IFrogData,
} from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import _ from "lodash";
import { validate as uuidValidate } from "uuid";
import { z } from "zod";
import { db } from "../db";
import { getFeeds } from "../db/feeds";
import { getAllFrogs } from "../db/frog-cache";
import { getSpiritFrog } from "../db/frogs";
import { userFeedsTable, userScoresTable } from "../db/schema";
import { getUserScore, userScoresView } from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { computeUserFeedState } from "../utils";

// const GPC_ARTIFACTS_PATH = path.join(
//   __dirname,
//   process.env.NODE_ENV === "development"
//     ? "../node_modules/@pcd/proto-pod-gpc-artifacts"
//     : "."
// );

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

      // TODO: verify ticket proof
      // const { proof, boundConfig, revealedClaims } = parse<{
      //   proof: GPCProof;
      //   boundConfig: GPCBoundConfig;
      //   revealedClaims: GPCRevealedClaims;
      // }>(playerIDPOD.value.proof.value);
      // const { proofConfig, membershipLists, externalNullifier, watermark } =
      //   TicketProofRequest.getProofRequest();
      // revealedClaims.membershipLists = membershipLists;
      // revealedClaims.watermark = watermark;
      // if (typeof revealedClaims.owner !== "undefined") {
      //   Object.assign(revealedClaims.owner, { externalNullifier });
      // }
      // // const isVerified = await gpcVerify(
      // //   proof,
      // //   {
      // //     ...proofConfig,
      // //     circuitIdentifier: boundConfig.circuitIdentifier,
      // //   },
      // //   revealedClaims,
      // //   GPC_ARTIFACTS_PATH
      // // );
      // // if (!isVerified) {
      // //   throw new TRPCError({
      // //     code: "UNAUTHORIZED",
      // //     message: "Ticket proof failed to verify",
      // //   });
      // // }

      await db
        .insert(userScoresTable)
        .values({ semaphoreId: String(decompressBigInt(owner)) })
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
        myScore: z.object({
          semaphoreIdHash: z.string(),
          score: z.number(),
          rank: z.number(),
          friendCount: z.number(),
          socialId: z.string().nullable(),
          imgUrl: z.string(),
        }),
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
      if (!myScore) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found",
        });
      }

      const allFeeds = getFeeds().filter((feed) => feedIds.includes(feed.id));
      const spiritFrog = await getSpiritFrog(myScore.semaphoreIdHash);

      return {
        feeds: allFeeds.map((feed) =>
          computeUserFeedState(userFeeds[feed.id], feed)
        ),
        possibleFrogs: await getAllFrogs(),
        myScore: { ...myScore, imgUrl: spiritFrog?.imageUrl ?? "" },
        spiritFrog,
      };
    }),
  getUser: authedProcedure
    .input(
      z
        .object({
          id: z.custom<string>((x) => typeof x === "string" && uuidValidate(x)),
          type: z.literal("socialId"),
        })
        .or(
          z.object({
            id: z.string(),
            type: z.literal("semaphoreIdBase64"),
          })
        )
    )
    .output(
      z.object({
        friendCount: z.number(),
        frogCount: z.number(),
        semaphoreIdBase64: z.string(),
        socialId: z.string().nullable(),
        profileName: z.string(),
        // FIXME: add zod schema for IFrogData
        spiritFrog: z.custom<IFrogData>(),
      })
    )
    .query(async ({ input: { id, type } }) => {
      const [user] = await db
        .with(userScoresView)
        .select({
          semaphoreId: userScoresView.semaphoreId,
          semaphoreIdHash: userScoresView.semaphoreIdHash,
          socialId: userScoresView.socialId,
          score: userScoresView.score,
          friendCount: userScoresView.friendCount,
        })
        .from(userScoresView)
        .where(
          type === "socialId"
            ? eq(userScoresView.socialId, id)
            : eq(userScoresView.semaphoreId, String(decompressBigInt(id)))
        );

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      const spiritFrog = await getSpiritFrog(user.semaphoreIdHash);
      if (!spiritFrog) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Spirit frog not found",
        });
      }

      return {
        friendCount: user.friendCount,
        frogCount: user.score,
        semaphoreIdBase64: compressBigInt(BigInt(user.semaphoreId)),
        socialId: user.socialId,
        profileName: getUsernameFromHash(user.semaphoreIdHash),
        spiritFrog,
      };
    }),
});
