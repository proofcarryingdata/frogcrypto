import { atomWithStorage, createJSONStorage } from "jotai/utils";
import _ from "lodash";
import { useMemo } from "react";
import { atom, useAtomValue } from "jotai";
import { UseQueryOptions } from "@tanstack/react-query";
import { compressBigInt } from "@frogcrypto/shared";
import { trpc } from "../trpc";
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

  return trpc.users.me.useQuery({ feedIds });
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

export function useSocialTabStatus() {
  const { data: userState } = useUserState();
  const { data: pendingRequests } = trpc.social.getPendingRequests.useQuery();

  const isAvailable = (userState?.myScore?.score ?? 0) >= 5;
  const pendingCount = pendingRequests?.length ?? 0;

  return { isAvailable, pendingCount };
}
