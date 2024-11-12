import {
  getUsernameFromHash,
  isSpiritFrogDataEqualish,
  type ProfileFrogPOD,
} from "@frogcrypto/shared";
import { useEffect, useMemo, useRef } from "react";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { useSemaphoreIdBase64, useUserState } from "../../hooks/useUserState";

function EnsureProfilePOD() {
  // NB: temporary guard to prevent infinite loop
  const setOnceRef = useRef(false);

  const myProfile = useMyProfilePOD();
  const { mutate: setMyProfile, isPending: isSettingMyProfile } =
    useSetMyProfilePOD();
  const { data: userState } = useUserState();
  const semaphoreIdBase64 = useSemaphoreIdBase64();
  const templateFrog = useMemo(() => {
    const spiritFrog = userState?.spiritFrog;

    if (!semaphoreIdBase64 || !spiritFrog) return;
    return {
      telegramUsername: "",
      farcasterUsername: "",
      ...(myProfile ?? {}),

      ...spiritFrog,
      timestampSigned: Date.now(),
      ownerSemaphoreId: semaphoreIdBase64,

      profileId: semaphoreIdBase64,
      profileName: getUsernameFromHash(userState.myScore.semaphoreIdHash),

      signature: "",
      signerPublicKey: "",
    } satisfies ProfileFrogPOD;
  }, [myProfile, semaphoreIdBase64, userState]);

  useEffect(() => {
    if (isSettingMyProfile) return;
    if (!templateFrog) return;
    if (!myProfile || !isSpiritFrogDataEqualish(myProfile, templateFrog)) {
      if (setOnceRef.current) return;
      setOnceRef.current = true;

      setMyProfile(templateFrog);
    }
  }, [isSettingMyProfile, myProfile, setMyProfile, templateFrog]);

  return null;
}

export default EnsureProfilePOD;
