import { type Feed, FeedSchema, logger } from "@frogcrypto/shared";
import React, { useCallback } from "react";
import { toast } from "react-hot-toast";
import { trpc } from "../trpc";
import { useSubscriptions } from "./useSubscriptions";

/**
 * Returns a callback to register the default frog subscription provider and
 * subscribes to all public frog feeds and optionally a specific feed.
 */
export function useInitializeFrogSubscriptions(): () => Promise<Feed | null> {
  const { subscriptions, addSubscription } = useSubscriptions();
  const { refetch: fetchFeeds } = trpc.feeds.list.useQuery(undefined, {
    enabled: false,
  });

  return useCallback(async (): Promise<Feed | null> => {
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
              Oh no! You've found a secret froggy passage to <b>{feed.name}</b>.
              But our fireflies are in another castle. Maybe explore elsewhere
              and return here when the stars align?
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
    if (feeds?.length === 0) {
      toast.error(
        "Hop, hop, hooray! But wait – the adventure isn't ready to ignite just yet. The fireflies haven't finished their dance. Come back shortly, and we'll leap into the fun together!"
      );
      return null;
    }
    feeds?.forEach((feed) => parseAndAddFeed(feed, false));

    return null;
  }, [fetchFeeds, subscriptions, addSubscription]);
}
