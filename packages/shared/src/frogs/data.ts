import { z } from 'zod';

/**
 * The prototype specification for frog creation
 *
 * This represents the raw specification of a frog, which is then used to generate the {@link IFrogData} in the {@link EdDSAFrogPCD}. Some attributes are optional and will be randomly selected if not specified.
 * This mirrors the specification from the design spreadsheet and is wrapped as {@link FrogCryptoDbFrogData} to store in the database.
 * See {@link FrogCryptoFeed} for the feed configuration and how Frog prototypes are selected.
 *
 * Undefined numeric attribute means that the value will be randomly selected from [0, 10].
 */
export const FrogCryptoFrogDataSchema = z.object({
  id: z.number().nonnegative().int(),
  uuid: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  biome: z.string().min(1),
  rarity: z.string().min(1),
  /**
   * undefined means the temperament will be randomly selected
   */
  temperament: z.string().optional(),
  drop_weight: z.number().nonnegative(),
  jump_min: z.number().gte(0).lte(15).optional(),
  jump_max: z.number().gte(0).lte(15).optional(),
  speed_min: z.number().gte(0).lte(15).optional(),
  speed_max: z.number().gte(0).lte(15).optional(),
  intelligence_min: z.number().gte(0).lte(15).optional(),
  intelligence_max: z.number().gte(0).lte(15).optional(),
  beauty_min: z.number().gte(0).lte(15).optional(),
  beauty_max: z.number().gte(0).lte(15).optional(),
});

export type FrogCryptoFrogData = z.infer<typeof FrogCryptoFrogDataSchema>;

/**
 * DB schema for frog data
 */
export interface FrogCryptoDbFrogData {
  id: number;
  uuid: string;
  frog: Omit<FrogCryptoFrogData, "id" | "uuid">;
}

/**
 * Convert a FrogCryptoDbFrogData to a FrogCryptoFrogData
 */
export function toFrogData(
  dbFrogData: FrogCryptoDbFrogData
): FrogCryptoFrogData {
  return {
    id: dbFrogData.id,
    uuid: dbFrogData.uuid,
    ...dbFrogData.frog,
  };
}
