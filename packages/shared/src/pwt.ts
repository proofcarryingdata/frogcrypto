import { poseidon2 } from "poseidon-lite/poseidon2";

import * as p from "@parcnet-js/podspec";
import { decodePublicKey, POD } from "@pcd/pod";

import { logger } from "./";

export const POD_TYPE_FROGCRYPTO_PWT = "frogcrypto.pwt";

export const PwtSpec = p.entries({
  pod_type: {
    type: "string",
    isMemberOf: [
      {
        type: "string",
        value: POD_TYPE_FROGCRYPTO_PWT,
      },
    ],
  },
  aud: {
    type: "string",
    isMemberOf: [
      {
        type: "string",
        value: "frogcrypto",
      },
    ],
  },
  exp: { type: "int" },
  iss: { type: "cryptographic" },
});

export function verifyPwtAndGetSemaphoreId(pod: POD): bigint {
  if (!pod.verifySignature()) {
    logger.error("Invalid PWT signature");
    throw new Error("Invalid PWT: invalid POD signature");
  }
  const parsed = PwtSpec.safeParse(pod.content.asEntries());
  if (!parsed.isValid) {
    console.error("Invalid PWT", parsed.issues);
    throw new Error("Invalid PWT: invalid POD content");
  }
  if (
    poseidon2(decodePublicKey(pod.signerPublicKey)) !== parsed.value.iss.value
  ) {
    logger.error("Mismatch between PWT iss and signer public key");
    throw new Error(
      "Invalid PWT: mismatch between PWT iss and signer public key"
    );
  }
  if (parsed.value.exp.value < BigInt(Date.now())) {
    logger.error("PWT expired");
    throw new Error("Invalid PWT: expired");
  }

  return parsed.value.iss.value;
}
