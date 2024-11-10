import {
  compressBigInt,
  DEVCON_7_EVENT_ID,
  DEVCON_7_SIGNER_PUBLIC_KEYS,
  DEVCON_7_TICKET_COLLECTION_ID,
  POD_TYPE_FROGCRYPTO_PWT,
  PwtSpec,
  TicketSpec,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import { POD } from "@pcd/pod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { atom, useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { setToken, trpc } from "../trpc";
import { parcnetAPIAtom } from "./useParcnetClient";
import { semaphoreIdBase64Atom } from "./useUserState";

const zupassSemaphoreIdAtom = atom<Promise<bigint>>(async (get) => {
  const z = await get(parcnetAPIAtom);
  return z.identity.getSemaphoreV4Commitment();
});

function useInitializeUser() {
  const [semaphoreIdBase64, setSemaphoreIdBase64] = useAtom(
    semaphoreIdBase64Atom
  );
  const zupassSemaphoreId = useAtomValue(zupassSemaphoreIdAtom);

  useEffect(() => {
    if (semaphoreIdBase64 && zupassSemaphoreId) {
      if (compressBigInt(zupassSemaphoreId) !== semaphoreIdBase64) {
        // reset local storage and reload app
        localStorage.clear();
        window.location.reload();
      }
    }
  }, [zupassSemaphoreId, semaphoreIdBase64, setSemaphoreIdBase64]);

  const z = useAtomValue(parcnetAPIAtom);
  const { mutateAsync: auth } = trpc.users.auth.useMutation();

  const { data: isPwtSet = false } = useQuery({
    queryKey: ["refreshToken", Boolean(z), String(zupassSemaphoreId)],
    queryFn: async () => {
      if (!z || !zupassSemaphoreId) {
        throw new Error("Missing zupassAPI, or semaphoreId");
      }

      // 6 hrs from now and round to next midnight
      const DAY_IN_MS = 1000 * 60 * 60 * 24;
      const exp =
        Math.ceil((Date.now() + 1000 * 60 * 60 * 6) / DAY_IN_MS) * DAY_IN_MS;
      const pwt = await z.pod.sign(
        PwtSpec.parse({
          pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PWT },
          aud: { type: "string", value: "frogcrypto" },
          exp: {
            type: "int",
            value: BigInt(exp),
          },
          iss: {
            type: "cryptographic",
            value: zupassSemaphoreId,
          },
        })
      );
      setToken(
        JSON.stringify(
          POD.load(pwt.entries, pwt.signature, pwt.signerPublicKey).toJSON()
        ),
        exp
      );

      return true;
    },
    enabled: Boolean(z) && Boolean(zupassSemaphoreId),
    refetchInterval: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const { data: devcon7Ticket } = useQuery({
    queryKey: ["devcon7Ticket", Boolean(z), String(zupassSemaphoreId)],
    enabled: Boolean(z) && Boolean(zupassSemaphoreId),
    queryFn: async () => {
      if (!z || !zupassSemaphoreId) {
        throw new Error("Missing zupassAPI, or semaphoreId");
      }

      const publicKey = await z.identity.getPublicKey();

      const [ticket] = await z.pod
        .collection(DEVCON_7_TICKET_COLLECTION_ID)
        .query(
          p.pod({
            entries: {
              ...TicketSpec.schema.entries,
              isAddOn: {
                type: "optional",
                innerType: {
                  type: "int",
                  isNotMemberOf: [
                    {
                      type: "int",
                      value: 1n,
                    },
                  ],
                },
              },
            },
            signerPublicKey: {
              isMemberOf: [...DEVCON_7_SIGNER_PUBLIC_KEYS],
            },
            tuples: [
              {
                entries: ["eventId"],
                isMemberOf: [[{ type: "string", value: DEVCON_7_EVENT_ID }]],
              },
              {
                entries: ["owner"],
                isMemberOf: [[{ type: "eddsa_pubkey", value: publicKey }]],
              },
            ],
          })
        );

      if (!ticket) {
        throw new Error("No devcon7 ticket found");
      }

      return ticket;
    },
    retry: false,
  });

  const utils = trpc.useUtils();
  const { mutate: initializeUser, error } = useMutation({
    mutationFn: async () => {
      if (!z) {
        throw new Error("Missing zupassAPI");
      }

      await auth({
        ticket: devcon7Ticket
          ? POD.load(
              devcon7Ticket.entries,
              devcon7Ticket.signature,
              devcon7Ticket.signerPublicKey
            )
          : null,
      });

      if (zupassSemaphoreId) {
        setSemaphoreIdBase64(compressBigInt(zupassSemaphoreId));
      }
      await utils.users.me.invalidate();

      return true;
    },
    retry: false,
  });

  const { data: userState, error: meError } = trpc.users.me.useQuery(
    {
      feedIds: [],
    },
    {
      enabled: isPwtSet,
      retry: false,
    }
  );
  const hasIdentity = Boolean(userState);
  useEffect(() => {
    if (meError) {
      initializeUser();
    }
  }, [meError, initializeUser]);
  const hasRemoteTicket = Boolean(userState?.myScore.devcon7TicketId);
  useEffect(() => {
    if (hasIdentity && !hasRemoteTicket && devcon7Ticket) {
      initializeUser();
    }
  }, [hasIdentity, hasRemoteTicket, initializeUser, devcon7Ticket]);

  useEffect(() => {
    if (zupassSemaphoreId && !semaphoreIdBase64 && hasIdentity) {
      setSemaphoreIdBase64(compressBigInt(zupassSemaphoreId));
    }
  }, [semaphoreIdBase64, zupassSemaphoreId, setSemaphoreIdBase64, hasIdentity]);

  return { hasIdentity, error };
}

export default useInitializeUser;
