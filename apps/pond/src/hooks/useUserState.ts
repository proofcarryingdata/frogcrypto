import { useAtom } from "jotai/react";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  useMaybeZupassAPI,
  useZupassAPIContext,
  useZupassAPIOptional,
} from "./useZapp";
import { useEffect, useMemo } from "react";
import {
  decodePublicKey,
  encodePrivateKey,
  encodePublicKey,
  POD,
} from "@pcd/pod";
import { Identity } from "@semaphore-protocol/identity";
import {
  compressBigInt,
  decompressBigInt,
  semaphoreIdToUserId,
} from "../utils";
import { POD_TYPE_FROGCRYPTO_PLAYER_ID, SERVER_URL } from "../constants";
import { createStore } from "jotai";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { FrogCryptoUserStateResponseValue } from "@pcd/passport-interface";
import { useSubscriptions } from "./useSubscriptions";

export type UserIdentity = {
  commitment: string; // bigint as base64 encoded string
  privateKey: string; // 32 bytes as base64 encoded string
  publicKey: string; // 32 byte packed point as base64 encoded string
};

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
  const [userIdentity, setUserIdentity] = useAtom(userIdentityAtom);
  const { subscriptions } = useSubscriptions();
  const feedIds = useMemo(
    () => subscriptions.map((sub) => sub.feed.id),
    [subscriptions]
  );

  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      if (!userIdentity) {
        return null;
      }

      const { data } = await axios.post<FrogCryptoUserStateResponseValue>(
        `${SERVER_URL}/users/me`,
        POD.sign(
          {
            pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PLAYER_ID },
            feedIds: {
              type: "string",
              value: JSON.stringify(feedIds),
            },
            owner: {
              type: "cryptographic",
              value: decompressBigInt(userIdentity.commitment),
            },
            watermarks: {
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
    enabled: !!userIdentity,
  });
}
