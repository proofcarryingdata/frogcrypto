import { log } from "@frogcrypto/logger";
import { type GPCPCD, GPCPCDPackage, GPCPCDTypeName } from "@pcd/gpc-pcd";
import { type FrogCryptoUserStateResponseValue } from "@pcd/passport-interface";
import { type SerializedPCD } from "@pcd/pcd-types";
import { type POD } from "@pcd/pod";
import { eq, sql } from "drizzle-orm";
import { Router } from "express";
import _ from "lodash";
import { db } from "./db";
import { testPossibleFrogs } from "./db/mock";
import { userFeedsTable, userIdsTable, userScoresTable } from "./db/schema";
import { getSemaphoreId } from "./db/users";
import { FEEDS } from "./feeds";
import { computeUserFeedState } from "./utils";

export const usersRouter: Router = Router();

usersRouter.post("/auth", async (req, res) => {
  const { gpc } = req.body as { gpc?: SerializedPCD<GPCPCD> };
  if (!gpc) {
    return res.status(400).json({ error: "No GPC provided" });
  }
  if (gpc.type !== GPCPCDTypeName) {
    return res.status(400).json({ error: "Invalid PCD type" });
  }
  const pcd = await GPCPCDPackage.deserialize(gpc.pcd);
  // TODO: validate pcd proof config
  const signer = pcd.claim.revealed.pods.id.signerPublicKey;
  if (!signer) {
    return res.status(400).json({ error: "No signer found in GPC" });
  }
  const owner = pcd.claim.revealed.pods.id.entries?.owner.value.toString();
  if (!owner) {
    return res.status(400).json({ error: "No owner found in GPC" });
  }
  log(`Got GPC for user ${owner} with signer ${signer}`);

  // FIXME: GPC verification is disabled until we can get it working
  //   const isValid = await GPCPCDPackage.verify(pcd);
  //   if (!isValid) {
  //     return res.status(400).json({ error: "Invalid GPC" });
  //   }

  await db
    .insert(userIdsTable)
    .values({ semaphoreId: owner, signerPk: signer })
    .onConflictDoNothing();

  return res.json({ ok: true });
});

usersRouter.post("/me", async (req, res) => {
  const pod = req.body as POD;
  const semaphoreId = await getSemaphoreId(pod.signerPublicKey);
  if (!semaphoreId) {
    return res.status(404).json({ error: "No semaphore ID found" });
  }
  // TODO: validate pod

  const userFeeds = _.keyBy(
    await db
      .select()
      .from(userFeedsTable)
      .where(eq(userFeedsTable.semaphoreId, semaphoreId)),
    "feedId"
  );

  const scores = await db
    .select({
      semaphoreIdHash: sql<string>`'0x' || encode(sha256('frogcrypto_' || ${userScoresTable.semaphoreId}::bytea), 'hex')`,
      score: userScoresTable.score,
      rank: sql<number>`cast(rank() over (order by ${userScoresTable.score} desc) as int)`,
    })
    .from(userScoresTable)
    .where(eq(userScoresTable.semaphoreId, semaphoreId));

  // FIXME: validate feedIds
  const feedIds = JSON.parse(
    String(pod.content.getValue("feedIds")?.value ?? "[]")
  ) as string[];
  const allFeeds = FEEDS.filter((feed) => feedIds.includes(feed.id));

  return res.json({
    feeds: allFeeds.map((feed) =>
      computeUserFeedState(userFeeds[feed.id], feed)
    ),
    possibleFrogs: testPossibleFrogs,
    myScore: scores.map((score) => ({
      score: score.score,
      semaphore_id_hash: semaphoreId,
      has_telegram_username: false,
      rank: score.rank,
    }))[0],
  } satisfies FrogCryptoUserStateResponseValue);
});
