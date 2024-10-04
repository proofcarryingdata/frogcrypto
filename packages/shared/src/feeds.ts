import { z } from 'zod';

import * as p from '@parcnet-js/podspec';
import { POD } from '@pcd/pod';

export const POD_TYPE_FROGCRYPTO_FEED = "frogcrypto.feed";

export const FeedSpec = p.entries({
  podType: {
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
      podType: POD_TYPE_FROGCRYPTO_FEED,
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

export const parseFeedPOD = (pod: POD): Feed => {
  const feed = FeedSpec.parse(pod.content.asEntries());
  return {
    id: feed.id.value,
    name: feed.name.value,
    description: feed.description.value,
    private: Boolean(feed.private.value),
    activeUntil: Number(feed.activeUntil.value),
    cooldown: Number(feed.cooldown.value),
  };
};
