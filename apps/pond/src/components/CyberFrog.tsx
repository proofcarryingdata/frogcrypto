import { FROGCRYPTO_FOLDER_NAME, parseFrogPOD } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { useParcnetClient } from "../hooks/useParcnetClient";
import useSearchParams from "../hooks/useSearchParams";
import { trpc } from "../trpc";

const SEARCH_PARAM_CYBERFROG_SIGNATURE = "cfsig";
const SEARCH_PARAM_CYBERFROG_NONCE = "cfnonce";

function CyberFrog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const signature = searchParams.get(SEARCH_PARAM_CYBERFROG_SIGNATURE);
  const rawNonce = searchParams.get(SEARCH_PARAM_CYBERFROG_NONCE);

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

  const z = useParcnetClient();
  const { mutateAsync: getCyberFrog } = trpc.feeds.getCyberFrog.useMutation({
    onSuccess: (data) => {
      // FIXME: upstream bug where insert doesn't resolve
      void z.pod
        .collection(FROGCRYPTO_FOLDER_NAME)
        .insert(podToPODData(data.pod));
    },
  });
  const { mutate: claimCyberFrog, isPending: isClaimingCyberFrog } =
    useMutation({
      mutationFn: async () => {
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

    claimCyberFrog();
  }, [claimCyberFrog, isClaimingCyberFrog, rawNonce, signature]);

  return null;
}

export default CyberFrog;
