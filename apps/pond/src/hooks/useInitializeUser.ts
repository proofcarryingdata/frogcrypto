import {
  compressBigInt,
  DEVCON_7_EVENT_ID,
  DEVCON_7_SIGNER_PUBLIC_KEY,
  DEVCON_7_TICKET_COLLECTION_ID,
  logger,
  POD_TYPE_FROGCRYPTO_PWT,
  PwtSpec,
  TicketProofRequest,
  TicketSpec,
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

  const { data: isPwtSet = false } = useQuery({
    queryKey: ["refreshToken", Boolean(z), String(semaphoreId)],
    queryFn: async () => {
      if (!z || !semaphoreId) {
        throw new Error("Missing zupassAPI, or semaphoreId");
      }

      const exp = Date.now() + 1000 * 60 * 60 * 24;
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
            value: semaphoreId,
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
    enabled: Boolean(z) && Boolean(semaphoreId),
    refetchInterval: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const { data: devcon7Ticket } = useQuery({
    queryKey: ["devcon7Ticket", Boolean(z), String(semaphoreId)],
    enabled: Boolean(z) && Boolean(semaphoreId),
    queryFn: async () => {
      if (!z || !semaphoreId) {
        throw new Error("Missing zupassAPI, or semaphoreId");
      }

      console.log("fetching tickets");
      console.log(
        "tickets",
        await z.pod.collection(DEVCON_7_TICKET_COLLECTION_ID).query(
          p.pod({
            entries: {},
          })
        )
      );

      const [ticket] = await z.pod
        .collection(DEVCON_7_TICKET_COLLECTION_ID)
        .query(
          p.pod({
            ...TicketSpec.schema,
            // signerPublicKey: {
            //   isMemberOf: [DEVCON_7_SIGNER_PUBLIC_KEY],
            // },
            // tuples: [
            //   {
            //     entries: ["eventId"],
            //     isMemberOf: [[{ type: "string", value: DEVCON_7_EVENT_ID }]],
            //   },
            //   {
            //     entries: ["attendeeSemaphoreId"],
            //     isMemberOf: [[{ type: "cryptographic", value: semaphoreId }]],
            //   },
            // ],
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
    mutationFn: async (force: boolean) => {
      if (!z) {
        throw new Error("Missing zupassAPI");
      }

      // try {
      //   const proof = await z.gpc.prove({
      //     request: TicketProofRequest.schema,
      //   });
      //   if (!proof.success) {
      //     logger.error("Failed to prove ticket", proof);
      //     throw new Error("Failed to prove ticket");
      //   }

      //   await auth({ ticket: null, proof: stringify(proof) });
      // } catch (e) {
      //   if (force) {
      //     await auth({ ticket: null, proof: null });
      //   }
      // }
      await auth({ ticket: null, proof: null });

      // await auth({
      //   ticket: ticket
      //     ? POD.load(ticket.entries, ticket.signature, ticket.signerPublicKey)
      //     : null,
      // });

      if (semaphoreId) {
        setSemaphoreIdBase64(compressBigInt(semaphoreId));
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
      initializeUser(true);
    }
  }, [meError, initializeUser]);
  const hasRemoteTicket = Boolean(userState?.myScore.devcon7TicketId);
  useEffect(() => {
    if (hasIdentity && !hasRemoteTicket && devcon7Ticket) {
      initializeUser(false);
    }
  }, [hasIdentity, hasRemoteTicket, initializeUser, devcon7Ticket]);

  useEffect(() => {
    if (semaphoreId && !semaphoreIdBase64 && hasIdentity) {
      setSemaphoreIdBase64(compressBigInt(semaphoreId));
    }
  }, [semaphoreIdBase64, semaphoreId, setSemaphoreIdBase64, hasIdentity]);

  return { hasIdentity, error };
}

export default useInitializeUser;
