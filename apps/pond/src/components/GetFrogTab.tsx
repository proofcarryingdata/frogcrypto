import {
  Biome,
  type Feed,
  FROG_FREEROLLS,
  parseFrogPOD,
} from "@frogcrypto/shared";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { podToPODData } from "@parcnet-js/podspec";
import { TRPCClientError } from "@trpc/client";
import _ from "lodash";
import React, { useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { ViewportList } from "react-viewport-list";
import useCountDown from "../hooks/useCountDown";
import { useFrogConfetti } from "../hooks/useFrogParticles";
import useFrogs, { isProfileFrogPOD } from "../hooks/useFrogs";
import useGetFrog from "../hooks/useGetFrog";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useUserState, useUserStateByFeedId } from "../hooks/useUserState";
import { ActionButton, FrogSearchButton } from "./shared/Button";
import FrogCard from "./shared/FrogCard";
import LoadingMessages from "./shared/LoadingMessages";

/**
 * The GetFrog tab allows users to get frogs from their subscriptions as well as view their frogs.
 */
function GetFrogTab() {
  const { subscriptions } = useSubscriptions();
  const { data: userState } = useUserState();
  const userStateByFeedId = useUserStateByFeedId();
  const frogs = useFrogs();

  const ref = useRef<HTMLDivElement | null>(null);

  const visibleFrogs = useMemo(() => {
    return frogs.filter(
      (frog) =>
        !(isProfileFrogPOD(frog) && frog.profileId === frog.ownerSemaphoreId)
    );
  }, [frogs]);

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

      {Boolean(visibleFrogs.length) && (
        <div className="flex flex-col gap-4" ref={ref}>
          <ViewportList viewportRef={ref} items={visibleFrogs}>
            {(frog) => <FrogCard key={frog.signature} frog={frog} />}
          </ViewportList>
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
  const refTurnstile = useRef<TurnstileInstance>(null);

  const onClick = useCallback(
    () =>
      toast.promise(
        Promise.all([
          new Promise<void>((resolve) => {
            setTimeout(resolve, 4000);
          }),
          refTurnstile.current?.getResponsePromise(),
        ])
          .then(() =>
            getFrogAsync({
              feedId: feed.id,
              token: refTurnstile.current?.getResponse(),
              version: "v2",
            })
          )
          .finally(() => {
            refTurnstile.current?.reset();
          }),
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
                return `${feed.name} needs a moment to refill the pond. No double-dipping!`;
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
    <>
      <ActionButton
        key={feed.id}
        onClick={onClick}
        disabled={!canFetch}
        ButtonComponent={FrogSearchButton}
      >
        {canFetch ? frogSearchText({ freerolls, name }) : null}
        {!canFetch && (active ? `${name}${countDown}` : `${name} is closed`)}
      </ActionButton>

      {canFetch ? (
        <Turnstile
          id={`turnstile-feed-${feed.id}`}
          className="self-center"
          color="light"
          ref={refTurnstile}
          siteKey="0x4AAAAAAAzubSJu97uBvGuG"
        />
      ) : null}
    </>
  );
}

export default GetFrogTab;
