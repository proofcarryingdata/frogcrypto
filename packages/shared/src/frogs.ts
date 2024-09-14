export const POD_TYPE_FROGCRYPTO_FROG = "frogcrypto.frog";

// bounds are inclusive
export function randomInRangeInclusive(minVal: number, maxVal: number): number {
  return Math.floor(minVal + (maxVal - minVal + 1) * Math.random());
}
