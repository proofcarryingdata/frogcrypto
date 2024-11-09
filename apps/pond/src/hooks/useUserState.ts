import { decompressBigInt } from "@frogcrypto/shared";
import { atom, useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import _ from "lodash";
import { useMemo } from "react";
import { trpc } from "../trpc";
import { useFeedIds } from "./useSubscriptions";

export const semaphoreIdBase64Atom = atomWithStorage<string | null>(
  "semaphoreIdBase64",
  null
);
export const semaphoreIdAtom = atom((get) => {
  const semaphoreIdBase64 = get(semaphoreIdBase64Atom);
  if (!semaphoreIdBase64) return null;
  return decompressBigInt(semaphoreIdBase64);
});
export const useSemaphoreId = () => useAtomValue(semaphoreIdAtom);
export const useSemaphoreIdBase64 = () => useAtomValue(semaphoreIdBase64Atom);

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
    (userState?.myScore.score ?? 0) >= 10 && userState?.myScore.devcon7TicketId
  );
}
