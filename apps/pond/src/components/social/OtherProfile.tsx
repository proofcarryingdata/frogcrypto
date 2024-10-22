import {
  Biome,
  decompressBigInt,
  type IFrogData,
  Rarity,
  Temperament,
} from "@frogcrypto/shared";
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
  semaphoreIdBase64,
}: {
  spiritFrog: IFrogData;
  friendCount: number;
  frogCount: number;
  semaphoreIdBase64: string;
}) {
  const { data: myProfilePOD, isLoading: isLoadingMyProfilePOD } =
    useMyProfilePOD();

  const { data: frogs, isLoading: isLoadingFrogs } = useProfileFrogs();

  const knownFrog = useMemo(() => {
    return frogs?.find((frog) => frog.profileId === semaphoreIdBase64);
  }, [frogs, semaphoreIdBase64]);

  const { data: pendingRequests } = trpc.social.getPendingRequests.useQuery();
  const pendingRequest = useMemo(() => {
    if (!pendingRequests) return undefined;
    return pendingRequests.find(
      (request) =>
        request.party1 === semaphoreIdBase64 ||
        request.party2 === semaphoreIdBase64
    );
  }, [semaphoreIdBase64, pendingRequests]);

  const status = useMemo(() => {
    if (knownFrog)
      return knownFrog.profileId === myProfilePOD?.profileId
        ? "mine"
        : "friends";
    if (pendingRequest) return "pending";
    return "none";
  }, [knownFrog, pendingRequest, myProfilePOD?.profileId]);

  const { mutate: sendFrogRequest } = useSendFrogRequest();
  const { mutate: acceptRequest } = useAcceptFrogRequest();
  const onClick = useMemo(() => {
    if (pendingRequest) {
      if (pendingRequest.requestedBy === semaphoreIdBase64) {
        return () => {
          acceptRequest(pendingRequest);
        };
      }
    } else if (semaphoreIdBase64) {
      return () => {
        sendFrogRequest(semaphoreIdBase64);
      };
    }
    return undefined;
  }, [pendingRequest, semaphoreIdBase64, acceptRequest, sendFrogRequest]);

  if (isLoadingFrogs || isLoadingMyProfilePOD) return <Loader />;

  return (
    <FrogProfile
      frog={knownFrog ?? spiritFrog}
      semaphoreIdBase64={semaphoreIdBase64}
      status={status}
      friendCount={friendCount}
      frogCount={frogCount}
      onAddFriend={onClick}
    />
  );
}

function UnclaimedProfile({
  socialId,
  claimable,
}: {
  socialId: string;
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
        await utils.users.getUser.invalidate({
          id: socialId,
          type: "socialId",
        });
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
                claimProfile({ socialId });
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
  const parsedId = useMemo<
    | { id: string; type: "socialId" }
    | { id: string; type: "semaphoreIdBase64" }
    | undefined
  >(() => {
    if (!id) return undefined;
    const decodedId = decodeURIComponent(id);
    if (uuidValidate(decodedId))
      return {
        id: decodedId,
        type: "socialId",
      };
    try {
      decompressBigInt(decodedId);
      return {
        id: decodedId,
        type: "semaphoreIdBase64",
      };
    } catch {
      return undefined;
    }
  }, [id]);
  const semaphoreIdBase64 = useSemaphoreIdBase64();
  const { data: userState, isPending: isLoadingUserState } = useUserState();

  const {
    data: userData,
    error: userDataError,
    isLoading: isLoadingUserData,
  } = trpc.users.getUser.useQuery(parsedId ?? { id: "", type: "socialId" }, {
    enabled: Boolean(parsedId),
    retry(_failureCount, error) {
      if (error.data?.code === "NOT_FOUND") {
        return false;
      }
      return true;
    },
  });
  useEffect(() => {
    if (
      (userDataError && userDataError.data?.code !== "NOT_FOUND") ??
      !parsedId
    ) {
      toast.error("Ribbit! This frog seems to have hopped away. 🐸");
      setLocation("/");
    }
  }, [setLocation, userDataError, parsedId]);

  if (isLoadingUserData || isLoadingUserState || !parsedId) return <Loader />;

  if (!userData)
    return (
      <UnclaimedProfile
        socialId={parsedId.id}
        claimable={!userState?.myScore.socialId && parsedId.type === "socialId"}
      />
    );

  if (userData.semaphoreIdBase64 === semaphoreIdBase64) {
    return <MyProfile />;
  }

  return <ClaimedProfile {...userData} />;
}

export default OtherProfile;
