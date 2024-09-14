import { decodeBytesRaw, encodeBytes } from "@pcd/pod";
import { bigIntToBuffer, bufferToBigInt } from "@zk-kit/utils";

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
