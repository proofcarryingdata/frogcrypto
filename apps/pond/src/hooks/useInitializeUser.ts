import { PwtSpec } from "@frogcrypto/api/src/auth";
import {
  decompressBigInt,
  FROGCRYPTO_FOLDER_NAME,
  getPlayerIDEntries,
  PlayerIDSpec,
  compressBigInt,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { setToken, trpc } from "../trpc";
import { useMaybeParcnetClient } from "./useParcnetClient";
import { rootIdAtom } from "./useUserState";

function useInitializeUser() {
  const [rootId, setRootId] = useAtom(rootIdAtom);
  const z = useMaybeParcnetClient();
  const { mutateAsync: auth } = trpc.users.auth.useMutation();

  const { data: semaphoreId } = useQuery({
    queryKey: ["zupassId"],
    queryFn: () => z?.identity.getSemaphoreV4Commitment(),
    enabled: Boolean(z),
  });

  useQuery({
    queryKey: ["initializeUser", Boolean(z), String(semaphoreId)],
    queryFn: async () => {
      if (!z || !semaphoreId) {
        throw new Error("Missing zupassAPI, or semaphoreId");
      }

      const publicKey = await z.identity.getPublicKey();

      const myPlayerIDSpec = p.pod({
        entries: PlayerIDSpec.schema,
        tuples: [
          {
            entries: ["playerPk"],
            isMemberOf: [
              [
                {
                  type: "eddsa_pubkey",
                  value: publicKey,
                },
              ],
            ],
          },
        ],
        signerPublicKey: {
          isMemberOf: [publicKey],
        },
      });
      const pods = await z.pod
        .collection(FROGCRYPTO_FOLDER_NAME)
        .query(myPlayerIDSpec);
      const playerIDPOD =
        pods[0] ??
        (await z.pod.sign(
          getPlayerIDEntries({
            playerPk: publicKey,
            device: window.navigator.userAgent,
            location: window.location.href,
          })
        ));
      if (pods.length === 0) {
        await z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(playerIDPOD);
      }

      await auth(
        POD.load(
          playerIDPOD.entries,
          playerIDPOD.signature,
          playerIDPOD.signerPublicKey
        )
      );

      setRootId(compressBigInt(semaphoreId));

      return true;
    },
    throwOnError: true,
    enabled: !rootId && Boolean(z) && Boolean(semaphoreId),
  });

  // reset rootId if it doesn't match semaphoreId
  useEffect(() => {
    if (semaphoreId && rootId && compressBigInt(semaphoreId) !== rootId) {
      setRootId(null);
    }
  }, [rootId, semaphoreId, setRootId]);

  const { data: ready = false } = useQuery({
    queryKey: ["refreshToken", Boolean(z), rootId],
    queryFn: async () => {
      if (!z || !rootId) {
        return false;
      }
      const pwt = await z.pod.sign(
        PwtSpec.parse({
          aud: { type: "string", value: "frogcrypto" },
          exp: {
            type: "int",
            value: BigInt(Date.now() + 1000 * 60 * 60 * 24),
          },
          iss: {
            type: "cryptographic",
            value: decompressBigInt(rootId),
          },
          sub: { type: "cryptographic", value: decompressBigInt(rootId) },
        })
      );
      setToken(
        POD.load(pwt.entries, pwt.signature, pwt.signerPublicKey).serialize()
      );

      return true;
    },
    enabled: Boolean(z) && Boolean(rootId),
  });

  return ready;
}

export default useInitializeUser;
