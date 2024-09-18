import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { withImmer } from "jotai-immer";
import { useCallback } from "react";
import { Feed } from "@frogcrypto/shared";

const subscriptionsAtom = withImmer(
  atomWithStorage<Feed[]>("subscriptions", [])
);

const feedIdsAtom = atom<string[]>((get) =>
  get(subscriptionsAtom).map((sub) => sub.id)
);

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useAtom(subscriptionsAtom);

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
