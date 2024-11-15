import {
  CLOUDFLARE_TURNSTILE_SITE_KEY,
  parseFrogPOD,
} from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { useMutation } from "@tanstack/react-query";
import React, { useCallback, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { TRPCClientError } from "@trpc/client";
import { useManageFrogs } from "../hooks/useFrogs";
import useSearchParams from "../hooks/useSearchParams";
import { useUserState } from "../hooks/useUserState";
import { trpc } from "../trpc";
import useScanFeeds from "../hooks/useScanFeeds";

const SEARCH_PARAM_FROG_SCANNER_CODE = "scanner_code";

const processedCodes = new Set<string>();

function FrogScanner() {
  const [searchParams, setSearchParams] = useSearchParams();
  const code = searchParams.get(SEARCH_PARAM_FROG_SCANNER_CODE);
  const { data: user, isPending: isLoadingUser } = useUserState();
  const hasScore = user?.myScore.score && user.myScore.score > 0;
  const refTurnstile = useRef<TurnstileInstance>(null);

  const resetUrl = useCallback(() => {
    processedCodes.add(code ?? "");
    setSearchParams(
      (params) => {
        params.delete(SEARCH_PARAM_FROG_SCANNER_CODE);
        return params;
      },
      { replace: true }
    );
  }, [setSearchParams, code]);

  const frogs = useManageFrogs();
  const utils = trpc.useUtils();
  const {
    data: feed,
    error: probeError,
    isPending: isProbing,
  } = trpc.feeds.probe.useQuery(
    { code: code ?? "" },
    {
      enabled: Boolean(code),
      retry: false,
    }
  );
  const { mutateAsync: getFrog } = trpc.feeds.search.useMutation({
    onSuccess: async (data) => {
      await utils.users.me.invalidate();
      await frogs.insert(podToPODData(data.pod));
    },
  });
  const scanFeeds = useScanFeeds();
  const { mutate: scanFrog, isPending: isScanningFrog } = useMutation({
    mutationFn: async () => {
      if (!hasScore) {
        return;
      }
      if (probeError) {
        toast.error(probeError.message);
        return;
      }
      if (!feed) {
        return;
      }
      if (!refTurnstile.current) {
        return;
      }

      return toast.promise(
        refTurnstile.current
          .getResponsePromise()
          .then((token) => getFrog({ feedId: feed.id, token, version: "v2" }))
          .finally(() => {
            void scanFeeds(feed.id);
          }),
        {
          loading: feed.description,
          success: (data) => {
            const frog = parseFrogPOD(podToPODData(data.pod));
            return `+1 🐸 ${frog.name} has entered your pond!`;
          },
          error: (e: unknown) => {
            if (e instanceof TRPCClientError) {
              const fetchErrorMsg = e.message.toLowerCase();
              if (fetchErrorMsg.includes("not active")) {
                return `Ribbit! ${feed.name} has vanished into a mist of mystery. It might return after a few bug snacks, or it might find new ponds to explore. Keep your eyes peeled for the next leap of adventure!`;
              }
              if (fetchErrorMsg.includes("try again")) {
                return e.message;
              }
              if (fetchErrorMsg.includes("faucet off")) {
                return "Froggy hall of fame! You've won... but your lily pad's full. No room for more buddies!";
              }
              if (fetchErrorMsg.includes("frog not found")) {
                return "Alas, there is nothing but a lily pad here.";
              }
            }
            if (e instanceof Error) {
              return `Oops! ${e.message}`;
            }
            return "Hmm... Something went wrong while getting your Cyber Frog. Please try again!";
          },
        }
      );
    },
    onSettled: resetUrl,
  });

  useEffect(() => {
    if (isScanningFrog || isProbing) {
      return;
    }
    if (!code) {
      return;
    }
    if (processedCodes.has(code)) {
      return;
    }
    if (isLoadingUser) {
      return;
    }

    scanFrog();
  }, [scanFrog, isScanningFrog, isLoadingUser, code, feed, isProbing]);

  return (
    feed && (
      <Turnstile
        id={`turnstile-feed-${feed.id}`}
        className="self-center"
        color="light"
        ref={refTurnstile}
        siteKey={CLOUDFLARE_TURNSTILE_SITE_KEY}
        options={{
          action: "scan-frog",
        }}
      />
    )
  );
}

export default FrogScanner;
