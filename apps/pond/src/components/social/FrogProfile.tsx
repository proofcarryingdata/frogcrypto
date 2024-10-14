import { stat } from "node:fs";
import {
  type IFrogData,
  type ProfileFrogPOD,
  shortCommitment,
} from "@frogcrypto/shared";
import { QrCode } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";
import { FrogAttributes, FrogSocialAttributes } from "../shared/FrogCard";
import { isProfileFrogPOD } from "../../hooks/useFrogs";

const DESCRIPTION_MAX_LENGTH = 100;

function FrogDescription({ frog }: { frog: IFrogData }) {
  const [expanded, setExpanded] = useState(false);
  const isDescriptionLong = frog.description.length > DESCRIPTION_MAX_LENGTH;

  return (
    <p className="text-sm text-gray-700 text-left">
      {expanded || !isDescriptionLong
        ? frog.description
        : `${frog.description.slice(0, DESCRIPTION_MAX_LENGTH)}...`}
      {isDescriptionLong ? (
        <button
          type="button"
          onClick={() => {
            setExpanded(!expanded);
          }}
          className="text-green-600 hover:text-green-700 transition-colors pl-1"
        >
          {expanded ? "See less" : "See more"}
        </button>
      ) : null}
    </p>
  );
}

function FrogProfile({
  frog,
  profileId,
  status,
  friendCount,
  frogCount,
  onAddFriend,
  onEditProfile,
}: {
  frog: IFrogData | ProfileFrogPOD;
  status: "none" | "pending" | "friends" | "unclaimed" | "mine";
  profileId?: string;
  friendCount?: number;
  frogCount?: number;
  onAddFriend?: () => void;
  onEditProfile?: () => void;
}) {
  const renderFriendButton = () => {
    switch (status) {
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
      case "mine":
        return (
          <button
            type="button"
            onClick={onEditProfile}
            className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors"
          >
            Edit Profile
          </button>
        );
      case "unclaimed":
        return null;
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
        {status === "mine" ? (
          <Link href="/share" className="absolute inset-0">
            <div className="bg-white bottom-0 right-0 absolute">
              <QrCode />
            </div>
          </Link>
        ) : null}
      </div>

      <div className="text-center px-6 py-4 flex flex-col gap-2">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {profileId
            ? `0x${shortCommitment(profileId)}'s ${frog.name}`
            : frog.name}
        </h2>

        {isProfileFrogPOD(frog) ? <FrogSocialAttributes frog={frog} /> : null}

        <div className="flex justify-center space-x-4 mb-4 text-sm [&_button]:px-2 [&_button]:py-1 [&_button]:rounded-lg">
          {renderFriendButton()}

          {status === "mine" && friendCount && friendCount > 0 ? (
            <Link href="/friends">
              <button type="button" className="border text-gray-500">
                {friendCount} Friends
              </button>
            </Link>
          ) : (
            <button type="button" disabled className="border text-gray-500">
              {friendCount ?? "???"} Friends
            </button>
          )}
          <Link href="/scores">
            <button type="button" className="border text-gray-500">
              {frogCount ?? "???"} 🐸
            </button>
          </Link>
        </div>

        {isProfileFrogPOD(frog) ? <FrogAttributes frog={frog} /> : null}
        <FrogDescription frog={frog} />
      </div>
    </>
  );
}

export default FrogProfile;
