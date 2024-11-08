import React from "react";
import { type ProfileFrogPOD, shortCommitment } from "@frogcrypto/shared";
import { isProfileFrogPOD } from "../../hooks/useFrogs";
import { trpc } from "../../trpc";
import Frog from "../shared/Frog";
import FrogImg from "../shared/FrogImg";

interface FrogProfileBoxProps {
  frog: ProfileFrogPOD;
  semaphoreIdBase64: string;
  onFocusFrog: (frog: ProfileFrogPOD) => void;
}

function FrogProfileBox({
  frog,
  semaphoreIdBase64,
  onFocusFrog,
}: FrogProfileBoxProps) {
  const { data: userData } = trpc.users.getUser.useQuery({
    id: semaphoreIdBase64,
    type: "semaphoreIdBase64",
  });

  return (
    <div
      tabIndex={0}
      role="button"
      className="flex flex-col items-center cursor-pointer"
      onClick={() => {
        onFocusFrog(frog);
      }}
    >
      <FrogImg frog={frog} className="w-16 h-16 object-cover mb-1" />

      <h3 className="text-sm font-semibold text-green-700">
        {frog.profileName}
      </h3>

      {userData ? (
        <Frog score={userData.frogCount} className="text-sm" />
      ) : null}
    </div>
  );
}

export default FrogProfileBox;
