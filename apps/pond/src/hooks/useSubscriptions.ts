import { Subscription } from "@pcd/passport-interface";
import { atom, useAtom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { withImmer } from "jotai-immer";
import { useCallback } from "react";

const subscriptionsAtom = withImmer(
  atomWithStorage<Subscription[]>("subscriptions", [])
);

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useAtom(subscriptionsAtom);

  return {
    subscriptions,
    addSubscription: useCallback(
      (subscription: Subscription) => {
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

// export function useGetOrAddSubscription(
//   provider: string,
//   subscription: Subscription
// ) {
//   const [subscriptions, setSubscriptions] = useAtom(subscriptionsAtom);

//   return useCallback(
//     (provider: string, subscription: Subscription) => {
//       if (subscriptions[provider]) {
//         return subscriptions[provider];
//       }
//       setSubscriptions((draft) => {
//         draft[provider] = subscription;
//       });
//     },
//     [subscriptions, setSubscriptions]
//   );
// }
