import { FROGCRYPTO_FOLDER_NAME } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import React from "react";
import toast from "react-hot-toast";
import { useLocation, useParams } from "wouter";
import { useParcnetClient } from "../hooks/useParcnetClient";
import { trpc } from "../trpc";

function ClaimCyberFrog() {
  const [, setLocation] = useLocation();
  const { signature, nonce } = useParams<{
    signature: string;
    nonce: number;
  }>();

  const z = useParcnetClient();

  const { mutateAsync: getCyberFrog } = trpc.feeds.getCyberFrog.useMutation();

  const handleClaim = () => {
    void toast.promise(
      getCyberFrog({ signature, nonce })
        .then((data) => {
          if (data.pod) {
            return z.pod
              .collection(FROGCRYPTO_FOLDER_NAME)
              .insert(podToPODData(data.pod));
          }
          throw new Error("No pod found");
        })
        .finally(() => {
          //   setLocation("~/");
        }),
      {
        loading: "Claiming Cyber Frog...",
        success: "Cyber Frog claimed!",
        error: (e: unknown) =>
          `Error claiming Cyber Frog: ${e instanceof Error ? e.message : "Unknown error"}`,
      }
    );
  };

  return (
    <div>
      <button type="button" onClick={handleClaim} className="btn">
        Claim
      </button>
      <pre>Signature: {signature}</pre>
    </div>
  );
}

export default ClaimCyberFrog;
