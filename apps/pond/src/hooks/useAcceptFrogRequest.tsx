import { toast } from "react-hot-toast";
import { type JSONPOD, POD } from "@pcd/pod";
import {
  FROGCRYPTO_FOLDER_NAME,
  toProfileFrogPODEntries,
} from "@frogcrypto/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { podToPODData } from "@parcnet-js/podspec";
import React from "react";
import { trpc } from "../trpc";
import { FrogEmoji } from "../components/Frog";
import { useMyProfilePOD } from "./useProfilePOD";
import { useParcnetClient } from "./useParcnetClient";

const useAcceptFrogRequest = () => {
  const profilePOD = useMyProfilePOD();
  const z = useParcnetClient();

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

      const responsePOD = await z.pod.sign(
        toProfileFrogPODEntries({
          ...profilePOD,
          ownerSemaphoreId: pendingRequest.requestedBy,
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
      void utils.users.me.invalidate();

      utils.social.getPendingRequests.setData(undefined, (data) =>
        data?.filter((request) => request.id !== variables.id)
      );

      if (data.success) {
        toast.success(() => (
          <div className="flex">
            Success! {variables.requestedBy} is now your friend, and you now
            have +1
            <FrogEmoji />.
          </div>
        ));
      }

      if (!variables.requestPOD) {
        throw new Error("Request POD not found");
      }

      await z.pod
        .collection(FROGCRYPTO_FOLDER_NAME)
        .insert(
          podToPODData(
            POD.fromJSON(JSON.parse(variables.requestPOD) as JSONPOD)
          )
        );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return acceptRequest;
};

export default useAcceptFrogRequest;
