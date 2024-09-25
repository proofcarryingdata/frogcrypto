import { poseidon2 } from 'poseidon-lite/poseidon2';

import { decodePublicKey, encodePrivateKey, encodePublicKey } from '@pcd/pod';
import { Identity } from '@semaphore-protocol/identity';

import { compressBigInt, decompressBigInt } from './bigint';

export function semaphoreIdToUserId(id: Identity): {
  commitment: string;
  privateKey: string;
  publicKey: string;
} {
  if (typeof id.privateKey === "string") {
    throw new Error("Unsupported private key type!");
  }
  return {
    commitment: compressBigInt(id.commitment),
    privateKey: encodePrivateKey(id.privateKey),
    publicKey: encodePublicKey(id.publicKey),
  };
}

/**
 * Convert a user public key to a user id, which is the same as semaphore commitment, i.e. poseidon2(publicKey)
 */
export function userPublicKeyToUserId(publicKey: string): string {
  return compressBigInt(poseidon2(decodePublicKey(publicKey)));
}

export function shortCommitment(commitment: string): string {
  const bigint = decompressBigInt(commitment);
  return bigint.toString(16).slice(0, 6);
}
