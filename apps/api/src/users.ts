import { GPCPCD, GPCPCDPackage, GPCPCDTypeName } from "@pcd/gpc-pcd";
import { SerializedPCD } from "@pcd/pcd-types";
import { log } from "@repo/logger";
import { Router } from "express";
import { userIdsTable } from "./db/schema";
import { db } from "./db";

export const usersRouter: Router = Router();

usersRouter.post("/auth", async (req, res) => {
  const { gpc } = req.body as { gpc: SerializedPCD<GPCPCD> };
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
