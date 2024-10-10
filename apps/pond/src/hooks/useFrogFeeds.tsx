import { type Feed, FeedSchema, logger } from "@frogcrypto/shared";
import React, { useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { validate } from "uuid";
import { trpc } from "../trpc";
import useSearchParams from "./useSearchParams";
import { useSubscriptions } from "./useSubscriptions";

/**
 * Returns a callback to register the default frog subscription provider and
 * subscribes to all public frog feeds and optionally a specific feed.
 */
export function useInitializeFrogSubscriptions(): (
  feedId?: string
) => Promise<Feed | null> {
  const { subscriptions, addSubscription } = useSubscriptions();
  const { refetch: fetchFeeds } = trpc.feeds.list.useQuery(undefined, {
    enabled: false,
  });

  const initializeFrogSubscriptions = React.useCallback(
    async (feedId?: string): Promise<Feed | null> => {
      function parseAndAddFeed(feed: Feed, deeplink: boolean): boolean {
        if (subscriptions.find((sub) => sub.id === feed.id)) {
          return false;
        }

        const parsed = FeedSchema.safeParse(feed);
        if (parsed.success) {
          if (parsed.data.activeUntil > Date.now() / 1000) {
            // only add a feed if it is active
            addSubscription(feed);

            // don't show toast if feedId is specified
            if (deeplink) {
              toast.success(
                `Croak and awe! The ${feed.name} awaits your adventurous leap!`,
                {
                  icon: "🏕️",
                }
              );
            }

            return true;
          } else if (deeplink) {
            // if we are adding an expired from deeplink, show error toast
            toast.error(
              <span>
                Oh no! You've found a secret froggy passage to{" "}
                <b>{feed.name}</b>. But our fireflies are in another castle.
                Maybe explore elsewhere and return here when the stars align?
              </span>
            );
            throw new Error("Feed no longer available");
          }
        } else {
          logger.error("Failed to parse feed as FrogFeed", feed, parsed.error);
        }

        return false;
      }

      const { data: feeds } = await fetchFeeds();
      if (!feedId && feeds?.length === 0) {
        toast.error(
          "Hop, hop, hooray! But wait – the adventure isn't ready to ignite just yet. The fireflies haven't finished their dance. Come back shortly, and we'll leap into the fun together!"
        );
        return null;
      }
      feeds
        // remove any feeds that we want to custom add
        ?.filter((feed) => feed.id !== feedId)
        .forEach((feed) => parseAndAddFeed(feed, false));

      if (feedId) {
        throw new Error("Manual feed addition not supported yet");
      }

      return null;
    },
    [fetchFeeds, subscriptions, addSubscription]
  );

  const [searchParams, setSearchParams] = useSearchParams();
  const feedId = useMemo(() => {
    const param = searchParams.get("feedId");
    return param ? decodeURIComponent(param) : null;
  }, [searchParams]);
  useEffect(() => {
    if (feedId) {
      void toast.promise(
        new Promise((resolve) => {
          setTimeout(resolve, 3000);
        }).then(() => {
          setSearchParams(
            (prev) => {
              prev.delete("feedId");
              return prev;
            },
            {
              replace: true,
            }
          );

          return initializeFrogSubscriptions(feedId);
        }),
        {
          loading:
            "Unearthing hidden paths and mystical biomes! Brace yourself for a leap into wonder. Hold on to your lily pads...",
          success: (feed: Feed | null) =>
            feed ? (
              <span>
                Leapin' lily pads! You've found a secret froggy passage to{" "}
                <b>{feed.name}</b>. New adventures are just a hop away.
              </span>
            ) : (
              <>You look familiar. Have we met before? No need to leap again.</>
            ),
          error: validate(feedId)
            ? "Seems like this froggy code is a tadpole off."
            : "We tried to look for this froggy code, but we got lost in the mist. Maybe come back after a few bug snacks?",
        }
      );
    }
  }, [feedId, initializeFrogSubscriptions, setSearchParams]);

  return initializeFrogSubscriptions;
}
