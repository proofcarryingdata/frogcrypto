import React, { useEffect, useState } from "react";
import { useMyProfilePOD, useSetMyProfilePOD } from "../../hooks/useProfilePOD";
import { Button } from "../shared/Button";
import FrogCard from "../shared/FrogCard";
import Loader from "../shared/Loader";

export function ProfileEditor() {
  const { data: myProfilePOD, isLoading } = useMyProfilePOD();
  const [telegramUsername, setTelegramUsername] = useState(
    myProfilePOD?.telegramUsername ?? ""
  );
  const [farcasterUsername, setFarcasterUsername] = useState(
    myProfilePOD?.farcasterUsername ?? ""
  );
  useEffect(() => {
    setTelegramUsername(myProfilePOD?.telegramUsername ?? "");
    setFarcasterUsername(myProfilePOD?.farcasterUsername ?? "");
  }, [myProfilePOD]);

  const { mutate: updateProfile, isPending } = useSetMyProfilePOD();

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
  };

  if (isLoading) return <Loader />;
  if (!myProfilePOD) {
    // FIXME: user need to create a profile POD
    throw new Error("No profile POD found");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex-shrink-0">
        <FrogCard frog={myProfilePOD} />
      </div>
      <form onSubmit={handleSubmit} className="flex-grow">
        <h3 className="text-xl font-bold mb-4">Edit Your Profile</h3>
        <div className="mb-4">
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
        <div className="mb-4">
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
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </div>
  );
}

export default ProfileEditor;
