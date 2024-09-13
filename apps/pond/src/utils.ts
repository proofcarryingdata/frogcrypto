import {
  decodeBytesRaw,
  encodeBytes,
  encodePrivateKey,
  encodePublicKey,
} from "@pcd/pod";
import { Identity } from "@semaphore-protocol/identity";
import { bigIntToBuffer, bufferToBigInt } from "@zk-kit/utils";
import { UserIdentity } from "./hooks/useUserState";

// bounds are inclusive
export function randomInRangeInclusive(minVal: number, maxVal: number): number {
  return Math.floor(minVal + (maxVal - minVal + 1) * Math.random());
}

export function compressBytes(input: Buffer | Uint8Array): string {
  return encodeBytes(input, "base64");
}

export function decompressBytes(input: string): Buffer {
  return decodeBytesRaw(input, "base64");
}

export function compressBigInt(input: bigint): string {
  return compressBytes(bigIntToBuffer(input));
}

export function decompressBigInt(input: string): bigint {
  return bufferToBigInt(decompressBytes(input));
}

export function semaphoreIdToUserId(id: Identity): UserIdentity {
  if (typeof id.privateKey === "string") {
    throw new Error("Unsupported private key type!");
  }
  return {
    commitment: compressBigInt(id.commitment),
    privateKey: encodePrivateKey(id.privateKey),
    publicKey: encodePublicKey(id.publicKey),
  };
}

export function shortCommitment(commitment: string): string {
  return commitment.slice(0, 6);
}
