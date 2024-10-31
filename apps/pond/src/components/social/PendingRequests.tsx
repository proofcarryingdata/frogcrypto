import { parseProfileFrogPOD, shortCommitment } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { type JSONPOD, POD } from "@pcd/pod";
import React, { useEffect } from "react";
import { type RouterOutputs } from "@frogcrypto/api/src/routers";
import { Siren } from "lucide-react";
import useAcceptFrogRequest from "../../hooks/useAcceptFrogRequest";
import { trpc } from "../../trpc";
import { FrogEmoji } from "../shared/Frog";
import { FrogCardHeader, RARITY_COLORS } from "../shared/FrogCard";
import FrogImg from "../shared/FrogImg";
import Modal from "../shared/Modal";
import EnsureProfilePOD from "./EnsureProfilePOD";

function PendingRequest({
  request,
}: {
  request: RouterOutputs["social"]["getPendingRequests"][number];
}) {
  const utils = trpc.useUtils();
  const { mutate: respondToRequest, isPending: isRespondingToRequest } =
    useAcceptFrogRequest();
  const { mutate: declineRequest, isPending: isDecliningRequest } =
    trpc.social.declineRequest.useMutation({
      onSuccess: (_, { requestId }) => {
        utils.social.getPendingRequests.setData(undefined, (data) =>
          data?.filter((req) => req.id !== requestId)
        );
      },
    });

  const frog = request.requestPOD
    ? parseProfileFrogPOD(
        podToPODData(POD.fromJSON(JSON.parse(request.requestPOD) as JSONPOD))
      )
    : undefined;

  useEffect(() => {
    if (!frog && !isDecliningRequest) {
      declineRequest({ requestId: request.id });
    }
  }, [request, isDecliningRequest, frog, declineRequest]);

  if (!frog) return null;

  return (
    <Modal
      isOpen
      onClose={() => {
        declineRequest({ requestId: request.id });
      }}
      shouldCloseOnOverlayClick={false}
    >
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative">
        <h2 className="text-lg font-bold text-center">
          <Siren className="w-6 h-6 inline pb-1 mr-1 text-green-500" />
          <span className="italic">NEW</span> FROG REQUEST
          <Siren className="w-6 h-6 inline pb-1 ml-1 text-green-500" />
        </h2>

        <div className="flex flex-col gap-4 items-center bg-white bg-opacity-80">
          <FrogImg
            frog={frog}
            className={`rounded-lg shadow-frog ${RARITY_COLORS[frog.rarity].shadow || ""}`}
          />

          <FrogCardHeader
            rarity={frog.rarity}
            title={frog.profileName}
            subtitle={`0x${shortCommitment(frog.profileId)}'s ${frog.name}`}
          />

          <button
            type="button"
            className="w-48 text-sm bg-green-500 text-white px-4 py-2 rounded-sm flex-1 disabled:opacity-50 disabled:cursor-wait"
            onClick={() => {
              respondToRequest(request);
            }}
            disabled={isRespondingToRequest || isDecliningRequest}
          >
            Accept (+1 <FrogEmoji className="w-5 h-5 inline pb-1" />)
          </button>

          <span className="text-xs text-center px-8 text-gray-500">
            For your safety, only accept frog requests from verified and
            reputable sources.
          </span>

          <button
            type="button"
            className="w-48 text-sm bg-gray-200 text-gray-500 px-4 py-2 rounded-sm flex-1 disabled:opacity-50 disabled:cursor-wait"
            onClick={() => {
              declineRequest({ requestId: request.id });
            }}
            disabled={isRespondingToRequest || isDecliningRequest}
          >
            Decline
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function PendingRequests() {
  const { data: requests } = trpc.social.getPendingRequests.useQuery();

  return (
    <>
      {Boolean(requests?.length) && <EnsureProfilePOD />}
      {requests?.map((request) => (
        <PendingRequest key={request.id} request={request} />
      ))}
    </>
  );
}

export default PendingRequests;
