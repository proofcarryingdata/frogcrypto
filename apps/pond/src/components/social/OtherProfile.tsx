import React, { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useLocation, useParams } from "wouter";
import { useProfileFrogs } from "../../hooks/useFrogs";
import { useMyProfilePOD } from "../../hooks/useProfilePOD";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";
import FrogProfile from "./FrogProfile";

function OtherProfile() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();
  const profileId = id ? decodeURIComponent(id) : undefined;

  const { frogs, isLoading: isLoadingFrogs } = useProfileFrogs();
  const { data: userData, error: userDataError } =
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

  useEffect(() => {
    if (userDataError) {
      toast.error("Ribbit! This frog seems to have hopped away. 🐸");
      setLocation("/");
    }
  }, [setLocation, userDataError]);

  if (isLoadingFrogs || isLoadingMyProfilePOD || !userData) return <Loader />;

  const { spiritFrog, friendCount, frogCount } = userData;

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
