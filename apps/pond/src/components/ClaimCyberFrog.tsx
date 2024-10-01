import React, { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import toast from "react-hot-toast";
import { trpc } from "../trpc";
import { useZupassAPI } from "../hooks/useZapp";
import Loader from "./shared/Loader";

function ClaimCyberFrog() {
  const [, setLocation] = useLocation();
  const { signature } = useParams<{ signature: string }>();
  const z = useZupassAPI();

  const { mutateAsync: getCyberFrog } = trpc.feeds.getCyberFrog.useMutation();

  useEffect(() => {
    void toast.promise(
      getCyberFrog({ signature })
        .then((data) => {
          if (data.pod) {
            return z.pod.insert(data.pod);
          }
          throw new Error("No pod found");
        })
        .finally(() => {
          setLocation("~/");
        }),
      {
        loading: "Claiming Cyber Frog...",
        success: "Cyber Frog claimed!",
        error: (e: unknown) =>
          `Error claiming Cyber Frog: ${e instanceof Error ? e.message : "Unknown error"}`,
      }
    );
  }, [getCyberFrog, signature, z, setLocation]);

  return <Loader />;
}

export default ClaimCyberFrog;
