import {
  FeedSpec,
  FROGCRYPTO_FOLDER_NAME,
  parseFeedPOD,
  toFeedPODEntries,
  type Feed,
} from "@frogcrypto/shared";
import { pod } from "@parcnet-js/podspec";
import { useQuery } from "@tanstack/react-query";
import { atom, useAtom, useAtomValue } from "jotai";
import { withImmer } from "jotai-immer";
import { atomWithStorage } from "jotai/utils";
import { useCallback, useEffect } from "react";
import { useParcnetClient } from "./useParcnetClient";

const QUERY_KEY_FEEDS = ["feeds"];

// TODO: we should just persist FeedPOD to avoid duplicate entries
const subscriptionsAtom = withImmer(
  atomWithStorage<Feed[]>("subscriptions", [])
);

const feedIdsAtom = atom<string[]>((get) =>
  get(subscriptionsAtom).map((sub) => sub.id)
);

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useAtom(subscriptionsAtom);
  const z = useParcnetClient();

  const { data: feedPODs } = useQuery({
    queryKey: QUERY_KEY_FEEDS,
    queryFn: async () =>
      z.pod
        .collection(FROGCRYPTO_FOLDER_NAME)
        .query(
          pod({
            entries: FeedSpec.schema,
          })
        )
        .then((pods) => pods.map(parseFeedPOD)),
  });
  useEffect(() => {
    if (feedPODs) {
      setSubscriptions((draft) => {
        feedPODs.forEach((feed) => {
          const index = draft.findIndex((sub) => sub.id === feed.id);
          if (index === -1) {
            draft.push(feed);
          }
        });
      });
    }
  }, [feedPODs, setSubscriptions]);
  useEffect(() => {
    if (feedPODs) {
      subscriptions.forEach((sub) => {
        if (!feedPODs.some((feed) => feed.id === sub.id)) {
          void z.pod
            .sign(toFeedPODEntries(sub))
            .then((podData) =>
              z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(podData)
            );
        }
      });
    }
  }, [feedPODs, subscriptions, z]);

  return {
    subscriptions,
    addSubscription: useCallback(
      (subscription: Feed) => {
        setSubscriptions((draft) => {
          const index = draft.findIndex((sub) => sub.id === subscription.id);
          if (index !== -1) {
            draft.splice(index, 1);
          }
          draft.push(subscription);
        });
      },
      [setSubscriptions]
    ),
  };
}

export function useFeedIds() {
  return useAtomValue(feedIdsAtom);
}
