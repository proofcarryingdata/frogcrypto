import { parseProfileFrogPOD, type ProfileFrogPOD } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import React from "react";
import { podToPODData } from "@parcnet-js/podspec";
import useAcceptFrogRequest from "../../hooks/useAcceptFrogRequest";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";
import { useSemaphoreIdBase64 } from "../../hooks/useUserState";
import { SocialButton } from "../shared/Button";
import FrogProfileRow from "./FrogProfileRow";
import SocialContainer from "./SocialContainer";

export function PendingRequests({
  onFocusFrog,
}: {
  onFocusFrog: (frog: ProfileFrogPOD) => void;
}) {
  const semaphoreId = useSemaphoreIdBase64();
  const { data: pendingRequests, isLoading } =
    trpc.social.getPendingRequests.useQuery(undefined, {
      select: (data) =>
        data.filter((request) => request.requestedBy !== semaphoreId),
    });

  const { mutate: respondToRequest, isPending: isRespondingToRequest } =
    useAcceptFrogRequest();

  if (isLoading) return <Loader />;
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <SocialContainer title="Invitations">
      {pendingRequests.map((request) => (
        <FrogProfileRow
          key={request.id}
          frog={parseProfileFrogPOD(
            podToPODData(POD.deserialize(request.requestPOD ?? ""))
          )}
          profileId={request.requestedBy}
          onFocusFrog={onFocusFrog}
        >
          <SocialButton
            type="button"
            disabled={isRespondingToRequest}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              respondToRequest(request);
            }}
          >
            Accept
          </SocialButton>
        </FrogProfileRow>
      ))}
    </SocialContainer>
  );
}

export default PendingRequests;
