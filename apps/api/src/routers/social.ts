import { decompressBigInt } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { validate as uuidValidate } from "uuid";
import { db } from "../db";
import { socialRequestsTable, userScoresTable } from "../db/schema";
import { recordFriendCount, userScoresView } from "../db/users";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { compareIds } from "../utils";

const MAX_REQUESTS_PER_DAY = 100;
const REQUEST_VISIBILITY_DAYS = 30; // Requests older than this will not be returned in queries

export const socialRouter = router({
  // FIXME: the logic here is incorrect. we need to make sure the insert conflict doesn't allow "accepting" a request because there are various other logic changes that should happen when a request is accepted
  createOrUpdateSocialRequest: authedProcedure
    .input(
      z.object({
        otherPartyId: z.string(),
        requestPOD: z.custom<POD>(
          (x) => x instanceof POD && x.verifySignature()
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { otherPartyId, requestPOD } = input;
      const myId = ctx.user.semaphoreIdBase64;

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

      if (recentRequestsCount >= MAX_REQUESTS_PER_DAY) {
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

      const now = new Date();
      const updatedRequest = await db
        .insert(socialRequestsTable)
        .values({
          party1,
          party2,
          party1POD: myId === party1 ? requestPOD.serialize() : null,
          party2POD: myId === party2 ? requestPOD.serialize() : null,
          party1PODTimestamp: myId === party1 ? now : null,
          party2PODTimestamp: myId === party2 ? now : null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [socialRequestsTable.party1, socialRequestsTable.party2],
          setWhere: eq(socialRequestsTable.status, "pending"),
          set: {
            [myId === party1 ? "party1POD" : "party2POD"]:
              requestPOD.serialize(),
            [myId === party1 ? "party1PODTimestamp" : "party2PODTimestamp"]:
              now,
            updatedAt: now,
            version: sql`${socialRequestsTable.version} + 1`,
          },
        })
        .returning()
        .then((result) => result[0]);

      if (updatedRequest?.party1POD && updatedRequest.party2POD) {
        return { status: "connected" };
      }
      return { status: "pending" };
    }),

  /**
   * Get sent and received requests that are still pending
   */
  getPendingRequests: authedProcedure.query(async ({ ctx }) => {
    const requests = await db
      .select()
      .from(socialRequestsTable)
      .where(
        and(
          or(
            eq(socialRequestsTable.party1, ctx.user.semaphoreIdBase64),
            eq(socialRequestsTable.party2, ctx.user.semaphoreIdBase64)
          ),
          sql`${socialRequestsTable.updatedAt} > ${new Date(Date.now() - REQUEST_VISIBILITY_DAYS * 24 * 60 * 60 * 1000)}`,
          eq(socialRequestsTable.status, "pending")
        )
      );

    return requests.map((request) => ({
      ...request,
      requestedBy:
        request.party1PODTimestamp?.getTime() === request.updatedAt.getTime()
          ? request.party1
          : request.party2,
      requestPOD:
        request.party1PODTimestamp?.getTime() === request.updatedAt.getTime()
          ? request.party1POD
          : request.party2POD,
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
        responsePOD: z.custom<POD>(
          (x) => x instanceof POD && x.verifySignature()
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { requestId, responsePOD } = input;

      return db.transaction(async (tx) => {
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
              "Request not found, expired, or you're not authorized to respond",
          });
        }

        if (request.status === "pending") {
          await recordFriendCount(tx, [
            String(decompressBigInt(request.party1)),
            String(decompressBigInt(request.party2)),
          ]);
        }

        await db
          .update(socialRequestsTable)
          .set({
            [request.party1 === ctx.user.semaphoreIdBase64
              ? "party1POD"
              : "party2POD"]: responsePOD.serialize(),
            updatedAt: new Date(),
            version: sql`${socialRequestsTable.version} + 1`,
            status: "connected",
          })
          .where(
            and(
              eq(socialRequestsTable.id, requestId),
              eq(socialRequestsTable.version, request.version)
            )
          );

        return { success: true };
      });
    }),

  scoreboard: publicProcedure.query(async () => {
    return db
      .with(userScoresView)
      .select()
      .from(userScoresView)
      .orderBy(desc(userScoresView.score))
      .limit(100);
  }),

  claimProfile: authedProcedure
    .input(
      z.object({
        profileId: z.custom<string>(
          (x) => typeof x === "string" && uuidValidate(x)
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { profileId } = input;

      const res = await db
        .update(userScoresTable)
        .set({
          socialId: profileId,
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
