import {
  Biome,
  deriveFeedIdFromPodType,
  FeedSchema,
  FROG_FREEROLLS,
  FROG_SCORE_CAP,
  logger,
  toFrogPODEntries,
} from "@frogcrypto/shared";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex } from "@noble/hashes/utils";
import { POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { parseCyberfrogData } from "../cyberfrogs";
import { db } from "../db";
import { getFeeds, updateUserFeedState } from "../db/feeds";
import {
  generateFrogData,
  sampleFrogData,
  tryConsumeCyberfrogNullifier,
} from "../db/frogs";
import { userFeedsTable } from "../db/schema";
import { getUserScore, incrementScore } from "../db/users";
import redis from "../redis";
import { authedProcedure, publicProcedure, router } from "../trpc";
import { computeUserFeedState, publicKeyToUUID } from "../utils";

const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY;
if (!ISSUER_PRIVATE_KEY) {
  throw new Error("ISSUER_PRIVATE_KEY is not set");
}

export const feedsRouter = router({
  list: publicProcedure.output(z.array(FeedSchema)).query(() => {
    return getFeeds().filter((f) => !f.private);
  }),

  /**
   * Discover the void using one of the POD types
   */
  surrender: authedProcedure
    .input(z.object({ pod: z.custom<POD>((x) => x instanceof POD) }))
    .output(FeedSchema)
    .mutation(async ({ input: { pod }, ctx: { user } }) => {
      const entries = pod.content.listEntries();
      if (
        !entries.find(
          (e) =>
            e.value.type === "eddsa_pubkey" &&
            e.value.value === user.eddsaPublicKey
        ) &&
        !entries.find(
          (e) =>
            e.value.type === "cryptographic" &&
            e.value.value === user.semaphoreId
        )
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pod is not assigned to this user",
        });
      }

      const podType = entries.find((e) => e.name === "pod_type")?.value.value;
      if (typeof podType !== "string") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pod type not found",
        });
      }

      const derivedFeedId = deriveFeedIdFromPodType(podType);
      const feed = getFeeds().find((f) => f.id === derivedFeedId);
      if (!feed) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Feed not found: ${derivedFeedId} for pod type ${podType}`,
        });
      }

      if (
        feed.secretCodes?.length &&
        !feed.secretCodes.includes(pod.signerPublicKey)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "POD is not signed by authorized issuers",
        });
      }

      return feed;
    }),

  /**
   * Probe a feed with secret code
   */
  probe: authedProcedure
    .input(z.object({ code: z.string() }))
    .output(FeedSchema)
    .query(async ({ input: { code }, ctx: { user } }) => {
      const badProbeAtKey = `feed:badProbeAt:${user.semaphoreIdBase64}`;
      const prev = await redis.set(badProbeAtKey, Date.now(), { get: true });
      if (typeof prev === "number" && prev + 5_000 > Date.now()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "You recently scanned a secret code. Please wait a bit before trying again.",
        });
      }

      const feed = getFeeds().find((f) => f.secretCodes?.includes(code));
      if (feed) {
        await redis.del(badProbeAtKey);
        return feed;
      }

      throw new TRPCError({
        code: "NOT_FOUND",
        message: "We looked everywhere, but we don't recognize that code.",
      });
    }),

  scan: authedProcedure
    .input(z.object({ feedIds: z.array(z.string()) }))
    .output(z.object({ feed: FeedSchema.optional() }))
    .mutation(
      async ({
        input: { feedIds },
        ctx: {
          user: { semaphoreId },
        },
      }) => {
        // if user has come across a hidden pond, we will give them the official pond
        const celestialPond = getFeeds().find(
          (f) => f.name === "Celestial Pond"
        );
        if (
          celestialPond &&
          celestialPond.activeUntil > Date.now() / 1000 + 60 &&
          !feedIds.includes(celestialPond.id) &&
          feedIds.find((id) =>
            getFeeds()
              .find((f) => f.id === id)
              ?.name.startsWith("Celestial Pond [")
          )
        ) {
          return { feed: celestialPond };
        }

        // if user has a score of 40 or more, they get the capital
        const theCapital = getFeeds().find((f) => f.name === "The Capital");
        if (
          theCapital &&
          theCapital.activeUntil > Date.now() / 1000 + 60 &&
          !feedIds.includes(theCapital.id)
        ) {
          const userScore = await getUserScore(semaphoreId);

          if (userScore && userScore.score - userScore.friendCount >= 42) {
            return { feed: theCapital };
          }
        }

        return {};
      }
    ),

  search: authedProcedure
    .input(
      z.object({
        feedId: z.string(),
        token: z.string().optional(),
        version: z.enum(["v1", "v2"]).optional(),
      })
    )
    .output(
      z.object({
        pod: z.custom<POD>((x) => x instanceof POD),
      })
    )
    .mutation(
      async ({
        input: { feedId, token, version },
        ctx: {
          user: { semaphoreId, eddsaPublicKey },
          cfConnectingIp,
        },
      }) => {
        const idempotencyKey = crypto.randomUUID();
        const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
        const turnstileResult = await fetch(url, {
          body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: cfConnectingIp,
            idempotency_key: idempotencyKey,
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const turnstileOutcome = await turnstileResult.json();
        const turnstileError =
          typeof turnstileOutcome === "object" &&
          turnstileOutcome &&
          "success" in turnstileOutcome &&
          !turnstileOutcome.success;
        if (turnstileError) {
          logger.error("Turnstile validation failed", {
            turnstileOutcome,
            semaphoreId,
            version,
          });
        }

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
                message: `Try again in ${String(Math.floor((nextFetchAt - Date.now()) / 1000))} seconds! 🐸`,
              });
            }

            const frogDataSpec = await sampleFrogData({
              ...feed.biomes,
              ...(turnstileError &&
              !feed.name.includes("Void") &&
              process.env.THROW_ON_TURNSTILE_ERROR
                ? { Unknown: { dropWeightScaler: 5 } }
                : {}),
            });
            if (!frogDataSpec) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Frog Not Found",
              });
            }

            const frogData = generateFrogData(
              frogDataSpec,
              BigInt(semaphoreId),
              eddsaPublicKey
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
        nonce: z.number(),
      })
    )
    .output(
      z.object({
        pod: z.custom<POD>((x) => x instanceof POD),
      })
    )
    .mutation(
      async ({
        input: { signature, nonce },
        ctx: {
          user: { semaphoreId, eddsaPublicKey },
        },
      }) => {
        const {
          publicKey,
          signature: parsedSignature,
          messageHash,
        } = parseCyberfrogData(signature, nonce);
        const sigValid = secp256k1.verify(
          parsedSignature,
          messageHash,
          publicKey
        );
        if (!sigValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Signature invalid",
          });
        }
        const feedId = publicKeyToUUID(publicKey);
        logger.info("CyberSwamp Activated: ", {
          publicKey,
          feedId,
          signature,
          nonce,
        });

        const feed = getFeeds().find((f) => f.id === feedId);
        if (!feed) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Feed not found: ${feedId} (${publicKey})`,
          });
        }
        if (feed.activeUntil <= Date.now() / 1000) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Feed is not active",
          });
        }

        const nullifier = bytesToHex(
          sha256.create().update(publicKey).update(nonce.toString()).digest()
        );

        // If something fails after this point, the nullifier is not reverted
        // and will still be treated as consumed.
        const nullifierConsumeSuccess =
          await tryConsumeCyberfrogNullifier(nullifier);
        if (!nullifierConsumeSuccess) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Ribbit! Someone already claimed this cyberfrog.",
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
                message: `Croak! This cyber-amphibian needs a ${String(Math.floor((nextFetchAt - Date.now()) / 1000))}-second power nap! 🐸`,
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
              BigInt(semaphoreId),
              eddsaPublicKey
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
});
