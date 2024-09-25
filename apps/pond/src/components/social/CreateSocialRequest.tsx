import { signProfileFrogData } from "@frogcrypto/shared";
import React from "react";
import { toast } from "react-hot-toast";
import { useMyProfilePOD } from "../../hooks/useProfilePOD";
import { useUserIdentity, useUserState } from "../../hooks/useUserState";
import { useZupassAPI } from "../../hooks/useZapp";
import { trpc } from "../../trpc";
import { Button } from "../shared/Button";

export function CreateSocialRequest({
  otherPartyId,
}: {
  otherPartyId: string;
}) {
  const userIdentity = useUserIdentity();
  const { data: profilePOD } = useMyProfilePOD();

  const utils = trpc.useUtils();
  const createSocialRequest =
    trpc.social.createOrUpdateSocialRequest.useMutation({
      onSuccess: (data) => {
        void utils.social.getPendingRequests.invalidate();
        if (data.status === "accepted_existing") {
          toast.success("Request accepted! You've made a new connection!");
        } else {
          toast.success("Social request sent successfully!");
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdentity) {
      throw new Error("User identity not found");
    }
    if (!profilePOD) {
      // FIXME: we need to bring user to frog minter first
      throw new Error("Profile not found");
    }

    const requestPOD = signProfileFrogData(
      {
        ...profilePOD,
        ownerSemaphoreId: otherPartyId,
      },
      userIdentity.privateKey
    );

    createSocialRequest.mutate({
      otherPartyId,
      requestPOD,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          Create or Update Social Request
        </h3>
        <form onSubmit={handleSubmit}>
          <span>{otherPartyId}</span>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                throw new Error("Not implemented");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSocialRequest.isPending}>
              {createSocialRequest.isPending ? "Sending..." : "Send Request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSocialRequest;
