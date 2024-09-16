import {
  COMMON_TEMPERAMENT_SET,
  Rarity,
  Temperament,
} from "@pcd/eddsa-frog-pcd";
import { FrogCryptoClientFeed, FrogCryptoFeed } from "@pcd/passport-interface";
import _ from "lodash";

export function sampleFrogAttribute(
  min?: number,
  max?: number,
  rarity?: Rarity
): number {
  return _.random(
    Math.round(min ?? 0),
    Math.round(max ?? (rarity === Rarity.Common ? 7 : 15))
  );
}

export function parseFrogEnum(
  e: Record<number, string>,
  value: string
): number {
  const key = _.findKey(
    e,
    (v) =>
      typeof v === "string" &&
      v.toLowerCase() === value.toLowerCase().replace(/ /g, "")
  );
  if (key === undefined) {
    throw new Error(`invalid enum value ${value}`);
  }
  return parseInt(key);
}

export function parseFrogTemperament(value?: string): Temperament {
  if (!value) {
    return _.sample(COMMON_TEMPERAMENT_SET) ?? Temperament.N_A; // fallback makes TS happy
  }
  if (value === "N/A") {
    return Temperament.N_A;
  }
  if (value === "???") {
    return Temperament.UNKNOWN;
  }
  return parseFrogEnum(Temperament, value);
}

/**
 * Sanitize a feed object to return only feed data to the client.
 */
export function sanitizeFeed(feed: FrogCryptoFeed): FrogCryptoClientFeed {
  return {
    id: feed.id,
    name: feed.name,
    description: feed.description,
    permissions: feed.permissions,
    credentialRequest: feed.credentialRequest,
    autoPoll: feed.autoPoll,
    private: feed.private,
    activeUntil: feed.activeUntil,
    cooldown: feed.cooldown,
  };
}
