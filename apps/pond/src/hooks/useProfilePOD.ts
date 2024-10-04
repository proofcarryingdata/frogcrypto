import { type ProfileFrogPOD, signProfileFrogData } from "@frogcrypto/shared";
import { type POD } from "@pcd/pod";
import {
  useMutation,
  type UseMutationOptions,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { QUERY_KEY_FROGS, useProfileFrogs } from "./useFrogs";
import { useParcnetClient } from "./useParcnetClient";
import { useSemaphoreIdBase64, useUserIdentity } from "./useUserState";

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
  const userIdentity = useUserIdentity();
  const z = useParcnetClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (unsignedPOD: ProfileFrogPOD) => {
      if (!userIdentity?.privateKey) {
        throw new Error("User not initialized");
      }

      const signedPOD = signProfileFrogData(
        unsignedPOD,
        userIdentity.privateKey
      );
      await z.pod.insert(signedPOD);

      const frogs = queryClient.getQueryData<POD[]>([QUERY_KEY_FROGS]);
      if (!frogs) {
        return;
      }

      const oldPOD = frogs.find(
        (pod) =>
          pod.content.getRawValue("profileId") ===
            signedPOD.content.getRawValue("profileId") &&
          pod.content.getRawValue("ownerSemaphoreId") ===
            signedPOD.content.getRawValue("ownerSemaphoreId")
      );
      if (oldPOD) {
        await z.pod.delete(oldPOD.signature);
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
