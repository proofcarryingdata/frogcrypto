import { parseFrogPOD } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useManageFrogs } from "../hooks/useFrogs";
import useSearchParams from "../hooks/useSearchParams";
import { useUserState } from "../hooks/useUserState";
import { trpc } from "../trpc";

const SEARCH_PARAM_CYBERFROG_SIGNATURE = "cfsig";
const SEARCH_PARAM_CYBERFROG_NONCE = "cfnonce";

function CyberFrog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const signature = searchParams.get(SEARCH_PARAM_CYBERFROG_SIGNATURE);
  const rawNonce = searchParams.get(SEARCH_PARAM_CYBERFROG_NONCE);
  const { data: user, isPending: isLoadingUser } = useUserState();
  const hasScore = user?.myScore.score && user.myScore.score > 0;

  const resetUrl = useCallback(() => {
    setSearchParams(
      (params) => {
        params.delete(SEARCH_PARAM_CYBERFROG_SIGNATURE);
        params.delete(SEARCH_PARAM_CYBERFROG_NONCE);
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const frogs = useManageFrogs();
  const utils = trpc.useUtils();
  const { mutateAsync: getCyberFrog } = trpc.feeds.getCyberFrog.useMutation({
    onSuccess: async (data) => {
      await utils.users.me.invalidate();
      await frogs.insert(podToPODData(data.pod));
    },
  });
  const { mutate: claimCyberFrog, isPending: isClaimingCyberFrog } =
    useMutation({
      mutationFn: async () => {
        if (!hasScore) {
          return;
        }
        if (!signature || !rawNonce) {
          return;
        }
        const nonce = parseInt(rawNonce);
        if (isNaN(nonce)) {
          return;
        }

        return toast.promise(getCyberFrog({ signature, nonce }), {
          loading: "Dialing up Cyber Frog...",
          success: (data) => {
            const frog = parseFrogPOD(podToPODData(data.pod));
            return `+1 🐸 ${frog.name} has entered your pond!`;
          },
          error: (e: unknown) => {
            if (e instanceof Error) {
              return `Oops! ${e.message}`;
            }
            return "Hmm... Something went wrong while getting your Cyber Frog. Please try again!";
          },
        });
      },
      onSettled: resetUrl,
    });

  useEffect(() => {
    if (isClaimingCyberFrog) {
      return;
    }
    if (!signature && !rawNonce) {
      return;
    }
    if (isLoadingUser) {
      return;
    }

    claimCyberFrog();
  }, [claimCyberFrog, isClaimingCyberFrog, isLoadingUser, rawNonce, signature]);

  return null;
}

export default CyberFrog;
