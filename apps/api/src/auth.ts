import { decompressBigInt, logger, verifyPwt } from "@frogcrypto/shared";
import { type JSONPOD, POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type express from "express";
import { db } from "./db";
import { userScoresTable } from "./db/schema";
import redis from "./redis";

export interface AuthSession {
  user: {
    semaphoreId: bigint;
    semaphoreIdBase64: string;
    eddsaPublicKey: string;
    isLoggedIn: boolean;
    isAdmin: boolean;
    devcon7TicketId: string | null;
  };
}

const memoizedDecodeAndVerifyPwt = async (token: string) => {
  try {
    const cached = await redis.get<{
      semaphoreIdBase64: string;
      eddsaPublicKey: string;
    }>(`pwt2:${token}`);
    if (cached) {
      return cached;
    }
  } catch (e) {
    logger.error("Error getting PWT from cache", { error: e });
  }

  const pod = POD.fromJSON(JSON.parse(token) as JSONPOD);
  const res = verifyPwt(pod);
  void redis.set(`pwt2:${token}`, JSON.stringify(res), {
    ex: 60 * 60, // 1 hour
  });
  return res;
};

async function decodeAndVerifyPwt(token: string): Promise<AuthSession> {
  let res: {
    semaphoreIdBase64: string;
    eddsaPublicKey: string;
  };
  try {
    res = await memoizedDecodeAndVerifyPwt(token);
  } catch (e) {
    logger.error("Invalid PWT", e);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid PWT",
    });
  }
  const semaphoreId = decompressBigInt(res.semaphoreIdBase64);

  const [user] = await db
    .select({
      isAdmin: userScoresTable.isAdmin,
      devcon7TicketId: userScoresTable.devcon7TicketId,
    })
    .from(userScoresTable)
    .where(eq(userScoresTable.semaphoreId, String(semaphoreId)));

  return {
    user: {
      semaphoreId,
      semaphoreIdBase64: res.semaphoreIdBase64,
      eddsaPublicKey: res.eddsaPublicKey,
      isAdmin: Boolean(user?.isAdmin),
      isLoggedIn: Boolean(user),
      devcon7TicketId: user?.devcon7TicketId ?? null,
    },
  };
}

export const auth = async (
  req: express.Request
): Promise<AuthSession | null> => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return null;
  }

  const pwt = authorization.split(" ")[1];
  if (!pwt) {
    throw new Error("Invalid PWT: no PWT provided");
  }
  const user = await decodeAndVerifyPwt(pwt);
  return user;
};
