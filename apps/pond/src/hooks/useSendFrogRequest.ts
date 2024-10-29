import { toProfileFrogPODEntries } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { trpc } from "../trpc";
import { useParcnetClient } from "./useParcnetClient";
import { useMyProfilePOD } from "./useProfilePOD";

const useSendFrogRequest = () => {
  const profilePOD = useMyProfilePOD();
  const z = useParcnetClient();

  const { mutateAsync: createSocialRequest } =
    trpc.social.createOrUpdateSocialRequest.useMutation({
      onSuccess: (data) => {
        if (data.status === "pending") {
          toast.success("Frog Request sent successfully!");
        }
        if (data.status === "connected") {
          toast.success(
            "You are already froggy friends! Your updated Froggy Profile has been sent to your friend.",
            { duration: 5000 }
          );
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  return useMutation({
    mutationFn: async (otherPartyId: string) => {
      if (!profilePOD) {
        // FIXME: we need to bring user to frog minter first
        throw new Error("Profile not found");
      }

      const requestPODData = await z.pod.sign(
        toProfileFrogPODEntries({
          ...profilePOD,
          ownerSemaphoreId: otherPartyId,
        })
      );

      return createSocialRequest({
        requestPOD: POD.load(
          requestPODData.entries,
          requestPODData.signature,
          requestPODData.signerPublicKey
        ),
      });
    },
  });
};

export default useSendFrogRequest;
