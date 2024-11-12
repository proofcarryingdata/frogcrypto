import { type ProfileFrogPOD } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { type JSONPOD, POD } from "@pcd/pod";
import _ from "lodash";
import { useEffect, useMemo } from "react";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { trpc } from "../trpc";
import { useManageFrogs } from "./useFrogs";
import { useOtherProfilePODs } from "./useProfilePOD";
import { useSemaphoreIdBase64 } from "./useUserState";

const savedFrogRequestsAtAtom = atomWithStorage<number>(
  "savedFrogRequestsAt",
  0
);

export function useAcceptedFrogRequests() {
  const semaphoreId = useSemaphoreIdBase64();
  const frogs = useManageFrogs();
  const [savedFrogRequestsAt, setSavedFrogRequestsAt] = useAtom(
    savedFrogRequestsAtAtom
  );

  const otherProfilePODs = useOtherProfilePODs();

  const { data: acceptedRequests } = trpc.social.getAcceptedRequests.useQuery({
    cutoff: savedFrogRequestsAt,
  });

  const knownProfilePODs = useMemo(
    () => _.keyBy(otherProfilePODs, "profileId"),
    [otherProfilePODs]
  );
  useEffect(() => {
    if (!acceptedRequests || acceptedRequests.length === 0) {
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

    setSavedFrogRequestsAt(
      _.max(acceptedRequests.map((request) => request.updatedAt.getTime())) ?? 0
    );

    void Promise.all([
      ...toDelete.map((pod) => frogs.delete(pod.signature)),
      ...toAdd.map((pod) => frogs.insert(podToPODData(pod))),
    ]);
  }, [
    acceptedRequests,
    knownProfilePODs,
    semaphoreId,
    frogs,
    setSavedFrogRequestsAt,
  ]);
}
