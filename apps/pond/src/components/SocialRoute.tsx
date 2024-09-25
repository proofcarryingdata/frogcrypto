import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useMyProfilePOD } from "../hooks/useProfilePOD";
import { useSocialTabStatus } from "../hooks/useUserState";
import Loader from "./shared/Loader";
import SocialTab from "./SocialTab";

function SocialRoute() {
  const [, setLocation] = useLocation();
  const { isAvailable: socialTabAvailable } = useSocialTabStatus();
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();

  useEffect(() => {
    if (!socialTabAvailable) {
      setLocation("/pond");
    } else if (!isLoadingMyProfilePOD && !myProfilePOD) {
      setLocation("/tadpole-transformation");
    }
  }, [socialTabAvailable, isLoadingMyProfilePOD, myProfilePOD, setLocation]);

  if (!socialTabAvailable || isLoadingMyProfilePOD || !myProfilePOD) {
    return <Loader />;
  }

  return <SocialTab />;
}

export default SocialRoute;
