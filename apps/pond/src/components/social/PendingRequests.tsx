import { parseProfileFrogPOD } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import React from "react";
import useAcceptFrogRequest from "../../hooks/useAcceptFrogRequest";
import { trpc } from "../../trpc";
import Loader from "../shared/Loader";
import { useSemaphoreIdBase64 } from "../../hooks/useUserState";
import FrogProfileRow from "./FrogProfileRow";

export function PendingRequests() {
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
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Invitations</h2>
      {pendingRequests.map((request) => (
        <FrogProfileRow
          key={request.id}
          frog={parseProfileFrogPOD(POD.deserialize(request.requestPOD ?? ""))}
          profileId={request.requestedBy}
        >
          <button
            type="button"
            className="bg-green-500 text-white px-2 py-1 text-sm rounded-full hover:bg-green-600 disabled:opacity-50 disabled:cursor-wait transition-colors"
            disabled={isRespondingToRequest}
            onClick={(e) => {
              e.preventDefault();

              respondToRequest(request);
            }}
          >
            Accept
          </button>
        </FrogProfileRow>
      ))}
    </div>
  );
}

export default PendingRequests;
