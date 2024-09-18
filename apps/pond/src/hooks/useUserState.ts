import { decompressBigInt } from "@frogcrypto/shared";
import { type FrogCryptoUserStateResponseValue } from "@pcd/passport-interface";
import { POD } from "@pcd/pod";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai/react";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import _ from "lodash";
import { useMemo } from "react";
import { POD_TYPE_FROGCRYPTO_REQUEST, SERVER_URL } from "../constants";
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
    return _.keyBy(userState?.feeds || [], (feed) => feed.feedId);
  }, [userState]);
}

export function usePossibleFrogs() {
  const { data: userState } = useUserState();

  return useMemo(() => {
    return userState?.possibleFrogs || [];
  }, [userState]);
}
