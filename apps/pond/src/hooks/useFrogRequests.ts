import { useMemo, useEffect } from "react";
import _ from "lodash";
import { useQueryClient } from "@tanstack/react-query";
import { type JSONPOD, POD } from "@pcd/pod";
import {
  FROGCRYPTO_FOLDER_NAME,
  type ProfileFrogPOD,
} from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { trpc } from "../trpc";
import { useOtherProfilePODs } from "./useProfilePOD";
import { useSemaphoreIdBase64 } from "./useUserState";
import { useParcnetClient } from "./useParcnetClient";

export function useAcceptedFrogRequests() {
  const semaphoreId = useSemaphoreIdBase64();
  const z = useParcnetClient();
  const queryClient = useQueryClient();

  const otherProfilePODs = useOtherProfilePODs();

  const acceptedRequestsQuery = trpc.social.getAcceptedRequests.useQuery();
  const { data: acceptedRequests } = acceptedRequestsQuery;

  const knownProfilePODs = useMemo(
    () => _.keyBy(otherProfilePODs, "profileId"),
    [otherProfilePODs]
  );
  useEffect(() => {
    if (!acceptedRequests) {
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
        const pod = POD.fromJSON(JSON.parse(podStr) as JSONPOD);
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
      ...toDelete.map((pod) =>
        z.pod.collection(FROGCRYPTO_FOLDER_NAME).delete(pod.signature)
      ),
      ...toAdd.map((pod) =>
        z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(podToPODData(pod))
      ),
    ]);
  }, [acceptedRequests, knownProfilePODs, queryClient, semaphoreId, z]);

  return acceptedRequestsQuery;
}
