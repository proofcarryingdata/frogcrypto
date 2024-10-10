import {
  decompressBigInt,
  logger,
  PwtSpec,
  verifyPwtAndGetSemaphoreId,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { eq } from "drizzle-orm";
import type express from "express";
import { TRPCError } from "@trpc/server";
import { db } from "./db";
import { userScoresTable } from "./db/schema";

export interface AuthSession {
  user: {
    semaphoreId: bigint;
    semaphoreIdBase64: string;
    isAdmin: boolean;
  };
}

async function decodeAndVerifyPwt(token: string): Promise<AuthSession> {
  const pod = POD.deserialize(token);
  let semaphoreId: bigint;
  try {
    semaphoreId = verifyPwtAndGetSemaphoreId(pod);
  } catch (e) {
    logger.error("Invalid PWT", e);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid PWT",
    });
  }

  const [user] = await db
    .select()
    .from(userScoresTable)
    .where(eq(userScoresTable.semaphoreId, String(semaphoreId)));

  if (!user) {
    logger.error("User not found for signer public key", pod.signerPublicKey);
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid PWT: user not found",
    });
  }

  return {
    user: {
      semaphoreId,
      semaphoreIdBase64: user.semaphoreId,
      isAdmin: user.isAdmin,
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
