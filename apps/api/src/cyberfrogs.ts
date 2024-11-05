import { type SignatureType } from "@noble/curves/abstract/weierstrass";
import { sha256 } from "@noble/hashes/sha2";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/hashes/utils";
import { logger } from "@frogcrypto/shared";
import { numberToUint8Array } from "./utils";

export interface CyberfrogData {
  signature: SignatureType;
  messageHash: Uint8Array;
  nonce: number;
  publicKey: string;
}

/*
 * Parses a Cyberfrog claim link into recovered public key, signature, and input message/nonce for verification.

 * Cyberfrog claim links are generated on the device in the following format:
 * <signature><recoveryBit>?nonce=<nonce>
 * The recovery bit is the last character of the signature, we need this to recover the public key
 * Cyberfrog devices sign a SHA256 hash of the nonce.
 * To recover the public key, we need to hash the nonce on the server side so the input is the same as on the device.
 */
export const parseCyberfrogData = (
  signature: string,
  nonce: number,
): CyberfrogData => {
  try {
    const recoveryBit = parseInt(signature.charAt(signature.length - 1));
    console.log("Recovery bit", recoveryBit);
    const remainingBytes = signature.slice(0, -1);
    console.log("Remaining bytes", remainingBytes);
    const sig = secp256k1.Signature.fromCompact(remainingBytes);
    console.log("Signature", sig);
    const fullSig = sig.addRecoveryBit(recoveryBit);
    console.log("Full signature", fullSig);
    const paddedMessage = new Uint8Array(32);
    console.log("Padded message", paddedMessage);
    const nonceUint8 = numberToUint8Array(nonce);
    console.log("Nonce uint8", nonceUint8);
    paddedMessage.set(nonceUint8, 0);
    console.log("Padded message", paddedMessage);
    const hash = sha256.create().update(paddedMessage).digest();
    console.log("hash", hash);
    const publicKey = bytesToHex(fullSig.recoverPublicKey(hash).toRawBytes());
    console.log("Public key recovered", publicKey);
    return {
      signature: fullSig,
      messageHash: hash,
      nonce,
      publicKey,
    } as CyberfrogData;
  } catch (error) {
    logger.error("Error in parseCyberfrogData", error);
    throw error;
  }
};
