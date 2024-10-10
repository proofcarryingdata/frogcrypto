import { poseidon2 } from 'poseidon-lite/poseidon2';

import * as p from '@parcnet-js/podspec';
import { decodePublicKey, POD } from '@pcd/pod';

import { logger } from './';

export const PwtSpec = p.entries({
  aud: { type: "string", value: "frogcrypto" },
  exp: { type: "int" },
  // signer commitment
  iss: { type: "cryptographic" },
  // root semaphore id
  sub: { type: "cryptographic" },
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

  return (parsed.value.iss.value);
}
