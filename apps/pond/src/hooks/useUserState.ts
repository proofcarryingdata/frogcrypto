import { compressBigInt } from "@frogcrypto/shared";
import { atom, useAtomValue } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import _ from "lodash";
import { useMemo } from "react";
import { TRPCClientError } from "@trpc/client";
import { trpc } from "../trpc";
import { usePendingFrogRequests } from "./useFrogRequests";
import { useFeedIds } from "./useSubscriptions";

export interface UserIdentity {
  commitment: string; // bigint as base64 encoded string
  privateKey: string; // 32 bytes as base64 encoded string
  publicKey: string; // 32 byte packed point as base64 encoded string
}

export const userIdentityAtom = atomWithStorage<UserIdentity | null>(
  "userIdentity",
  null,
  createJSONStorage(() => localStorage),
  {
    getOnInit: true,
  }
);
export const useUserIdentity = () => useAtomValue(userIdentityAtom);

export const rootIdAtom = atomWithStorage<string | null>("rootId", null);
export const semaphoreIdAtom = atom((get) => {
  const rootId = get(rootIdAtom);
  if (!rootId) return null;
  return BigInt(rootId);
});
export const useSemaphoreId = () => useAtomValue(semaphoreIdAtom);
export const semaphoreIdBase64Atom = atom((get) => {
  const semaphoreId = get(semaphoreIdAtom);
  if (!semaphoreId) return null;
  return compressBigInt(semaphoreId);
});
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
    (userState?.myScore?.score ?? 0) >= 5 ||
    (userState?.myScore?.friendCount ?? 0) > 0
  );
}
