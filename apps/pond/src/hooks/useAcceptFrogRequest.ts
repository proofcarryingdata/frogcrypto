import { toast } from "react-hot-toast";
import { POD } from "@pcd/pod";
import {
  FROGCRYPTO_FOLDER_NAME,
  toProfileFrogPODEntries,
} from "@frogcrypto/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { podToPODData } from "@parcnet-js/podspec";
import { trpc } from "../trpc";
import { useMyProfilePOD } from "./useProfilePOD";
import { useParcnetClient } from "./useParcnetClient";
import { QUERY_KEY_FROGS } from "./useFrogs";

const useAcceptFrogRequest = () => {
  const { data: profilePOD } = useMyProfilePOD();
  const z = useParcnetClient();
  const queryClient = useQueryClient();

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
      void utils.social.getPendingRequests.invalidate();
      void utils.users.me.invalidate();

      if (data.success) {
        toast.success("Request accepted! You've made a new connection!");
      }

      if (!variables.requestPOD) {
        throw new Error("Request POD not found");
      }

      await z.pod
        .collection(FROGCRYPTO_FOLDER_NAME)
        .insert(podToPODData(POD.deserialize(variables.requestPOD)));
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY_FROGS],
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return acceptRequest;
};

export default useAcceptFrogRequest;
