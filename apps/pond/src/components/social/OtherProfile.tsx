import React, { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useLocation, useParams } from "wouter";
import { signProfileFrogData } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { useProfileFrogs } from "../../hooks/useFrogs";
import { useMyProfilePOD } from "../../hooks/useProfilePOD";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";
import { useUserIdentity } from "../../hooks/useUserState";
import { useParcnetClient } from "../../hooks/useParcnetClient";
import FrogProfile from "./FrogProfile";

const useAddFriend = (otherPartyId: string) => {
  const userIdentity = useUserIdentity();
  const { data: profilePOD } = useMyProfilePOD();

  const utils = trpc.useUtils();
  const createSocialRequest =
    trpc.social.createOrUpdateSocialRequest.useMutation({
      onSuccess: (data) => {
        void utils.social.getPendingRequests.invalidate();
        if (data.status === "accepted_existing") {
          toast.success("Request accepted! You've made a new connection!");
        } else {
          toast.success("Social request sent successfully!");
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  if (!otherPartyId) {
    return undefined;
  }

  return () => {
    if (!userIdentity) {
      throw new Error("User identity not found");
    }
    if (!profilePOD) {
      // FIXME: we need to bring user to frog minter first
      throw new Error("Profile not found");
    }

    const requestPOD = signProfileFrogData(
      {
        ...profilePOD,
        ownerSemaphoreId: otherPartyId,
      },
      userIdentity.privateKey
    );

    createSocialRequest.mutate({
      otherPartyId,
      requestPOD,
    });
  };
};

const useAcceptRequest = (pendingRequest?: {
  id: number;
  requestedBy: string;
  requestPOD: string | null;
}) => {
  const userIdentity = useUserIdentity();
  const { data: profilePOD } = useMyProfilePOD();
  const z = useParcnetClient();

  const utils = trpc.useUtils();
  const createSocialRequest = trpc.social.acceptRequest.useMutation({
    onSuccess: async (data) => {
      void utils.social.getPendingRequests.invalidate();
      if (data.success) {
        toast.success("Request accepted! You've made a new connection!");
      }

      if (!pendingRequest) {
        return;
      }
      if (!pendingRequest.requestPOD) {
        throw new Error("Request POD not found");
      }
      await z.pod.insert(POD.deserialize(pendingRequest.requestPOD));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (!pendingRequest) {
    return undefined;
  }

  return () => {
    if (!userIdentity) {
      throw new Error("User identity not found");
    }
    if (!profilePOD) {
      // FIXME: we need to bring user to frog minter first
      throw new Error("Profile not found");
    }

    const responsePOD = signProfileFrogData(
      {
        ...profilePOD,
        ownerSemaphoreId: pendingRequest.requestedBy,
      },
      userIdentity.privateKey
    );

    createSocialRequest.mutate({
      requestId: pendingRequest.id,
      responsePOD,
    });
  };
};

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
  useEffect(() => {
    if (userDataError) {
      toast.error("Ribbit! This frog seems to have hopped away. 🐸");
      setLocation("/");
    }
  }, [setLocation, userDataError]);

  const knownFrog = useMemo(() => {
    if (!profileId || !userData) return undefined;
    return frogs?.find((frog) => frog.profileId === userData.semaphoreIdBase64);
  }, [frogs, profileId, userData]);

  const { data: pendingRequests } = trpc.social.getPendingRequests.useQuery();
  const pendingRequest = useMemo(() => {
    if (!profileId || !pendingRequests) return undefined;
    return pendingRequests.find(
      (request) => request.party1 === profileId || request.party2 === profileId
    );
  }, [profileId, pendingRequests]);
  const canAcceptRequest = useMemo(() => {
    if (!pendingRequest) return false;
    return (
      (pendingRequest.party1 === profileId &&
        Boolean(pendingRequest.party1POD)) ||
      (pendingRequest.party2 === profileId && Boolean(pendingRequest.party2POD))
    );
  }, [pendingRequest, profileId]);
  const friendStatus = useMemo(() => {
    if (knownFrog) return "friends";
    if (pendingRequest) return "pending";
    return "none";
  }, [knownFrog, pendingRequest]);

  const onAddFriend = useAddFriend(
    !pendingRequest || canAcceptRequest ? (profileId ?? "") : ""
  );
  const onAcceptRequest = useAcceptRequest(pendingRequest);

  if (isLoadingFrogs || isLoadingMyProfilePOD || !userData) return <Loader />;

  const { spiritFrog, friendCount, frogCount } = userData;

  return (
    <FrogProfile
      frog={knownFrog ?? spiritFrog}
      profileId={profileId ?? ""}
      isMyProfile={knownFrog?.profileId === myProfilePOD?.profileId}
      friendStatus={friendStatus}
      friendCount={friendCount}
      frogCount={frogCount}
      onAddFriend={onAcceptRequest ?? onAddFriend}
    />
  );
}

export default OtherProfile;
