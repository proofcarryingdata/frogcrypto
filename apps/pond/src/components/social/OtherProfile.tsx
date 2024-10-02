import React, { useMemo, useState } from "react";
import { useParams } from "wouter";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { Button } from "../shared/Button";
import Loader from "../shared/Loader";
import Modal from "../shared/Modal";
import useFrogs, { useProfileFrogs } from "../../hooks/useFrogs";
import { trpc } from "../../trpc";
import FrogProfile from "./FrogProfile";

function OtherProfile() {
  const { id } = useParams();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();
  const profileId = id ? decodeURIComponent(id) : undefined;

  const { frogs, isLoading: isLoadingFrogs } = useProfileFrogs();
  const { data: userData, isLoading: isLoadingSpiritFrog } =
    trpc.users.getSpiritFrog.useQuery(
      {
        profileId: profileId ?? "",
      },
      {
        enabled: Boolean(profileId),
      }
    );

  const knownFrog = useMemo(() => {
    if (!profileId || !userData) return undefined;
    return frogs?.find((frog) => frog.profileId === userData.semaphoreIdBase64);
  }, [frogs, profileId, userData]);

  if (isLoadingFrogs || isLoadingMyProfilePOD || isLoadingSpiritFrog)
    return <Loader />;

  if (!userData) {
    throw new Error("No user data found");
  }

  const { spiritFrog, friendCount, frogCount } = userData;
  if (!spiritFrog) {
    throw new Error("No spirit frog found");
  }

  return (
    <div className="container mx-auto px-4">
      <FrogProfile
        frog={knownFrog ?? spiritFrog}
        profileId={profileId ?? ""}
        isMyProfile={knownFrog?.profileId === myProfilePOD?.profileId}
        friendStatus={knownFrog ? "friends" : "none"}
        friendCount={friendCount}
        frogCount={frogCount}
      />
    </div>
  );
}

export default OtherProfile;
