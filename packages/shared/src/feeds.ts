import _ from "lodash";
import { z } from "zod";

import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";

import { Biome } from "./frogs";

export const POD_TYPE_FROGCRYPTO_FEED = "frogcrypto.feed";

export const FeedSpec = p.entries({
  pod_type: {
    type: "string",
    isMemberOf: [
      {
        type: "string",
        value: POD_TYPE_FROGCRYPTO_FEED,
      },
    ],
  },
  id: { type: "string" },
  name: { type: "string" },
  description: { type: "string" },
  private: { type: "int" },
  activeUntil: { type: "int" },
  cooldown: { type: "int" },
  zupass_title: {
    type: "string",
  },
  zupass_description: {
    type: "string",
  },
  zupass_display: {
    type: "string",
    isMemberOf: [
      {
        type: "string",
        value: "collectable",
      },
    ],
  },
});

export const FeedSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),

  private: z.boolean(),
  activeUntil: z.number(),
  cooldown: z.number(),
});

export type Feed = z.infer<typeof FeedSchema>;

export const signFeedPOD = (feed: Feed, privateKey: string) => {
  const pod = FeedSpec.parse(
    {
      pod_type: POD_TYPE_FROGCRYPTO_FEED,
      id: feed.id,
      name: feed.name,
      description: feed.description,
      private: feed.private ? 1 : 0,
      activeUntil: feed.activeUntil,
      cooldown: feed.cooldown,
      zupass_title: feed.name,
      zupass_description: feed.description,
      zupass_display: "collectable",
    },
    { coerce: true }
  );
  return POD.sign(pod, privateKey);
};

export const parseFeedPOD = (pod: p.PODData): Feed => {
  const feed = FeedSpec.parse(pod.entries);
  return {
    id: feed.id.value,
    name: feed.name.value,
    description: feed.description.value,
    private: Boolean(feed.private.value),
    activeUntil: Number(feed.activeUntil.value),
    cooldown: Number(feed.cooldown.value),
  };
};

/**
 * Map of configs for Biome(s) where PODs can be issued from a specific feed
 */
export const FeedBiomeConfigSchema = z.object({
  /**
   * A scaling factor that is multiplied to the weight of the frog to affect
   * the probability of the frog being issued
   *
   * For example, if a feed has 3 frogs:
   *
   * * JungleFrog1's drop weight is 1
   * * JungleFrog2's drop weight is 2
   * * DesertFrog3's drop weight is 3
   *
   *  If the Jungle's dropWeightScaler is 2 and the Desert's
   *   dropWeightScaler is 1, then
   *
   * * JungleFrog1's probability of being issued is 2/9
   * * JungleFrog2's probability of being issued is 4/9
   * * DesertFrog3's probability of being issued is 3/9
   */
  dropWeightScaler: z.number().nonnegative(),
});

export const FeedBiomeConfigsSchema = z.object(
  _.chain(Biome)
    .keys()
    .map<[keyof typeof Biome, z.ZodOptional<typeof FeedBiomeConfigSchema>]>(
      (key) => [key as keyof typeof Biome, FeedBiomeConfigSchema.optional()]
    )
    .fromPairs()
    .value()
);

export type FeedBiomeConfigs = z.infer<typeof FeedBiomeConfigsSchema>;

export const ServerFeedSchema = FeedSchema.extend({
  /**
   * Map of configs for Biome(s) where PODs can be issued from this feed
   */
  biomes: FeedBiomeConfigsSchema,
});

export type ServerFeed = z.infer<typeof ServerFeedSchema>;
