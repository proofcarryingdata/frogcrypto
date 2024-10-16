import {
  PwtSpec,
  decompressBigInt,
  FROGCRYPTO_FOLDER_NAME,
  getPlayerIDEntries,
  PlayerIDSpec,
  compressBigInt,
  TicketProofRequest,
  logger,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { stringify } from "superjson";
import { setToken, trpc } from "../trpc";
import { useMaybeParcnetClient } from "./useParcnetClient";
import { semaphoreIdBase64Atom } from "./useUserState";

function useInitializeUser() {
  const [semaphoreIdBase64, setSemaphoreIdBase64] = useAtom(
    semaphoreIdBase64Atom
  );
  const z = useMaybeParcnetClient();
  const { mutateAsync: auth } = trpc.users.auth.useMutation();

  const { data: semaphoreId } = useQuery({
    queryKey: ["zupassId"],
    queryFn: () => z?.identity.getSemaphoreV4Commitment(),
    enabled: Boolean(z),
  });

  // reset rootId if it doesn't match semaphoreId
  useEffect(() => {
    if (
      semaphoreId &&
      semaphoreIdBase64 &&
      compressBigInt(semaphoreId) !== semaphoreIdBase64
    ) {
      setSemaphoreIdBase64(null);
    }
  }, [semaphoreIdBase64, semaphoreId, setSemaphoreIdBase64]);

  const utils = trpc.useUtils();
  const { mutate: initializeUser, error } = useMutation({
    mutationFn: async () => {
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

      const proof = await z.gpc.prove({
        request: TicketProofRequest.schema,
      });
      if (!proof.success) {
        logger.error("Failed to prove ticket", proof);
        throw new Error("Failed to prove ticket");
      }

      const playerIDPOD =
        pods[0] ??
        (await z.pod.sign(
          getPlayerIDEntries({
            playerPk: publicKey,
            device: window.navigator.userAgent,
            location: window.location.href,
            proof: stringify(proof),
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

      setSemaphoreIdBase64(compressBigInt(semaphoreId));
      await utils.users.me.invalidate();

      return true;
    },
    retry: false,
  });

  const { data: isPwtSet = false } = useQuery({
    queryKey: ["refreshToken", Boolean(z), String(semaphoreId)],
    queryFn: async () => {
      if (!z || !semaphoreId) {
        throw new Error("Missing zupassAPI, or semaphoreId");
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
            value: semaphoreId,
          },
        })
      );
      setToken(
        POD.load(pwt.entries, pwt.signature, pwt.signerPublicKey).serialize()
      );

      return true;
    },
    enabled: Boolean(z) && Boolean(semaphoreId),
    refetchInterval: 1000 * 60 * 60,
  });

  const { data: hasIdentity, error: meError } = trpc.users.me.useQuery(
    {
      feedIds: [],
    },
    {
      enabled: isPwtSet,
      retry: false,
      select: (data) => Boolean(data),
    }
  );
  useEffect(() => {
    if (meError) {
      initializeUser();
    }
  }, [meError, initializeUser]);
  useEffect(() => {
    if (semaphoreId && !semaphoreIdBase64 && hasIdentity) {
      setSemaphoreIdBase64(compressBigInt(semaphoreId));
    }
  }, [semaphoreIdBase64, semaphoreId, setSemaphoreIdBase64, hasIdentity]);

  return { hasIdentity, error };
}

export default useInitializeUser;
