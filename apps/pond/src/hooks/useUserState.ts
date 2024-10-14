import { decompressBigInt } from "@frogcrypto/shared";
import { atom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import _ from "lodash";
import { useMemo } from "react";
import { trpc } from "../trpc";
import { useFeedIds } from "./useSubscriptions";

export const rootIdAtom = atomWithStorage<string | null>("rootId", null);
export const semaphoreIdAtom = atom((get) => {
  const rootId = get(rootIdAtom);
  if (!rootId) return null;
  return decompressBigInt(rootId);
});
export const useSemaphoreId = () => useAtomValue(semaphoreIdAtom);
export const useSemaphoreIdBase64 = () => useAtomValue(rootIdAtom);

export function useUserState() {
  const feedIds = useFeedIds();

  return trpc.users.me.useQuery(
    { feedIds },
    {
      throwOnError(error) {
        return error.data?.code === "UNAUTHORIZED";
      },
    }
  );
}

export function useUserStateByFeedId() {
  const { data: userState } = useUserState();

  return useMemo(() => {
    return _.keyBy(userState?.feeds ?? [], (feed) => feed.feedId);
  }, [userState]);
}

export function usePossibleFrogs() {
  const { data: userState } = useUserState();

  return userState?.possibleFrogs;
}

export function useSocialTabAvailable() {
  const { data: userState } = useUserState();

  return (
    (userState?.myScore.score ?? 0) >= 5 ||
    (userState?.myScore.friendCount ?? 0) > 0
  );
}
