import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useMyProfilePOD } from "../hooks/useProfilePOD";
import { useSocialTabStatus } from "../hooks/useUserState";
import Loader from "./shared/Loader";
import FrogCard from "./shared/FrogCard";
import ProfileEditor from "./social/ProfileEditor";

function SocialTab() {
  const [, setLocation] = useLocation();
  const { isAvailable: socialTabAvailable } = useSocialTabStatus();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();

  useEffect(() => {
    if (!socialTabAvailable) {
      setLocation("/", { replace: true });
    } else if (!isLoadingMyProfilePOD && !myProfilePOD) {
      setLocation("/social/tadpole");
    }
  }, [socialTabAvailable, isLoadingMyProfilePOD, myProfilePOD, setLocation]);

  if (!socialTabAvailable || isLoadingMyProfilePOD || !myProfilePOD) {
    return <Loader />;
  }

  return (
    <>
      <div className="btn-group w-2/3 self-end">
        <button type="button" className="btn">
          profile
        </button>
        <button type="button" className="btn">
          friends
        </button>
        <button type="button" className="btn">
          scores
        </button>
      </div>
      <ProfileEditor />
    </>
  );
}

export default SocialTab;
