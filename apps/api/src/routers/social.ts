import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { socialRequestsTable } from "../db/schema";
import { authedProcedure, router } from "../trpc";
import { compareIds } from "../utils";

const MAX_REQUESTS_PER_DAY = 100;
const REQUEST_VISIBILITY_DAYS = 30; // Requests older than this will not be returned in queries

export const socialRouter = router({
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
      const myId = String(ctx.user.semaphoreId);

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

      const updatedRequest = await db
        .insert(socialRequestsTable)
        .values({
          party1,
          party2,
          party1POD: myId === party1 ? requestPOD.serialize() : null,
          party2POD: myId === party2 ? requestPOD.serialize() : null,
          party1PODTimestamp: myId === party1 ? new Date() : null,
          party2PODTimestamp: myId === party2 ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [socialRequestsTable.party1, socialRequestsTable.party2],
          set: {
            [myId === party1 ? "party1POD" : "party2POD"]:
              requestPOD.serialize(),
            [myId === party1 ? "party1PODTimestamp" : "party2PODTimestamp"]:
              new Date(),
            updatedAt: new Date(),
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
            and(
              eq(socialRequestsTable.party1, String(ctx.user.semaphoreId)),
              isNull(socialRequestsTable.party2POD)
            ),
            and(
              eq(socialRequestsTable.party2, String(ctx.user.semaphoreId)),
              isNull(socialRequestsTable.party1POD)
            )
          ),
          sql`${socialRequestsTable.updatedAt} > ${new Date(Date.now() - REQUEST_VISIBILITY_DAYS * 24 * 60 * 60 * 1000)}`
        )
      );

    return requests.map((request) => ({
      ...request,
      requestPOD:
        request.party1 === String(ctx.user.semaphoreId)
          ? request.party2POD
          : request.party1POD,
    }));
  }),

  /**
   * Get sent requests that have been accepted
   */
  getAcceptedRequests: authedProcedure.query(async ({ ctx }) => {
    const requests = await db
      .select()
      .from(socialRequestsTable)
      .where(
        and(
          or(
            and(
              eq(socialRequestsTable.party1, String(ctx.user.semaphoreId)),
              isNotNull(socialRequestsTable.party2POD),
              eq(
                socialRequestsTable.party2PODTimestamp,
                socialRequestsTable.updatedAt
              )
            ),
            and(
              eq(socialRequestsTable.party2, String(ctx.user.semaphoreId)),
              isNotNull(socialRequestsTable.party1POD),
              eq(
                socialRequestsTable.party1PODTimestamp,
                socialRequestsTable.updatedAt
              )
            )
          ),
          sql`${socialRequestsTable.updatedAt} > ${new Date(Date.now() - REQUEST_VISIBILITY_DAYS * 24 * 60 * 60 * 1000)}`
        )
      );

    return requests.map((request) => ({
      ...request,
      sentPOD:
        request.party1 === String(ctx.user.semaphoreId)
          ? request.party1POD
          : request.party2POD,
      receivedPOD:
        request.party1 === String(ctx.user.semaphoreId)
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

      await db.transaction(async (tx) => {
        const request = await tx
          .select()
          .from(socialRequestsTable)
          .where(
            and(
              eq(socialRequestsTable.id, requestId),
              or(
                and(
                  eq(socialRequestsTable.party1, String(ctx.user.semaphoreId)),
                  isNull(socialRequestsTable.party1POD)
                ),
                and(
                  eq(socialRequestsTable.party2, String(ctx.user.semaphoreId)),
                  isNull(socialRequestsTable.party2POD)
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

        const updateField =
          request.party1 === String(ctx.user.semaphoreId)
            ? "party1POD"
            : "party2POD";

        await db
          .update(socialRequestsTable)
          .set({
            [updateField]: responsePOD.serialize(),
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
});
