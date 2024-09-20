import { PwtSpec } from "@frogcrypto/api/src/auth";
import {
  decompressBigInt,
  logger,
  PlayerIDSpec,
  semaphoreIdToUserId,
  shortCommitment,
  signPlayerID,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD, type PODCryptographicValue } from "@pcd/pod";
import { Identity } from "@semaphore-protocol/identity";
import { useQuery } from "@tanstack/react-query";
import { crypto } from "@zk-kit/utils";
import { produce } from "immer";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { setToken, trpc } from "../trpc";
import { rootIdAtom, userIdentityAtom } from "./useUserState";
import { useMaybeZupassAPI } from "./useZapp";
import { stringify } from "superjson";

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

  const enabled =
    !rootId &&
    Boolean(zupassAPI) &&
    Boolean(userIdentity) &&
    semaphoreId?.toString() === rootId;

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
      if (!zupassAPI || !userIdentity || !semaphoreId) return;

      const z = zupassAPI.z;

      const myPlayerIDSpec = p.pod({
        entries: produce(PlayerIDSpec.schema, (draft) => {
          // @ts-expect-error draft.owner is typed as ReadOnly
          draft.owner.isMemberOf = [
            {
              type: "cryptographic",
              value: semaphoreId,
            },
          ] satisfies PODCryptographicValue[];
        }),
      });
      const pods = await z.pod.query(myPlayerIDSpec);
      if (pods.length === 0) {
        const shortID = shortCommitment(userIdentity.commitment);
        const pod = signPlayerID(
          {
            owner: semaphoreId,
            device: window.navigator.userAgent,
            location: window.location.href,
            playerId: shortID,
          },
          userIdentity.privateKey
        );
        await z.pod.insert(pod);
      }

      const gpc = await z.gpc.prove({
        pods: {
          id: {
            pod: myPlayerIDSpec.schema,
            // owner: {
            //   entry: "owner",
            //   protocol: "SemaphoreV4",
            // },
            revealed: {
              podType: true,
              owner: true, // TODO: we need to check this manually for now
            },
          },
        },
        watermark: { type: "int", value: BigInt(Date.now()) },
      });
      if (!gpc.success) {
        logger.error(`Failed to prove GPC: ${gpc.error}`);
        throw new Error("Failed to prove GPC");
      }
      await auth(gpc);

      setRootId(semaphoreId.toString());
    },
    throwOnError: true,
    enabled,
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
