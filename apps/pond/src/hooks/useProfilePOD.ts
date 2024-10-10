import {
  FROGCRYPTO_FOLDER_NAME,
  type ProfileFrogPOD,
  toProfileFrogPODEntries,
} from "@frogcrypto/shared";
import { type PODData } from "@parcnet-js/podspec";
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { QUERY_KEY_FROGS, useProfileFrogs } from "./useFrogs";
import { useParcnetClient } from "./useParcnetClient";
import { useSemaphoreIdBase64 } from "./useUserState";

function useSelectMyProfilePOD() {
  const semaphoreIdBase64 = useSemaphoreIdBase64();

  return useCallback(
    (pods: ProfileFrogPOD[]) => {
      return pods.find(
        (pod) =>
          pod.ownerSemaphoreId === semaphoreIdBase64 &&
          pod.profileId === semaphoreIdBase64
      );
    },
    [semaphoreIdBase64]
  );
}

export function useMyProfilePOD() {
  const select = useSelectMyProfilePOD();

  return useProfileFrogs<ProfileFrogPOD | undefined>({
    select,
  });
}

export function useOtherProfilePODs() {
  const semaphoreIdBase64 = useSemaphoreIdBase64();
  const select = useCallback(
    (pods: ProfileFrogPOD[]) => {
      return pods.filter((pod) => pod.profileId !== semaphoreIdBase64);
    },
    [semaphoreIdBase64]
  );

  return useProfileFrogs({
    select,
  });
}

export function useSetMyProfilePOD(
  opts?: Omit<UseMutationOptions<void, Error, ProfileFrogPOD>, "mutationFn">
) {
  const z = useParcnetClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unsignedPOD: ProfileFrogPOD) => {
      const signedPOD = await z.pod.sign(toProfileFrogPODEntries(unsignedPOD));
      await z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(signedPOD);

      const frogs = queryClient.getQueryData<PODData[]>([QUERY_KEY_FROGS]);
      if (!frogs) {
        return;
      }

      const oldPOD = frogs.find(
        (pod) =>
          pod.entries.profileId?.value === signedPOD.entries.profileId?.value &&
          pod.entries.ownerSemaphoreId?.value ===
            signedPOD.entries.ownerSemaphoreId?.value
      );
      if (oldPOD) {
        await z.pod.collection(FROGCRYPTO_FOLDER_NAME).delete(oldPOD.signature);
      }

      const newFrogs = [
        signedPOD,
        ...frogs.filter((pod) => pod.signature !== oldPOD?.signature),
      ];
      queryClient.setQueryData([QUERY_KEY_FROGS], newFrogs);
    },
    ...opts,
  });
}
