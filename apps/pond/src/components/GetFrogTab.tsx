import {
  type Feed,
  parseFrogPOD,
  FROG_FREEROLLS,
  Biome,
} from "@frogcrypto/shared";
import _ from "lodash";
import React, { useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { podToPODData } from "@parcnet-js/podspec";
import { TRPCClientError } from "@trpc/client";
import useCountDown from "../hooks/useCountDown";
import { useFrogConfetti } from "../hooks/useFrogParticles";
import useFrogs from "../hooks/useFrogs";
import useGetFrog from "../hooks/useGetFrog";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useUserState, useUserStateByFeedId } from "../hooks/useUserState";
import { ActionButton, FrogSearchButton } from "./shared/Button";
import Divider from "./shared/Divider";
import FrogCard from "./shared/FrogCard";
import LoadingMessages from "./shared/LoadingMessages";

/**
 * The GetFrog tab allows users to get frogs from their subscriptions as well as view their frogs.
 */
function GetFrogTab() {
  const { subscriptions } = useSubscriptions();
  const { data: userState } = useUserState();
  const userStateByFeedId = useUserStateByFeedId();
  const { data: frogs } = useFrogs();

  return (
    <>
      <div className="flex flex-col gap-2">
        {subscriptions.map((feed) => {
          const userFeedState = userStateByFeedId[feed.id];
          if (!userFeedState) {
            return null;
          }

          return (
            <SearchButton
              key={feed.id}
              feed={feed}
              nextFetchAt={userFeedState.nextFetchAt}
              score={userState?.myScore.score}
              active={Boolean(userFeedState.active)}
            />
          );
        })}
      </div>

      {Boolean(frogs?.length) && (
        <div className="flex flex-col gap-4 mt-2">
          {frogs?.map((frog) => <FrogCard key={frog.signature} frog={frog} />)}
        </div>
      )}
    </>
  );
}

function frogSearchText({
  freerolls,
  name,
}: {
  freerolls: number;
  name: string;
}) {
  return freerolls > 0 ? (
    <div
      className={`
        text-sm font-mono ml-auto animate-color-change
      `}
    >
      {name} ({freerolls} remaining)
    </div>
  ) : (
    name
  );
}

/**
 * Button to get a frog from a feed. It calls refreshUserState after each
 * request to ensure cooldown is updated.
 */
function SearchButton({
  feed,
  nextFetchAt,
  score,
  active,
}: {
  feed: Feed;
  nextFetchAt?: number;
  score: number | undefined;
  active: boolean;
}) {
  const countDown = useCountDown(nextFetchAt ?? 0);
  const canFetch = active && (!nextFetchAt || nextFetchAt < Date.now());
  const { mutateAsync: getFrogAsync } = useGetFrog();
  const confetti = useFrogConfetti();

  const onClick = useCallback(
    () =>
      toast.promise(
        new Promise<void>((resolve) => {
          setTimeout(resolve, 4000);
        }).then(() => getFrogAsync({ feedId: feed.id })),
        {
          loading: <LoadingMessages biome={feed.name} />,
          success: ({ pod }) => {
            void confetti();
            const frog = parseFrogPOD(podToPODData(pod));
            if (frog.biome === Biome.Unknown) {
              return `You found something strange in ${feed.name}. It doesn't appear to be a frog.`;
            }
            return `You found a ${frog.name} in ${feed.name}!`;
          },
          error: (e) => {
            if (e instanceof TRPCClientError) {
              const fetchErrorMsg = e.message.toLowerCase();
              if (fetchErrorMsg.includes("not active")) {
                return `Ribbit! ${feed.name} has vanished into a mist of mystery. It might return after a few bug snacks, or it might find new ponds to explore. Keep your eyes peeled for the next leap of adventure!`;
              }
              if (fetchErrorMsg.includes("next fetch")) {
                return "Froggy hiccup! Seems like one of our amphibians is playing camouflage. Zoo staff are peeking under every leaf. Hop back later for another try!";
              }
              if (fetchErrorMsg.includes("faucet off")) {
                return "Froggy hall of fame! You've won... but your lily pad's full. No room for more buddies!";
              }
              if (fetchErrorMsg.includes("frog not found")) {
                return "Alas, there is nothing but a lily pad here.";
              }
            }
            return "Oopsie-toad! Something went wrong.";
          },
        }
      ),
    [confetti, feed.id, feed.name, getFrogAsync]
  );
  const name = useMemo(() => `search ${_.upperCase(feed.name)}`, [feed.name]);
  const freerolls = FROG_FREEROLLS + 1 - (score ?? 0);

  return (
    <ActionButton
      key={feed.id}
      onClick={onClick}
      disabled={!canFetch}
      ButtonComponent={FrogSearchButton}
    >
      {canFetch ? frogSearchText({ freerolls, name }) : null}
      {!canFetch && (active ? `${name}${countDown}` : `${name} is closed`)}
    </ActionButton>
  );
}

export default GetFrogTab;
