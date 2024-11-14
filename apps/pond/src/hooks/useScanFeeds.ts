import { useCallback } from "react";
import toast from "react-hot-toast";
import { trpc } from "../trpc";
import { useSubscriptions } from "./useSubscriptions";

const useScanFeeds = () => {
  const { subscriptions } = useSubscriptions();

  const { addSubscription } = useSubscriptions();
  const { mutateAsync: scanFeedsAsync } = trpc.feeds.scan.useMutation({
    onSuccess: ({ feed }) => {
      if (feed) {
        addSubscription(feed);
        toast.success(`You found a secret passage to ${feed.name}!`);
      }
    },
  });
  return useCallback(
    async (feedId?: string) => {
      const feedIds = subscriptions.map((s) => s.id);
      const { feed } = await scanFeedsAsync({
        feedIds: feedId ? [...feedIds, feedId] : feedIds,
      });
      return feed?.name;
    },
    [subscriptions, scanFeedsAsync]
  );
};

export default useScanFeeds;
