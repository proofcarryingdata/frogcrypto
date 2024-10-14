import { Biome, type IFrogData, Rarity, Temperament } from "@frogcrypto/shared";
import { AlertTriangle } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { validate as uuidValidate } from "uuid";
import { useLocation, useParams } from "wouter";
import useAcceptFrogRequest from "../../hooks/useAcceptFrogRequest";
import { useProfileFrogs } from "../../hooks/useFrogs";
import { useMyProfilePOD } from "../../hooks/useProfilePOD";
import useSendFrogRequest from "../../hooks/useSendFrogRequest";
import { useSemaphoreIdBase64, useUserState } from "../../hooks/useUserState";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";
import FrogProfile from "./FrogProfile";
import MyProfile from "./MyProfile";

function ClaimedProfile({
  spiritFrog,
  friendCount,
  frogCount,
  profileId,
}: {
  spiritFrog: IFrogData;
  friendCount: number;
  frogCount: number;
  profileId: string;
}) {
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();

  const { data: frogs, isLoading: isLoadingFrogs } = useProfileFrogs();

  const knownFrog = useMemo(() => {
    if (!profileId) return undefined;
    return frogs?.find((frog) => frog.profileId === profileId);
  }, [frogs, profileId]);

  const { data: pendingRequests } = trpc.social.getPendingRequests.useQuery();
  const pendingRequest = useMemo(() => {
    if (!profileId || !pendingRequests) return undefined;
    return pendingRequests.find(
      (request) => request.party1 === profileId || request.party2 === profileId
    );
  }, [profileId, pendingRequests]);

  const status = useMemo(() => {
    if (knownFrog)
      return knownFrog.profileId === myProfilePOD?.profileId
        ? "mine"
        : "friends";
    if (pendingRequest) return "pending";
    return "unclaimed";
  }, [knownFrog, pendingRequest, myProfilePOD?.profileId]);

  const { mutate: sendFrogRequest } = useSendFrogRequest();
  const { mutate: acceptRequest } = useAcceptFrogRequest();
  const onClick = useMemo(() => {
    if (pendingRequest) {
      if (pendingRequest.requestedBy === profileId) {
        return () => {
          acceptRequest(pendingRequest);
        };
      }
    } else if (profileId) {
      return () => {
        sendFrogRequest(profileId);
      };
    }
    return undefined;
  }, [pendingRequest, profileId, acceptRequest, sendFrogRequest]);

  if (isLoadingFrogs || isLoadingMyProfilePOD) return <Loader />;

  return (
    <FrogProfile
      frog={knownFrog ?? spiritFrog}
      profileId={profileId}
      status={status}
      friendCount={friendCount}
      frogCount={frogCount}
      onAddFriend={onClick}
    />
  );
}

function UnclaimedProfile({
  profileId,
  claimable,
}: {
  profileId: string;
  claimable: boolean;
}) {
  const unclaimedFrog: IFrogData = {
    name: "???",
    imageUrl: "/images/unknown_frog.png",
    description: claimable
      ? "A mysterious frog waiting to be claimed..."
      : "You already has a frog profile. Hands off!",
    frogId: Number.MAX_SAFE_INTEGER,
    biome: Biome.Unknown,
    rarity: Rarity.Unknown,
    temperament: Temperament.UNKNOWN,
    jump: 0,
    speed: 0,
    intelligence: 0,
    beauty: 0,
    timestampSigned: 0,
    ownerSemaphoreId: "",
  };

  const utils = trpc.useUtils();
  const { mutate: claimProfile, isPending: isClaimingProfile } =
    trpc.social.claimProfile.useMutation({
      onSuccess: async () => {
        await utils.users.getSpiritFrog.invalidate({ profileId });
        toast.success("Ribbit! You've claimed this frog profile! 🐸");
      },
      onError: (error) => {
        toast.error(`Ribbit! ${error.message}`);
      },
    });

  return (
    <div className="space-y-2">
      <FrogProfile frog={unclaimedFrog} status="unclaimed" />

      {claimable ? (
        <>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
            <div className="flex items-center mb-2">
              <AlertTriangle className="text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-yellow-700">Ribbit!</h3>
            </div>
            <p className="text-yellow-700">
              This frog profile is unclaimed and waiting for its rightful frog!
              Once you&apos;ve made this yours, there&apos;s no hopping to
              another! Keep your frog necklace safe and sound, or you might find
              yourself up the creek without a paddle!
            </p>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              disabled={isClaimingProfile}
              onClick={() => {
                claimProfile({ profileId });
              }}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-full transition duration-300"
            >
              Claim This Froggy Profile
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

function OtherProfile() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const profileId = useMemo(() => {
    if (!id) return undefined;
    const socialId = decodeURIComponent(id);
    if (!uuidValidate(socialId)) return undefined;
    return socialId;
  }, [id]);
  const semaphoreIdBase64 = useSemaphoreIdBase64();
  const { data: userState, isPending: isLoadingUserState } = useUserState();

  const {
    data: userData,
    error: userDataError,
    isLoading: isLoadingUserData,
  } = trpc.users.getSpiritFrog.useQuery(
    {
      profileId: profileId ?? "",
    },
    {
      enabled: Boolean(profileId),
      retry(_failureCount, error) {
        if (error.data?.code === "NOT_FOUND") {
          return false;
        }
        return true;
      },
    }
  );
  useEffect(() => {
    if (
      (userDataError && userDataError.data?.code !== "NOT_FOUND") ??
      !profileId
    ) {
      toast.error("Ribbit! This frog seems to have hopped away. 🐸");
      setLocation("/");
    }
  }, [setLocation, userDataError, profileId]);

  if (isLoadingUserData || isLoadingUserState || !profileId) return <Loader />;

  if (!userData)
    return (
      <UnclaimedProfile
        profileId={profileId}
        claimable={!userState?.myScore.socialId}
      />
    );

  if (userData.semaphoreIdBase64 === semaphoreIdBase64) {
    return <MyProfile />;
  }

  return <ClaimedProfile {...userData} profileId={profileId} />;
}

export default OtherProfile;
