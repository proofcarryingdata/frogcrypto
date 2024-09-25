import React from "react";
import { trpc } from "../../trpc";
import { ActionButton } from "../shared/Button";
import { POD } from "@pcd/pod";
import { useUserState } from "../../hooks/useUserState";

export function PendingRequests() {
  const { data: pendingRequests, isLoading } =
    trpc.social.getPendingRequests.useQuery();
  const { data: userState } = useUserState();

  const utils = trpc.useUtils();
  const respondToRequest = trpc.social.respondToRequest.useMutation({
    onSuccess: () => {
      utils.social.getPendingRequests.invalidate();
    },
  });

  const handleRespond = (requestId: number, accept: boolean) => {
    if (!userState?.spiritFrog) return;

    const responsePOD = accept
      ? POD.sign(
          {
            podType: "frogcrypto.socialResponse",
            responderSemaphoreId: userState.semaphoreId,
            spiritFrog: userState.spiritFrog,
            timestamp: Date.now(),
          },
          userState.privateKey
        )
      : undefined;

    respondToRequest.mutate({ requestId, accept, responsePOD });
  };

  if (isLoading) return <div>Loading pending requests...</div>;
  if (!pendingRequests || pendingRequests.length === 0)
    return <div>No pending requests</div>;

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xl font-bold">Pending Requests</h3>
      {pendingRequests.map((request) => (
        <div key={request.id} className="border p-4 rounded">
          <p>From: {request.senderSemaphoreId}</p>
          <div className="flex justify-end gap-2 mt-2">
            <ActionButton onClick={() => handleRespond(request.id, false)}>
              Decline
            </ActionButton>
            <ActionButton onClick={() => handleRespond(request.id, true)}>
              Accept
            </ActionButton>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PendingRequests;
