import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import toast from "react-hot-toast";
import { trpc } from "../trpc";
import { useParcnetClient } from "../hooks/useParcnetClient";
import Loader from "./shared/Loader";

function ClaimCyberFrog() {
  const [, setLocation] = useLocation();
  const { signature } = useParams<{ signature: string }>();
  const z = useParcnetClient();

  const { mutateAsync: getCyberFrog } = trpc.feeds.getCyberFrog.useMutation();

  const handleClaim = () => {
    void toast.promise(
      getCyberFrog({ signature })
        .then((data) => {
          if (data.pod) {
            return z.pod.insert(data.pod);
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
