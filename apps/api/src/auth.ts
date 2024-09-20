import { decompressBigInt, logger } from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { eq } from "drizzle-orm";
import type express from "express";
import { db } from "./db";
import { userIdsTable } from "./db/schema";

export const PwtSpec = p.entries({
  aud: { type: "string", value: "frogcrypto" },
  exp: { type: "int" },
  // signer commitment
  iss: { type: "cryptographic" },
  // root semaphore id
  sub: { type: "cryptographic" },
});

export interface AuthSession {
  user: {
    semaphoreId: bigint;
    signerPublicKey: bigint;
    isAdmin: boolean;
  };
}

async function decodeAndVerifyPwt(token: string): Promise<AuthSession> {
  const pod = POD.deserialize(token);
  if (!pod.verifySignature()) {
    logger.error("Invalid PWT signature");
    throw new Error("Invalid PWT: invalid POD signature");
  }
  const parsed = PwtSpec.safeParse(pod.content.asEntries());
  if (!parsed.isValid) {
    console.error("Invalid PWT", parsed.issues);
    throw new Error("Invalid PWT: invalid POD content");
  }
  const signerPublicKey = decompressBigInt(pod.signerPublicKey);
  // if (poseidon2(signerPublicKey) !== parsed.value.iss.value) {
  //   logger.error("Mismatch between PWT iss and signer public key");
  //   throw new Error(
  //     "Invalid PWT: mismatch between PWT iss and signer public key"
  //   );
  // }

  const [user] = await db
    .select()
    .from(userIdsTable)
    .where(eq(userIdsTable.signerPk, pod.signerPublicKey));
  if (!user) {
    logger.error("User not found for signer public key", pod.signerPublicKey);
    throw new Error("Invalid PWT: user not found");
  }

  const semaphoreId = BigInt(parsed.value.sub.value);
  if (semaphoreId !== parsed.value.sub.value) {
    logger.error("Mismatch between PWT sub and user semaphore id");
    throw new Error(
      "Invalid PWT: mismatch between PWT sub and user semaphore id"
    );
  }

  return {
    user: {
      semaphoreId,
      signerPublicKey,
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
  const user = await decodeAndVerifyPwt(authorization.split(" ")[1]);
  return user;
};
