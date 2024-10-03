import {
  parseProfileFrogPOD,
  type ProfileFrogPOD,
  ProfileFrogSpec,
  signProfileFrogData,
} from "@frogcrypto/shared";
import * as p from "@parcnet-js/podspec";
import {
  useMutation,
  type UseMutationOptions,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  useSemaphoreId,
  useSemaphoreIdBase64,
  useUserIdentity,
} from "./useUserState";
import { useParcnetClient } from "./useParcnetClient";

export const QUERY_KEYS_PROFILE_PODS = ["POD", "profilePOD"];

export function useProfilePODSpec(semaphoreId: string) {
  const userIdentity = useUserIdentity();

  return useMemo(
    () =>
      p.pod({
        entries: {
          ...ProfileFrogSpec.schema,
          owner: {
            ...ProfileFrogSpec.schema.owner,
            isMemberOf: semaphoreId
              ? [{ type: "cryptographic", value: BigInt(semaphoreId) }]
              : [],
          },
        },
        signerPublicKey: {
          isMemberOf: userIdentity ? [userIdentity.publicKey] : [],
        },
      }),
    [semaphoreId, userIdentity]
  );
}

export function useProfilePODs<TData = ProfileFrogPOD[]>(
  opts?: Omit<
    UseQueryOptions<ProfileFrogPOD[], Error, TData>,
    "queryKey" | "queryFn"
  >
) {
  const z = useParcnetClient();

  return useQuery({
    queryKey: QUERY_KEYS_PROFILE_PODS,
    queryFn: () =>
      z.pod
        .query(p.pod({ entries: ProfileFrogSpec.schema }))
        .then((pods) => pods.map(parseProfileFrogPOD)),
    ...opts,
  });
}

function useSelectMyProfilePOD() {
  const userIdentity = useUserIdentity();
  const semaphoreIdBase64 = useSemaphoreIdBase64();

  return useCallback(
    (pods: ProfileFrogPOD[] | undefined) => {
      return pods?.find(
        (pod) =>
          pod.ownerSemaphoreId === semaphoreIdBase64 &&
          pod.signerPublicKey === userIdentity?.publicKey
      );
    },
    [userIdentity, semaphoreIdBase64]
  );
}

export function useMyProfilePOD() {
  const select = useSelectMyProfilePOD();

  return useProfilePODs<ProfileFrogPOD | undefined>({
    select,
  });
}

export function useSetMyProfilePOD(
  opts?: Omit<UseMutationOptions<void, Error, ProfileFrogPOD>, "mutationFn">
) {
  const userIdentity = useUserIdentity();
  const z = useParcnetClient();
  const queryClient = useQueryClient();
  const selectMyProfilePOD = useSelectMyProfilePOD();

  return useMutation({
    mutationFn: async (unsignedPOD: ProfileFrogPOD) => {
      if (!userIdentity?.privateKey) {
        throw new Error("User not initialized");
      }

      const signedPOD = signProfileFrogData(
        unsignedPOD,
        userIdentity.privateKey
      );
      const parsedPOD = parseProfileFrogPOD(signedPOD);
      await z.pod.insert(signedPOD);

      queryClient.setQueryData<ProfileFrogPOD[]>(
        QUERY_KEYS_PROFILE_PODS,
        (oldData) => {
          if (!oldData) return [parsedPOD];

          const oldProfilePOD = selectMyProfilePOD(oldData);
          if (oldProfilePOD) {
            void z.pod.delete(oldProfilePOD.signature);
          }

          return [...oldData.filter((pod) => pod !== oldProfilePOD), parsedPOD];
        }
      );
    },
    ...opts,
  });
}
