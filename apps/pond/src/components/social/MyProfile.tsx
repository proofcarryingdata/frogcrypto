import React, { useState } from "react";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { Button } from "../shared/Button";
import Loader from "../shared/Loader";
import Modal from "../shared/Modal";
import { useUserState } from "../../hooks/useUserState";
import FrogProfile from "./FrogProfile";

function MyProfile() {
  const { data: myProfilePOD, isLoading: isLoadingProfilePOD } =
    useMyProfilePOD();
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

  const isLoading = isLoadingProfilePOD || isLoadingUserState;
  if (isLoading) return <Loader />;
  if (!myProfilePOD || !userState) {
    // FIXME: user needs to create a profile POD
    throw new Error("No profile POD found");
  }

  return (
    <div className="container mx-auto px-4">
      <FrogProfile
        frog={myProfilePOD}
        profileId={myProfilePOD.profileId}
        status="mine"
        friendCount={userState.myScore.friendCount}
        frogCount={userState.myScore.score}
        onEditProfile={handleEditProfile}
      />

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="text-xl font-bold mb-4">Edit Your Profile</h3>
          <div>
            <label
              htmlFor="telegramUsername"
              className="block text-sm font-medium text-gray-700"
            >
              Telegram Username
            </label>
            <input
              type="text"
              id="telegramUsername"
              value={telegramUsername}
              onChange={(e) => {
                setTelegramUsername(e.target.value);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div>
            <label
              htmlFor="farcasterUsername"
              className="block text-sm font-medium text-gray-700"
            >
              Farcaster Username
            </label>
            <input
              type="text"
              id="farcasterUsername"
              value={farcasterUsername}
              onChange={(e) => {
                setFarcasterUsername(e.target.value);
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
              }}
              className="bg-gray-200 text-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default MyProfile;
