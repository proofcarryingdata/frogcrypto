import { useMemo, useEffect } from "react";
import _ from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { POD } from "@pcd/pod";
import { type ProfileFrogPOD } from "@frogcrypto/shared";
import { trpc } from "../trpc";
import { useOtherProfilePODs } from "./useProfilePOD";
import { useSemaphoreIdBase64 } from "./useUserState";
import { useParcnetClient } from "./useParcnetClient";
import { QUERY_KEY_FROGS } from "./useFrogs";

export function usePendingFrogRequests() {
  const semaphoreId = useSemaphoreIdBase64();
  return trpc.social.getPendingRequests.useQuery(undefined, {
    select: (data) =>
      data.filter((request) => request.requestedBy !== semaphoreId),
  });
}

export function usePendingFrogRequestsCount() {
  const semaphoreId = useSemaphoreIdBase64();
  return trpc.social.getPendingRequests.useQuery(undefined, {
    select: (data) =>
      data.filter((request) => request.requestedBy !== semaphoreId).length,
  });
}

export function useAcceptedFrogRequests() {
  const semaphoreId = useSemaphoreIdBase64();
  const z = useParcnetClient();
  const queryClient = useQueryClient();

  const { data: otherProfilePODs } = useOtherProfilePODs();

  const acceptedRequestsQuery = trpc.social.getAcceptedRequests.useQuery();
  const { data: acceptedRequests } = acceptedRequestsQuery;

  const knownProfilePODs = useMemo(() => {
    return otherProfilePODs
      ? _.keyBy(otherProfilePODs, "profileId")
      : undefined;
  }, [otherProfilePODs]);
  useEffect(() => {
    if (!knownProfilePODs || !acceptedRequests) {
      return;
    }

    const toDelete: ProfileFrogPOD[] = [];
    const toAdd: POD[] = [];
    acceptedRequests.forEach((request) => {
      const profileId =
        request.party1 === semaphoreId ? request.party2 : request.party1;
      const podStr =
        request.party1 === semaphoreId ? request.party2POD : request.party1POD;

      if (podStr) {
        const pod = POD.deserialize(podStr);
        const knownPOD = knownProfilePODs[profileId];
        if (!knownPOD) {
          toAdd.push(pod);
        } else if (knownPOD.signature !== pod.signature) {
          toDelete.push(knownPOD);
          toAdd.push(pod);
        }
      }
    });

    void Promise.all([
      ...toDelete.map((pod) => z.pod.delete(pod.signature)),
      ...toAdd.map((pod) => z.pod.insert(pod)),
    ]).then(() =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_FROGS] })
    );
  }, [acceptedRequests, knownProfilePODs, queryClient, semaphoreId, z]);

  return acceptedRequestsQuery;
}
