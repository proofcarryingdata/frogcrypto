import { type FrogCryptoUserStateResponseValue } from "@pcd/passport-interface";
import { POD } from "@pcd/pod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAtom } from "jotai/react";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { useMemo } from "react";
import _ from "lodash";
import {
  POD_TYPE_FROGCRYPTO_REQUEST,
  POD_TYPE_FROGCRYPTO_PLAYER_ID,
  SERVER_URL,
} from "../constants";
import { decompressBigInt } from "../utils";
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
  const [userIdentity] = useAtom(userIdentityAtom);
  const feedIds = useFeedIds();

  return useQuery({
    queryKey: ["user", feedIds],
    queryFn: async () => {
      if (!userIdentity) {
        return null;
      }

      const { data } = await axios.post<FrogCryptoUserStateResponseValue>(
        `${SERVER_URL}/users/me`,
        POD.sign(
          {
            pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_REQUEST },
            feedIds: {
              type: "string",
              value: JSON.stringify(feedIds),
            },
            owner: {
              type: "cryptographic",
              value: decompressBigInt(userIdentity.commitment),
            },
            watermark: {
              type: "int",
              value: BigInt(Date.now()),
            },
          },
          userIdentity.privateKey
        ).serialize(),
        {
          headers: {
            "Content-Type": "application/x.pod+json",
          },
        }
      );

      return data;
    },
    enabled: Boolean(userIdentity),
  });
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
