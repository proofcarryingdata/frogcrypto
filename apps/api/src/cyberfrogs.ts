import { SignatureType } from "@noble/curves/abstract/weierstrass";
import { numberToUint8Array, publicKeyToUUID } from "./utils";
import { sha256 } from "@noble/hashes/sha2";
import { secp256k1 } from "@noble/curves/secp256k1";
import { bytesToHex } from "@noble/hashes/utils";
import { logger } from "@frogcrypto/shared";

/*
 * Each cyberfrog has an ECDSA keypair, we need to know what all the valid public keys are
 * so we can verify signatures from them.

 * NOTE: we might not need this, we could just ecrecover the public key from the signature,
 * Convert it to a UUID, and check if that UUID is a valid Feed ID.
 * i.e. store it in the feed vs in the code here.
 */
export const CYBERFROG_KEYS = [
  "0296a8039b329f8240e8e9827f4018dfab038e3f05ef03cfc368e139f33fa69491",
];

export const MOCK_FEEDS = CYBERFROG_KEYS.map((key) => {
  return {
    id: publicKeyToUUID(key),
    name: "CyberSwamp",
    description:
      "Veiled in mist and teeming with life, the labyrinthine CyberSwamp is home to a plethora of Cyberfrogs.",
    private: true,
    activeUntil: 1893484800,
    cooldown: 2,
    biomes: {
      Jungle: { dropWeightScaler: Math.random() * 0.9 + 0.1 },
      Desert: { dropWeightScaler: Math.random() * 0.9 + 0.1 },
      Swamp: { dropWeightScaler: Math.random() * 0.9 + 0.1 },
    },
  };
});

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
    const recoveryBit = parseInt(signature.slice(-1));
    const remainingBytes = signature.slice(0, -1);
    const sig = secp256k1.Signature.fromCompact(remainingBytes);
    const fullSig = sig.addRecoveryBit(recoveryBit);
    const paddedMessage = new Uint8Array(32);
    const nonceUint8 = numberToUint8Array(nonce);
    paddedMessage.set(nonceUint8, 0);
    const hash = sha256.create().update(paddedMessage).digest();
    const publicKey = bytesToHex(fullSig.recoverPublicKey(hash).toRawBytes());
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
