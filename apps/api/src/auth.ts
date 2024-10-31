import {
  compressBigInt,
  logger,
  verifyPwtAndGetSemaphoreId,
} from "@frogcrypto/shared";
import { type JSONPOD, POD } from "@pcd/pod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type express from "express";
import { db } from "./db";
import { userScoresTable } from "./db/schema";
import _ from "lodash";

export interface AuthSession {
  user: {
    semaphoreId: bigint;
    semaphoreIdBase64: string;
    isLoggedIn: boolean;
    isAdmin: boolean;
    devcon7TicketId: string | null;
  };
}

const memoizedDecodeAndVerifyPwt = _.memoize((token: string) => {
  const pod = POD.fromJSON(JSON.parse(token) as JSONPOD);
  return verifyPwtAndGetSemaphoreId(pod);
});

async function decodeAndVerifyPwt(token: string): Promise<AuthSession | null> {
  let semaphoreId: bigint;
  try {
    semaphoreId = memoizedDecodeAndVerifyPwt(token);
  } catch (e) {
    logger.error("Invalid PWT", e);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid PWT",
    });
  }

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
      semaphoreIdBase64: compressBigInt(semaphoreId),
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

  // TODO: cache this
  const pwt = authorization.split(" ")[1];
  if (!pwt) {
    throw new Error("Invalid PWT: no PWT provided");
  }
  const user = await decodeAndVerifyPwt(pwt);
  return user;
};
