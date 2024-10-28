import {
  FROGCRYPTO_FOLDER_NAME,
  type ProfileFrogPOD,
  toProfileFrogPODEntries,
} from "@frogcrypto/shared";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { atom, useAtomValue } from "jotai";
import { profileFrogsAtom } from "./useFrogs";
import { useParcnetClient } from "./useParcnetClient";
import { semaphoreIdBase64Atom } from "./useUserState";

const myProfilePODAtom = atom<Promise<ProfileFrogPOD | undefined>>(
  async (get) => {
    const semaphoreIdBase64 = get(semaphoreIdBase64Atom);
    const frogs = await get(profileFrogsAtom);
    return frogs.find(
      (pod) =>
        pod.ownerSemaphoreId === semaphoreIdBase64 &&
        pod.profileId === semaphoreIdBase64
    );
  }
);

export function useMyProfilePOD() {
  return useAtomValue(myProfilePODAtom);
}

const otherProfilePODsAtom = atom<Promise<ProfileFrogPOD[]>>(async (get) => {
  const semaphoreIdBase64 = get(semaphoreIdBase64Atom);
  const frogs = await get(profileFrogsAtom);
  return frogs.filter((pod) => pod.profileId !== semaphoreIdBase64);
});
export function useOtherProfilePODs() {
  return useAtomValue(otherProfilePODsAtom);
}

export function useSetMyProfilePOD(
  opts?: Omit<UseMutationOptions<void, Error, ProfileFrogPOD>, "mutationFn">
) {
  const z = useParcnetClient();
  const myProfilePOD = useMyProfilePOD();

  return useMutation({
    mutationFn: async (unsignedPOD: ProfileFrogPOD) => {
      const oldSignature = myProfilePOD?.signature;

      const signedPOD = await z.pod.sign(toProfileFrogPODEntries(unsignedPOD));
      await z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(signedPOD);

      if (oldSignature) {
        await z.pod.collection(FROGCRYPTO_FOLDER_NAME).delete(oldSignature);
      }
    },
    ...opts,
  });
}
