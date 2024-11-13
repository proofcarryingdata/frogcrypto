import { toProfileFrogPODEntries } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { type JSONPOD, POD } from "@pcd/pod";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { toast } from "react-hot-toast";
import { FrogEmoji } from "../components/shared/Frog";
import { trpc } from "../trpc";
import { useManageFrogs } from "./useFrogs";
import { useParcnetClient } from "./useParcnetClient";
import { useMyProfilePOD } from "./useProfilePOD";

const useAcceptFrogRequest = () => {
  const profilePOD = useMyProfilePOD();
  const z = useParcnetClient();
  const frogs = useManageFrogs();

  const utils = trpc.useUtils();
  const createSocialRequest = trpc.social.acceptRequest.useMutation();

  const acceptRequest = useMutation({
    mutationFn: async (pendingRequest: {
      id: number;
      requestedBy: string;
      requestPOD: string | null;
    }) => {
      if (!profilePOD) {
        // FIXME: we need to bring user to frog minter first
        throw new Error("Profile not found");
      }

      if (!pendingRequest.requestPOD) {
        throw new Error("Request POD not found");
      }
      const pod = POD.fromJSON(
        JSON.parse(pendingRequest.requestPOD) as JSONPOD
      );
      const responsePOD = await z.pod.sign(
        toProfileFrogPODEntries({
          ...profilePOD,
          ownerSemaphoreId: pendingRequest.requestedBy,
          ownerEddsaPublicKey: pod.signerPublicKey,
        })
      );

      return createSocialRequest.mutateAsync({
        requestId: pendingRequest.id,
        responsePOD: POD.load(
          responsePOD.entries,
          responsePOD.signature,
          responsePOD.signerPublicKey
        ),
      });
    },
    onSuccess: async (data, variables) => {
      utils.social.getPendingRequests.setData(undefined, (reqs) =>
        reqs?.filter((request) => request.id !== variables.id)
      );

      if (!variables.requestPOD) {
        throw new Error("Request POD not found");
      }

      const podData = podToPODData(
        POD.fromJSON(JSON.parse(variables.requestPOD) as JSONPOD)
      );
      await frogs.insert(podData);

      await utils.users.me.refetch();

      const profileName = String(podData.entries.profileName?.value);
      if (data && profileName) {
        toast.success(
          () => (
            <span>
              Success! <b>{profileName}</b> is now your friend, and you now have
              +1 <FrogEmoji className="w-4 h-4 inline mb-1" />.
            </span>
          ),
          {
            duration: 5000,
          }
        );
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return acceptRequest;
};

export default useAcceptFrogRequest;
