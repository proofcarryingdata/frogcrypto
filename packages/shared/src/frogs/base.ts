/**
 * Assigns each currently supported Biome a unique value.
 */
export enum Biome {
  Unknown,
  Jungle,
  Desert,
  Swamp,
  TheCapital,
  PutridSwamp,
  CelestialPond,
  TheWrithingVoid,
}

/**
 * Assigns each currently supported Rarity a unique value.
 */
export enum Rarity {
  Unknown,
  Common,
  Rare,
  Epic,
  Legendary,
  Mythic,
  Object,
}

/**
 * Assigns each currently supported Temperament a unique value.
 */
export enum Temperament {
  UNKNOWN, // ???
  N_A, // N/A
  ANGY,
  BORD,
  CALM,
  CHUB,
  COOL,
  DARK,
  DOOM,
  HMBL,
  HNGY,
  HRNY,
  HYPE,
  MEOW,
  OKAY,
  PUFF,
  SADG,
  SLLY,
  SLPY,
  WISE,
  WOW,
  YOLO,
}

export const COMMON_TEMPERAMENT_SET = [
  Temperament.HNGY,
  Temperament.ANGY,
  Temperament.SADG,
  Temperament.CALM,
  Temperament.BORD,
  Temperament.DARK,
  Temperament.SLPY,
  Temperament.CALM,
];

/**
 * FROGCRYPTO Data Model
 */
export interface IFrogData {
  // The fields below are not signed and are used for display purposes.
  name: string;
  description: string;
  imageUrl: string;
  // The fields below are signed using the passport-server's private EdDSA key.
  frogId: number;
  biome: Biome;
  rarity: Rarity;
  temperament: Temperament;
  jump: number;
  speed: number;
  intelligence: number;
  beauty: number;
  timestampSigned: number;
  ownerSemaphoreId: string;
}
