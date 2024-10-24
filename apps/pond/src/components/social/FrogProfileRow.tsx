import React from "react";
import { type ProfileFrogPOD, shortCommitment } from "@frogcrypto/shared";
import { isProfileFrogPOD } from "../../hooks/useFrogs";
import FrogImg from "../shared/FrogImg";

interface FrogProfileCompactProps {
  frog: ProfileFrogPOD;
  profileId: string;
  onFocusFrog: (frog: ProfileFrogPOD) => void;
  children?: React.ReactNode;
}

function FrogProfileRow({
  frog,
  profileId,
  children,
  onFocusFrog,
}: FrogProfileCompactProps) {
  return (
    <div
      tabIndex={0}
      role="button"
      className="flex items-center hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={() => {
        onFocusFrog(frog);
      }}
    >
      <FrogImg frog={frog} className="w-12 h-12 object-cover mr-4" />
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
  );
}

export default FrogProfileRow;
