import { getUsernameFromHash, shortCommitmentHex } from "@frogcrypto/shared";
import React, { useState } from "react";
import { useLocation } from "wouter";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { useUserState } from "../../hooks/useUserState";
import { SocialButton } from "../shared/Button";
import Loader from "../shared/Loader";
import Modal from "../shared/Modal";
import FrogImg from "../shared/FrogImg";
import SocialContainer from "./SocialContainer";

function MyProfile() {
  const [, setLocation] = useLocation();
  const myProfilePOD = useMyProfilePOD();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState(
    myProfilePOD?.telegramUsername ?? ""
  );
  const [farcasterUsername, setFarcasterUsername] = useState(
    myProfilePOD?.farcasterUsername ?? ""
  );
  const { data: userState, isLoading: isLoadingUserState } = useUserState();

  const { mutate: updateProfile, isPending } = useSetMyProfilePOD();

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
    setTelegramUsername(myProfilePOD?.telegramUsername ?? "");
    setFarcasterUsername(myProfilePOD?.farcasterUsername ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!myProfilePOD) {
      throw new Error("No profile POD found");
    }
    updateProfile({
      ...myProfilePOD,
      telegramUsername,
      farcasterUsername,
    });
    setIsEditModalOpen(false);
  };

  if (isLoadingUserState) return <Loader />;
  if (!myProfilePOD || !userState) {
    // FIXME: user needs to create a profile POD
    throw new Error("No profile POD found");
  }

  return (
    <div className="container flex flex-col gap-4">
      <SocialContainer title="Picture">
        <div className="relative w-32 h-32 mx-auto">
          <FrogImg frog={myProfilePOD} className="w-full h-full object-cover" />
        </div>
      </SocialContainer>

      <SocialContainer title="Information">
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1">
            <span className="font-semibold">Name</span>
            <span>
              {getUsernameFromHash(userState.myScore.semaphoreIdHash)}
            </span>

            <span className="font-semibold">Public Key</span>
            <span>{shortCommitmentHex(myProfilePOD.ownerSemaphoreId)}</span>

            <span className="font-semibold">Telegram</span>
            <span>{myProfilePOD.telegramUsername || "<not set>"}</span>

            <span className="font-semibold">Farcaster</span>
            <span>{myProfilePOD.farcasterUsername || "<not set>"}</span>
          </div>

          <div className="self-end flex gap-2">
            {userState.myScore.socialId ? (
              <SocialButton
                onClick={() => {
                  setLocation(`/share`);
                }}
              >
                Share
              </SocialButton>
            ) : null}
            <SocialButton onClick={handleEditProfile}>Edit</SocialButton>
          </div>
        </div>
      </SocialContainer>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
        }}
      >
        <SocialContainer title="Edit Profile">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="telegramHandle"
                className="block text-sm font-medium text-gray-700"
              >
                Telegram
              </label>
              <input
                type="text"
                id="telegramHandle"
                value={telegramUsername}
                onChange={(e) => {
                  setTelegramUsername(e.target.value);
                }}
                className="border border-green-600 border-opacity-50 block w-full focus:border-opacity-100 focus:outline-none focus:ring-green-600 focus:ring-opacity-50 focus:ring-1 p-1"
                maxLength={36}
              />
            </div>
            <div>
              <label
                htmlFor="farcasterHandle"
                className="block text-sm font-medium text-gray-700"
              >
                Farcaster
              </label>
              <input
                type="text"
                id="farcasterHandle"
                value={farcasterUsername}
                onChange={(e) => {
                  setFarcasterUsername(e.target.value);
                }}
                className="border border-green-600 border-opacity-50 block w-full focus:border-opacity-100 focus:outline-none focus:ring-green-600 focus:ring-opacity-50 focus:ring-1 p-1"
                maxLength={36}
              />
            </div>
            <div className="flex justify-between">
              <SocialButton
                onClick={() => {
                  setIsEditModalOpen(false);
                }}
              >
                Cancel
              </SocialButton>
              <SocialButton type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </SocialButton>
            </div>
          </form>
        </SocialContainer>
      </Modal>
    </div>
  );
}

export default MyProfile;
