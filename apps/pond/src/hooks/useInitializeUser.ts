import { PwtSpec } from "@frogcrypto/api/src/auth";
import {
  decompressBigInt,
  getPlayerIDEntries,
  PlayerIDSpec,
  semaphoreIdToUserId,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { Identity } from "@semaphore-protocol/identity";
import { useQuery } from "@tanstack/react-query";
import { crypto } from "@zk-kit/utils";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { stringify } from "superjson";
import { setToken, trpc } from "../trpc";
import { rootIdAtom, userIdentityAtom } from "./useUserState";
import { useMaybeZupassAPI } from "./useZapp";

function useInitializeUser() {
  const [userIdentity, setUserIdentity] = useAtom(userIdentityAtom);
  const [rootId, setRootId] = useAtom(rootIdAtom);
  const zupassAPI = useMaybeZupassAPI();
  const { mutateAsync: auth } = trpc.users.auth.useMutation();

  const { data: semaphoreId } = useQuery({
    queryKey: ["zupassId"],
    queryFn: () => zupassAPI?.z.identity.getSemaphoreV4Commitment(),
    enabled: Boolean(zupassAPI),
  });

  useEffect(() => {
    if (!userIdentity) {
      setUserIdentity(
        semaphoreIdToUserId(new Identity(crypto.getRandomValues(32)))
      );
    }
  }, [setUserIdentity, userIdentity]);

  useQuery({
    queryKey: [
      "initializeUser",
      Boolean(zupassAPI),
      zupassAPI?.url,
      stringify(userIdentity),
      String(semaphoreId),
    ],
    queryFn: async () => {
      if (!zupassAPI || !userIdentity || !semaphoreId) {
        throw new Error("Missing zupassAPI, userIdentity, or semaphoreId");
      }

      const z = zupassAPI.z;

      const myPlayerIDSpec = p.pod({
        entries: PlayerIDSpec.schema,
        tuples: [
          {
            entries: ["playerPk"],
            isMemberOf: [
              [
                {
                  type: "eddsa_pubkey",
                  value: userIdentity.publicKey,
                },
              ],
            ],
          },
        ],
        signerPublicKey: {
          isMemberOf: [await z.identity.getPublicKey()],
        },
      });
      const pods = await z.pod.query(myPlayerIDSpec);
      const playerIDPOD =
        pods[0] ??
        (await z.pod.sign(
          getPlayerIDEntries({
            playerPk: userIdentity.publicKey,
            device: window.navigator.userAgent,
            location: window.location.href,
          })
        ));
      if (pods.length === 0) {
        await z.pod.insert(playerIDPOD);
      }

      await auth(playerIDPOD);

      setRootId(semaphoreId.toString());

      return {
        rootId: semaphoreId.toString(),
        userIdentity,
      };
    },
    throwOnError: true,
    enabled:
      !rootId &&
      Boolean(zupassAPI) &&
      Boolean(userIdentity) &&
      Boolean(semaphoreId),
  });

  // reset rootId if it doesn't match semaphoreId
  useEffect(() => {
    if (semaphoreId && rootId && semaphoreId.toString() !== rootId) {
      setRootId(null);
    }
  }, [rootId, semaphoreId, setRootId]);

  const [ready, setReady] = useState<boolean>(false);
  useEffect(() => {
    if (userIdentity && rootId) {
      const refreshToken = () => {
        setToken(
          POD.sign(
            PwtSpec.parse({
              aud: { type: "string", value: "frogcrypto" },
              exp: {
                type: "int",
                value: BigInt(Date.now() + 1000 * 60 * 60 * 24),
              },
              iss: {
                type: "cryptographic",
                value: decompressBigInt(userIdentity.commitment),
              },
              sub: { type: "cryptographic", value: BigInt(rootId) },
            }),
            userIdentity.privateKey
          ).serialize()
        );
      };
      const interval = setInterval(refreshToken, 1000 * 60 * 60);

      refreshToken();
      setReady(true);

      return () => {
        clearInterval(interval);
      };
    }
  }, [rootId, userIdentity]);

  return ready;
}

export default useInitializeUser;
