import {
  type IFrogData,
  shortCommitment,
  shortCommitmentHex,
} from "@frogcrypto/shared";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useSwipeable } from "react-swipeable";
import frogNecklaceSvg from "../../assets/frog_necklace.svg?url";
import frogNecklaceDisabledSvg from "../../assets/frog_necklace_disabled.svg?url";
import useSearchParams from "../../hooks/useSearchParams";
import useSendFrogRequest from "../../hooks/useSendFrogRequest";
import { useSemaphoreIdBase64, useUserState } from "../../hooks/useUserState";
import { trpc } from "../../trpc";
import { FrogEmoji } from "../Frog";
import { FrogCardHeader, RARITY_COLORS } from "../shared/FrogCard";
import FrogImg from "../shared/FrogImg";
import Modal from "../shared/Modal";

export const SEARCH_PARAM_NECKLACE_QR = "necklace_qr";

function ConnectedModal({ onClose }: { onClose: () => void }) {
  const [panel, setPanel] = useState(0);
  const semaphoreIdBase64 = useSemaphoreIdBase64();

  const onSwipeLeft = useCallback(() => {
    setPanel((prev) => Math.min(2, prev + 1));
  }, []);

  const onSwipeRight = useCallback(() => {
    setPanel((prev) => Math.max(0, prev - 1));
  }, []);

  const handlers = useSwipeable({
    onSwiped: (eventData) => {
      if (eventData.dir === "Left") {
        onSwipeLeft();
      } else if (eventData.dir === "Right") {
        onSwipeRight();
      }
    },
  });

  return (
    <Modal isOpen onClose={onClose} shouldCloseOnOverlayClick={false}>
      <div
        className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative"
        {...handlers}
      >
        <button
          type="button"
          className="absolute top-1 right-1 cursor-pointer text-gray-500"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-md font-bold text-center">
          FROG CONNECTION UNLOCKED
        </h2>

        {panel === 0 && (
          <>
            <div className="relative flex justify-center w-32 h-32 m-auto">
              <img src={frogNecklaceSvg} alt="Frog Necklace" />
              <Check className="absolute bottom-0 right-0 w-12 h-12 p-2 text-white bg-green-500 rounded-full" />
            </div>

            <span className="text-xs text-center">
              This Frog&apos;s QR code is now associated with your semaphore ID{" "}
              {shortCommitmentHex(semaphoreIdBase64 ?? "")}
            </span>
          </>
        )}
        {panel === 1 && (
          <>
            <div className="relative flex justify-center w-32 h-32 m-auto">
              <img src="/images/necklace_guide_1.png" alt="Scan Frog" />
            </div>

            <span className="text-xs text-center">
              Scan your friends&apos; frogs to send a FROG REQUEST
            </span>
          </>
        )}

        {panel === 2 && (
          <>
            <div className="relative flex justify-center w-32 h-32 m-auto">
              <img src="/images/necklace_guide_2.png" alt="Send Request" />
            </div>

            <span className="text-xs text-center">
              Earn <FrogEmoji /> by sending FROG REQUESTS
            </span>
          </>
        )}

        <div className="flex gap-4 justify-center">
          {Array.from({ length: 3 }).map((_, i) => (
            <button
              type="button"
              // eslint-disable-next-line react/no-array-index-key -- key is needed for the array
              key={i}
              className={`rounded-full border w-2 h-2 ${
                panel === i ? "bg-gray-400" : ""
              }`}
              onClick={() => {
                setPanel(i);
              }}
            />
          ))}
        </div>

        {panel > 0 && (
          <button
            type="button"
            className="absolute bottom-4 left-4"
            onClick={onSwipeRight}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {panel < 2 && (
          <button
            type="button"
            className="absolute bottom-4 right-4"
            onClick={onSwipeLeft}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </Modal>
  );
}

function UnactivatedModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen onClose={onClose}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative">
        <h2 className="text-md font-bold text-center">RIBBIT</h2>

        <div className="relative flex justify-center w-32 h-32 m-auto">
          <img src={frogNecklaceDisabledSvg} alt="Frog Necklace" />
        </div>

        <span className="text-xs text-center">
          You&apos;ve scanned an unactivated FROG NECKLACE.
        </span>

        <button
          type="button"
          className="text-xs m-auto bg-green-600 text-white px-4 py-1 rounded-sm"
          onClick={onClose}
        >
          Oh
        </button>
      </div>
    </Modal>
  );
}

function ActivationModal({
  onClose,
  socialId,
}: {
  onClose: () => void;
  socialId: string;
}) {
  const utils = trpc.useUtils();
  const { mutate: onActivate, isPending: isActivating } =
    trpc.social.claimProfile.useMutation({
      onSuccess: async () => {
        await utils.users.getUser.invalidate({
          id: socialId,
          type: "socialId",
        });
        await utils.users.me.invalidate();
      },
      onError: (error) => {
        toast.error(`Ribbit! ${error.message}`);
      },
    });

  return (
    <Modal isOpen onClose={onClose} shouldCloseOnOverlayClick={false}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative">
        <h2 className="text-md font-bold text-center">
          ACTIVATE THIS FROG NECKLACE?
        </h2>

        <div className="relative flex justify-center w-32 h-32 m-auto">
          <img src={frogNecklaceSvg} alt="Frog Necklace" />
        </div>

        <span className="text-xs text-center">
          This enables FROG CONNECTION with other players.
        </span>

        <div className="flex gap-8 px-8 w-full">
          <button
            type="button"
            className="text-xs bg-gray-200 text-gray-500 px-4 py-1 rounded-sm flex-1 disabled:opacity-50 disabled:cursor-wait"
            onClick={onClose}
            disabled={isActivating}
          >
            No
          </button>
          <button
            type="button"
            className="text-xs bg-green-500 text-white px-4 py-1 rounded-sm flex-1 disabled:opacity-50 disabled:cursor-wait"
            onClick={() => {
              onActivate({ socialId });
            }}
            disabled={isActivating}
          >
            Yes
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FrogRequestModal({
  onClose,
  frog,
  semaphoreIdBase64,
  profileName,
}: {
  onClose: () => void;
  frog: IFrogData;
  semaphoreIdBase64: string;
  profileName: string;
}) {
  const { mutateAsync: onSendFrogRequest, isPending: isSendingFrogRequest } =
    useSendFrogRequest();

  return (
    <Modal isOpen onClose={onClose} shouldCloseOnOverlayClick={false}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-4 relative">
        <h2 className="text-md font-bold text-center">FROG NECKLACE SCANNED</h2>

        <div className="flex flex-col gap-4 items-center bg-white bg-opacity-80">
          <FrogImg
            frog={frog}
            className={`rounded-lg shadow-frog ${RARITY_COLORS[frog.rarity].shadow || ""}`}
          />

          <FrogCardHeader
            rarity={frog.rarity}
            title={
              <span>
                {profileName} (+1 <FrogEmoji className="w-5 h-5 inline pb-1" />)
              </span>
            }
            subtitle={`0x${shortCommitment(semaphoreIdBase64)}'s ${frog.name}`}
          />

          <button
            type="button"
            className="w-48 text-sm bg-green-500 text-white px-4 py-2 rounded-sm flex-1 disabled:opacity-50 disabled:cursor-wait"
            onClick={() => {
              void onSendFrogRequest(semaphoreIdBase64).then(onClose);
            }}
            disabled={isSendingFrogRequest}
          >
            send frog request
          </button>

          <span className="text-xs text-center px-8 text-gray-500">
            For your safety, only send frog requests to verified and reputable
            sources.
          </span>

          <button
            type="button"
            className="w-48 text-sm bg-gray-200 text-gray-500 px-4 py-2 rounded-sm flex-1 disabled:opacity-50 disabled:cursor-wait"
            onClick={onClose}
            disabled={isSendingFrogRequest}
          >
            hop away
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FrogNecklace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const socialId = searchParams.get(SEARCH_PARAM_NECKLACE_QR);
  const onClose = () => {
    setSearchParams(
      (params) => {
        params.delete(SEARCH_PARAM_NECKLACE_QR);
        return params;
      },
      { replace: true }
    );
  };
  const { data: myState } = useUserState();
  const {
    data: userState,
    isPending: isLoadingUserState,
    error: userStateError,
  } = trpc.users.getUser.useQuery(
    {
      id: socialId ?? "",
      type: "socialId",
    },
    {
      enabled: Boolean(socialId),
      retry: (failureCount, error) => {
        if (error.data?.zodError ?? error.data?.httpStatus === 404) {
          return false;
        }

        return failureCount < 3;
      },
    }
  );

  if (
    !socialId ||
    !myState ||
    isLoadingUserState ||
    userStateError?.data?.zodError
  ) {
    return null;
  }

  const mySocialId = myState.myScore.socialId;

  if (userState) {
    if (mySocialId === userState.socialId) {
      return <ConnectedModal onClose={onClose} />;
    }

    return (
      <FrogRequestModal
        onClose={onClose}
        frog={userState.spiritFrog}
        semaphoreIdBase64={userState.semaphoreIdBase64}
        profileName={userState.profileName}
      />
    );
  }

  if (mySocialId) {
    return <UnactivatedModal onClose={onClose} />;
  }

  return <ActivationModal onClose={onClose} socialId={socialId} />;
}

export default FrogNecklace;
