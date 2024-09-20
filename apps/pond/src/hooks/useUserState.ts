import { atomWithStorage, createJSONStorage } from "jotai/utils";
import _ from "lodash";
import { useMemo } from "react";
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

export const rootIdAtom = atomWithStorage<string | null>("rootId", null);

export const QUERY_KEY_USER = "user";

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
