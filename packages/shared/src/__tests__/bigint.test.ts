import { compressBigInt, decompressBigInt } from "../bigint";

describe("BigInt compression and decompression", () => {
  const testCases = [
    { input: BigInt(0), expected: "0" },
    { input: BigInt(123), expected: "123" },
    { input: BigInt(-456), expected: "-456" },
    { input: BigInt("12345678901234567890"), expected: "12345678901234567890" },
    {
      input: BigInt("-98765432109876543210"),
      expected: "-98765432109876543210",
    },
  ];

  test.each(testCases)(
    "compresses and decompresses BigInt %p",
    ({ input, expected }) => {
      const compressed = compressBigInt(input);
      expect(compressed).toBe(expected);

      const decompressed = decompressBigInt(compressed);
      expect(decompressed).toBe(input);
    }
  );

  test("throws error for invalid input in decompressBigInt", () => {
    expect(() => decompressBigInt("not a number")).toThrow(
      "Invalid BigInt string"
    );
  });
});
