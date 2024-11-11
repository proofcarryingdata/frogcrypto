import {
  decompressBigInt,
  getUsernameFromHash,
  isSpiritFrogDataEqualish,
  parseProfileFrogPOD,
  userPublicKeyToUserId,
} from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gt, isNotNull, isNull, or, sql } from "drizzle-orm";
import { validate as uuidValidate } from "uuid";
import { z } from "zod";
import { db } from "../db";
import { getSpiritFrog } from "../db/frogs";
import { socialRequestsTable, userScoresTable } from "../db/schema";
import {
  recordFriendCount,
  recordPendingRequest,
  userScoresView,
} from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { compareIds } from "../utils";

const MAX_REQUESTS_PER_DAY = 100;
const REQUEST_VISIBILITY_DAYS = 30;

async function validateFrogRequestPOD(pod: POD, semaphoreIdBase64: string) {
  const profilePOD = parseProfileFrogPOD(podToPODData(pod));
  if (!profilePOD) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid FROG REQUEST POD: could not parse profile POD",
    });
  }

  if (profilePOD.profileId !== semaphoreIdBase64) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Invalid FROG REQUEST POD: profile ID does not match semaphore ID",
    });
  }
  const signerPk = profilePOD.signerPublicKey;
  if (userPublicKeyToUserId(signerPk) !== profilePOD.profileId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Invalid FROG REQUEST POD: signer public key does not match profile ID",
    });
  }

  const spiritFrog = await getSpiritFrog(decompressBigInt(semaphoreIdBase64));
  if (!spiritFrog) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid FROG REQUEST POD: signer does not have a spirit frog",
    });
  }

  if (!isSpiritFrogDataEqualish(spiritFrog, profilePOD)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Invalid FROG REQUEST POD: signer does not have the correct spirit frog",
    });
  }

  if (profilePOD.telegramUsername && profilePOD.telegramUsername.length > 36) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Telegram username is too long (max 32 characters)",
    });
  }

  if (
    profilePOD.farcasterUsername &&
    profilePOD.farcasterUsername.length > 36
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Farcaster username is too long (max 32 characters)",
    });
  }

  if (profilePOD.timestampSigned > Date.now() + 60 * 1000) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Profile POD is too far in the future",
    });
  }

  return profilePOD;
}

export const socialRouter = router({
  createOrUpdateSocialRequest: authedProcedure
    .input(
      z.object({
        requestPOD: z.custom<POD>((x) => x instanceof POD),
      })
    )
    .mutation(async ({ ctx, input: { requestPOD } }) => {
      if (!ctx.user.devcon7TicketId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "FrogSocial is only available to Devcon 7 attendees",
        });
      }

      const myId = ctx.user.semaphoreIdBase64;

      const profilePOD = await validateFrogRequestPOD(requestPOD, myId);

      const otherPartyId = profilePOD.ownerSemaphoreId;
      if (myId === otherPartyId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot send a request to yourself",
        });
      }

      // Check rate limit
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentRequestsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(socialRequestsTable)
        .where(
          and(
            or(
              eq(socialRequestsTable.party1, myId),
              eq(socialRequestsTable.party2, myId)
            ),
            sql`${socialRequestsTable.createdAt} > ${oneDayAgo}`
          )
        )
        .then((result) => result[0]?.count ?? 0);

      if (Number(recentRequestsCount) >= MAX_REQUESTS_PER_DAY) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `You have exceeded the limit of ${String(
            MAX_REQUESTS_PER_DAY
          )} requests per day.`,
        });
      }

      // creating or updating the request
      const [party1, party2] =
        compareIds(myId, otherPartyId) < 0
          ? [myId, otherPartyId]
          : [otherPartyId, myId];

      const serializedRequestPOD = JSON.stringify(requestPOD.toJSON());

      const now = new Date();
      const [request] = await db
        .insert(socialRequestsTable)
        .values({
          party1,
          party2,
          party1POD: myId === party1 ? serializedRequestPOD : null,
          party2POD: myId === party2 ? serializedRequestPOD : null,
          party1PODTimestamp: myId === party1 ? now : null,
          party2PODTimestamp: myId === party2 ? now : null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [socialRequestsTable.party1, socialRequestsTable.party2],
          setWhere: or(
            eq(socialRequestsTable.status, "connected"),
            // If the request is still pending, we need to check that we were the ones who sent the request (i.e. we have not received any POD)
            and(
              eq(socialRequestsTable.status, "pending"),
              myId === party1
                ? isNull(socialRequestsTable.party2POD)
                : isNull(socialRequestsTable.party1POD)
            ),
            // If the request was declined, we need to check that we were the ones who declined it (i.e. we received the request and have not sent any POD)
            and(
              eq(socialRequestsTable.status, "declined"),
              myId === party1
                ? isNull(socialRequestsTable.party1POD)
                : isNull(socialRequestsTable.party2POD)
            )
          ),
          set: {
            [myId === party1 ? "party1POD" : "party2POD"]: serializedRequestPOD,
            [myId === party1 ? "party1PODTimestamp" : "party2PODTimestamp"]:
              now,
            updatedAt: now,
            version: sql`${socialRequestsTable.version} + 1`,
          },
        })
        .returning();

      if (!request) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Unable to create new FROG REQUEST. There might already be a pending FROG REQUEST between you and this user. If your request was declined, please ask your friend to send you a new request.",
        });
      }

      void recordPendingRequest(otherPartyId);

      return request;
    }),

  /**
   * Get received requests that are still pending if any
   */
  getPendingRequests: authedProcedure.query(async ({ ctx }) => {
    const requests = await db
      .select()
      .from(socialRequestsTable)
      .where(
        and(
          or(
            and(
              eq(socialRequestsTable.party1, ctx.user.semaphoreIdBase64),
              isNotNull(socialRequestsTable.party2POD)
            ),
            and(
              eq(socialRequestsTable.party2, ctx.user.semaphoreIdBase64),
              isNotNull(socialRequestsTable.party1POD)
            )
          ),
          eq(socialRequestsTable.status, "pending")
        )
      );

    return requests.map((request) => ({
      id: request.id,
      requestedBy:
        request.party1 === ctx.user.semaphoreIdBase64
          ? request.party2
          : request.party1,
      requestPOD:
        request.party1 === ctx.user.semaphoreIdBase64
          ? request.party2POD
          : request.party1POD,
    }));
  }),

  /**
   * Get sent/received requests that have been accepted
   */
  getAcceptedRequests: authedProcedure.query(async ({ ctx }) => {
    const requests = await db
      .select()
      .from(socialRequestsTable)
      .where(
        and(
          isNotNull(socialRequestsTable.party2POD),
          isNotNull(socialRequestsTable.party1POD),
          or(
            eq(socialRequestsTable.party1, ctx.user.semaphoreIdBase64),
            eq(socialRequestsTable.party2, ctx.user.semaphoreIdBase64)
          ),
          sql`${socialRequestsTable.updatedAt} > ${new Date(Date.now() - REQUEST_VISIBILITY_DAYS * 24 * 60 * 60 * 1000)}`
        )
      );

    return requests.map((request) => ({
      ...request,
      sentPOD:
        request.party1 === ctx.user.semaphoreIdBase64
          ? request.party1POD
          : request.party2POD,
      receivedPOD:
        request.party1 === ctx.user.semaphoreIdBase64
          ? request.party2POD
          : request.party1POD,
    }));
  }),

  acceptRequest: authedProcedure
    .input(
      z.object({
        requestId: z.number(),
        responsePOD: z.custom<POD>((x) => x instanceof POD),
      })
    )
    .mutation(async ({ ctx, input: { requestId, responsePOD } }) => {
      if (!ctx.user.devcon7TicketId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "FrogSocial is only available to Devcon 7 attendees",
        });
      }

      await validateFrogRequestPOD(responsePOD, ctx.user.semaphoreIdBase64);

      return db
        .transaction(async (tx) => {
          const request = await tx
            .select()
            .from(socialRequestsTable)
            .where(
              and(
                eq(socialRequestsTable.id, requestId),
                or(
                  and(
                    eq(socialRequestsTable.party1, ctx.user.semaphoreIdBase64),
                    isNotNull(socialRequestsTable.party2POD)
                  ),
                  and(
                    eq(socialRequestsTable.party2, ctx.user.semaphoreIdBase64),
                    isNotNull(socialRequestsTable.party1POD)
                  )
                )
              )
            )
            .for("update")
            .then((result) => result[0]);

          if (!request) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "FROG REQUEST not found, expired, or you're not authorized to respond.",
            });
          }

          if (request.status === "connected") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "FROG REQUEST already accepted!",
            });
          }

          // NB: we need to be careful not to double-count friends, esp if user could manipulate the request status such as declining an already accepted request
          await recordFriendCount(tx, [
            String(decompressBigInt(request.party1)),
            String(decompressBigInt(request.party2)),
          ]);

          const now = new Date();
          return tx
            .update(socialRequestsTable)
            .set({
              [request.party1 === ctx.user.semaphoreIdBase64
                ? "party1POD"
                : "party2POD"]: JSON.stringify(responsePOD.toJSON()),
              [request.party1 === ctx.user.semaphoreIdBase64
                ? "party1PODTimestamp"
                : "party2PODTimestamp"]: now,
              updatedAt: now,
              version: sql`${socialRequestsTable.version} + 1`,
              status: "connected",
            })
            .where(
              and(
                eq(socialRequestsTable.id, requestId),
                eq(socialRequestsTable.version, request.version)
              )
            )
            .returning()
            .then((result) => {
              if (result.length === 0) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "There was an error accepting the FROG REQUEST.",
                });
              }

              return result[0];
            });
        })
        .then((updated) => {
          if (updated) {
            void recordPendingRequest(ctx.user.semaphoreIdBase64);
          }

          return updated;
        });
    }),

  declineRequest: authedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.devcon7TicketId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "FrogSocial is only available to Devcon 7 attendees",
        });
      }

      const { requestId } = input;

      const res = await db
        .update(socialRequestsTable)
        .set({ status: "declined" })
        .where(
          and(
            or(
              and(
                eq(socialRequestsTable.party1, ctx.user.semaphoreIdBase64),
                isNull(socialRequestsTable.party1POD)
              ),
              and(
                eq(socialRequestsTable.party2, ctx.user.semaphoreIdBase64),
                isNull(socialRequestsTable.party2POD)
              )
            ),
            eq(socialRequestsTable.id, requestId),
            eq(socialRequestsTable.status, "pending")
          )
        );

      if (res.rowCount && res.rowCount > 0) {
        void recordPendingRequest(ctx.user.semaphoreIdBase64);
      }
    }),

  getFrogRequest: authedProcedure
    .input(z.object({ otherPartyId: z.string() }))
    .query(async ({ ctx, input: { otherPartyId } }) => {
      const myId = ctx.user.semaphoreIdBase64;
      const [party1, party2] =
        compareIds(myId, otherPartyId) < 0
          ? [myId, otherPartyId]
          : [otherPartyId, myId];

      return db
        .select()
        .from(socialRequestsTable)
        .where(
          and(
            eq(socialRequestsTable.party1, party1),
            eq(socialRequestsTable.party2, party2)
          )
        )
        .then((result) => result[0]);
    }),

  scoreboard: publicProcedure
    .output(
      z.array(
        z.object({
          friendCount: z.number(),
          rank: z.number(),
          score: z.number(),
          semaphoreIdHash: z.string(),
          username: z.string(),
          imgUrl: z.string(),
        })
      )
    )
    .query(async () => {
      return db
        .with(userScoresView)
        .select()
        .from(userScoresView)
        .orderBy(desc(userScoresView.score))
        .where(gt(userScoresView.score, 0))
        .limit(50)
        .then((scores) => {
          return Promise.all(
            scores.map(async (score) => {
              const frog = await getSpiritFrog(BigInt(score.semaphoreId));
              const username = `${getUsernameFromHash(score.semaphoreIdHash)} the ${
                frog?.name ?? "Unknown Toad"
              }`;

              return {
                ...score,
                username,
                imgUrl: frog?.imageUrl ?? "",
              };
            })
          );
        });
    }),

  scoreboard2: publicProcedure
    .output(
      z.object({
        totalUsers: z.number(),
        scores: z.array(
          z.object({
            friendCount: z.number(),
            rank: z.number(),
            score: z.number(),
            semaphoreIdHash: z.string(),
            username: z.string(),
            imgUrl: z.string(),
          })
        ),
      })
    )
    .query(async () => {
      return {
        totalUsers: await db
          .select({ count: sql<number>`count(*)` })
          .from(userScoresTable)
          .where(gt(userScoresTable.score, 0))
          .then((result) => Number(result[0]?.count ?? 0)),

        scores: await db
          .with(userScoresView)
          .select()
          .from(userScoresView)
          .orderBy(desc(userScoresView.score))
          .where(gt(userScoresView.score, 0))
          .limit(50)
          .then((scores) => {
            return Promise.all(
              scores.map(async (score) => {
                const frog = await getSpiritFrog(BigInt(score.semaphoreId));
                const username = `${getUsernameFromHash(score.semaphoreIdHash)} the ${
                  frog?.name ?? "Unknown Toad"
                }`;

                return {
                  ...score,
                  username,
                  imgUrl: frog?.imageUrl ?? "",
                };
              })
            );
          }),
      };
    }),

  claimProfile: authedProcedure
    .input(
      z.object({
        socialId: z.custom<string>(
          (x) => typeof x === "string" && uuidValidate(x)
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { socialId } = input;

      const res = await db
        .update(userScoresTable)
        .set({
          socialId,
        })
        .where(
          and(
            eq(userScoresTable.semaphoreId, String(ctx.user.semaphoreId)),
            isNull(userScoresTable.socialId)
          )
        );

      if (res.rowCount === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already claimed your profile",
        });
      }
    }),
});
