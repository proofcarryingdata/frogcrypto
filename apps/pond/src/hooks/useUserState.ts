import { useAtom } from "jotai/react";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  useMaybeZupassAPI,
  useZupassAPIContext,
  useZupassAPIOptional,
} from "./useZapp";
import { useEffect } from "react";
import {
  decodePublicKey,
  encodePrivateKey,
  encodePublicKey,
  POD,
} from "@pcd/pod";
import { Identity } from "@semaphore-protocol/identity";
import { compressBigInt, semaphoreIdToUserId } from "../utils";
import { POD_TYPE_FROGCRYPTO_PLAYER_ID } from "../constants";
import { createStore } from "jotai";

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

export function useUserState() {
  const [userIdentity, setUserIdentity] = useAtom(userIdentityAtom);
}
