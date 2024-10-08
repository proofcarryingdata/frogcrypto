import React from "react";
import { Link } from "wouter";
import {
  type IFrogData,
  type ProfileFrogPOD,
  shortCommitment,
} from "@frogcrypto/shared";
import { isProfileFrogPOD } from "../../hooks/useFrogs";

interface FrogProfileCompactProps {
  frog: IFrogData | ProfileFrogPOD;
  profileId: string;
  children?: React.ReactNode;
}

function FrogProfileCompact({
  frog,
  profileId,
  children,
}: FrogProfileCompactProps) {
  return (
    <Link href={`~/social/${encodeURIComponent(profileId)}`}>
      <div className="flex items-center p-2 hover:bg-gray-100 transition-colors cursor-pointer">
        <img
          src={frog.imageUrl}
          alt={frog.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div className="flex-grow">
          <h3 className="text-sm font-semibold text-gray-800">
            {`0x${shortCommitment(profileId)}'s ${frog.name}`}
          </h3>
          {isProfileFrogPOD(frog) && (
            <p className="text-xs text-gray-600">
              {frog.telegramUsername ? `@${frog.telegramUsername}` : ""}
            </p>
          )}
        </div>
        <div className="ml-2">{children}</div>
      </div>
    </Link>
  );
}

export default FrogProfileCompact;
