import React, { useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { getUsernameFromHash, type ProfileFrogPOD } from "@frogcrypto/shared";
import Loader from "../shared/Loader";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { useSemaphoreIdBase64, useUserState } from "../../hooks/useUserState";

function NewProfile() {
  const [, setLocation] = useLocation();
  const myProfile = useMyProfilePOD();
  const { mutate: setMyProfile, isPending: isSettingMyProfile } =
    useSetMyProfilePOD();
  const { data: userState } = useUserState();
  const semaphoreIdBase64 = useSemaphoreIdBase64();
  const templateFrog = useMemo(() => {
    const spiritFrog = userState?.spiritFrog;

    if (!semaphoreIdBase64 || !spiritFrog) return;
    return {
      ...spiritFrog,
      timestampSigned: Date.now(),
      ownerSemaphoreId: semaphoreIdBase64,

      profileId: semaphoreIdBase64,
      profileName: getUsernameFromHash(userState.myScore.semaphoreIdHash),
      telegramUsername: "",
      farcasterUsername: "",

      signature: "",
      signerPublicKey: "",
    } satisfies ProfileFrogPOD;
  }, [semaphoreIdBase64, userState]);

  useEffect(() => {
    if (myProfile) {
      setLocation("/social");
    }
  }, [myProfile, setLocation]);

  useEffect(() => {
    if (isSettingMyProfile) return;
    if (!templateFrog) return;
    if (!myProfile) {
      setMyProfile(templateFrog);
    }
  }, [isSettingMyProfile, myProfile, setMyProfile, templateFrog]);

  return <Loader />;
}

export default NewProfile;
