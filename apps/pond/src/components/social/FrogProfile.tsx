import { type ProfileFrogPOD, shortCommitment } from "@frogcrypto/shared";
import { QrCode } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";
import { type IFrogData } from "@pcd/eddsa-frog-pcd";
import { FrogAttributes, FrogSocialAttributes } from "../shared/FrogCard";
import { isProfileFrogPOD } from "../../hooks/useFrogs";

function FrogDescription({ frog }: { frog: IFrogData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <p className="text-sm text-gray-700 text-left">
      {expanded ? frog.description : `${frog.description.slice(0, 100)}...`}
      <button
        type="button"
        onClick={() => {
          setExpanded(!expanded);
        }}
        className="text-green-600 hover:text-green-700 transition-colors pl-1"
      >
        {expanded ? "See less" : "See more"}
      </button>
    </p>
  );
}

function FrogProfile({
  frog,
  profileId,
  isMyProfile,
  friendStatus = "none",
  friendCount,
  frogCount,
  onAddFriend,
  onEditProfile,
}: {
  frog: IFrogData | ProfileFrogPOD;
  profileId: string;
  isMyProfile: boolean;
  friendStatus?: "none" | "pending" | "friends";
  friendCount: number;
  frogCount: number;
  onAddFriend?: () => void;
  onEditProfile?: () => void;
}) {
  const renderFriendButton = () => {
    if (isMyProfile) {
      return (
        <button
          type="button"
          onClick={onEditProfile}
          className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors"
        >
          Edit Profile
        </button>
      );
    }

    switch (friendStatus) {
      case "none":
        return (
          <button
            type="button"
            onClick={onAddFriend}
            className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
          >
            Add Friend
          </button>
        );
      case "pending":
        if (onAddFriend === undefined) {
          return (
            <button
              type="button"
              disabled
              className="bg-yellow-500 text-white px-4 py-2 rounded-full cursor-not-allowed"
            >
              Pending
            </button>
          );
        }
        return (
          <button
            type="button"
            onClick={onAddFriend}
            className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition-colors"
          >
            Accept
          </button>
        );
      case "friends":
        return (
          <button
            type="button"
            disabled
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full cursor-not-allowed"
          >
            ✓ Friends
          </button>
        );
    }
  };

  return (
    <>
      <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 rounded-full overflow-hidden border shadow-lg">
          <img
            src={frog.imageUrl}
            alt={frog.name}
            className="w-full h-full object-cover"
          />
        </div>
        {isMyProfile ? (
          <Link href="/share" className="absolute inset-0">
            <div className="bg-white bottom-0 right-0 absolute">
              <QrCode />
            </div>
          </Link>
        ) : null}
      </div>

      <div className="text-center px-6 py-4 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {`0x${shortCommitment(profileId)}'s ${frog.name}`}
        </h2>

        {isProfileFrogPOD(frog) ? <FrogSocialAttributes frog={frog} /> : null}

        <div className="flex justify-center space-x-4 mb-4 text-sm [&_button]:px-2 [&_button]:py-1 [&_button]:rounded-lg">
          {renderFriendButton()}
          <button type="button" className="border text-gray-500">
            {friendCount} Friends
          </button>
          <button type="button" className="border text-gray-500">
            {frogCount} 🐸
          </button>
        </div>

        {isProfileFrogPOD(frog) ? <FrogAttributes frog={frog} /> : null}
        <FrogDescription frog={frog} />
      </div>
    </>
  );
}

export default FrogProfile;
