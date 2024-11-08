import { shortCommitmentHex, type ProfileFrogPOD } from "@frogcrypto/shared";
import React from "react";
import { trpc } from "../../trpc";
import Frog from "../shared/Frog";
import { SocialButton } from "../shared/Button";
import FrogImg from "../shared/FrogImg";
import SocialContainer from "./SocialContainer";

function FrogFriendProfile({
  frog,
  onClose,
}: {
  frog: ProfileFrogPOD;
  onClose?: () => void;
}) {
  const { data: userData } = trpc.users.getUser.useQuery({
    type: "semaphoreIdBase64",
    id: frog.profileId,
  });

  return (
    <SocialContainer title={`${frog.profileName} the ${frog.name}`}>
      <div className="w-32 h-32 mx-auto">
        <FrogImg frog={frog} className="w-full h-full object-cover" />
      </div>

      <div className="flex flex-col w-full items-center">
        <span className="font-semibold">{frog.profileName}</span>
        {userData ? (
          <Frog score={userData.frogCount} className="text-sm" />
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-1">
          <span className="font-semibold">Public Key</span>
          <span>{shortCommitmentHex(frog.profileId)}</span>

          <span className="font-semibold">Telegram</span>
          <span>{frog.telegramUsername || "<not set>"}</span>

          <span className="font-semibold">Farcaster</span>
          <span>{frog.farcasterUsername || "<not set>"}</span>
        </div>
      </div>

      {onClose ? (
        <SocialButton className="self-end" onClick={onClose}>
          Back
        </SocialButton>
      ) : null}
    </SocialContainer>
  );
}

export default FrogFriendProfile;
