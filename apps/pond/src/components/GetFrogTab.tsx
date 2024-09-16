import React, { useCallback, useMemo } from "react";
import { useSubscriptions } from "../hooks/useSubscriptions";
import { useUserState, useUserStateByFeedId } from "../hooks/useUserState";
import { FROG_FREEROLLS, Subscription } from "@pcd/passport-interface";
import useCountDown from "../hooks/useCountDown";
import _ from "lodash";
import { ActionButton, FrogSearchButton } from "./Button";
import toast from "react-hot-toast";
import LoadingMessages from "./LoadingMessages";
import useGetFrog from "../hooks/useGetFrog";
import { parseFrogPOD } from "@frogcrypto/shared";
import axios from "axios";
import { Biome } from "@pcd/eddsa-frog-pcd";
import { useZupassAPI } from "../hooks/useZapp";
import useFrogs from "../hooks/useFrogs";
import FrogCard from "./FrogCard";

/**
 * The GetFrog tab allows users to get frogs from their subscriptions as well as view their frogs.
 */
const GetFrogTab = () => {
  const { subscriptions } = useSubscriptions();
  const { data: userState } = useUserState();
  const userStateByFeedId = useUserStateByFeedId();
  const { frogs } = useFrogs();

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        {subscriptions.map((sub) => {
          const userFeedState = userStateByFeedId[sub.feed.id];

          return (
            <SearchButton
              key={sub.id}
              sub={sub}
              nextFetchAt={userFeedState?.nextFetchAt}
              score={userState?.myScore?.score}
              active={!!userFeedState?.active}
            />
          );
        })}
      </div>

      {!!frogs?.length && (
        <div className="flex flex-col gap-4 w-full">
          {frogs.map((frog) => (
            <FrogCard key={frog.contentID} frog={frog} />
          ))}
        </div>
      )}
    </>
  );
};

/**
 * Button to get a frog from a feed. It calls refreshUserState after each
 * request to ensure cooldown is updated.
 */
const SearchButton = ({
  sub: { id, feed },
  nextFetchAt,
  score,
  active,
}: {
  sub: Subscription;
  nextFetchAt?: number;
  score: number | undefined;
  active: boolean;
}) => {
  const countDown = useCountDown(nextFetchAt ?? 0);
  const canFetch = active && (!nextFetchAt || nextFetchAt < Date.now());
  const { mutateAsync: getFrogAsync } = useGetFrog({ feedId: feed.id });

  const onClick = useCallback(
    () =>
      toast.promise(
        new Promise<void>((resolve) => {
          setTimeout(resolve, 4000);
        }).then(getFrogAsync),
        {
          loading: <LoadingMessages biome={feed.name} />,
          success: (frogPOD) => {
            const frog = parseFrogPOD(frogPOD);
            if (frog.biome === Biome.Unknown) {
              return `You found something strange in ${feed.name}. It doesn't appear to be a frog.`;
            }
            return `You found a ${frog.name} in ${feed.name}!`;
          },
          error: (e) => {
            if (
              axios.isAxiosError<{ error: string }, Record<string, unknown>>(e)
            ) {
              const fetchErrorMsg = e.response?.data?.error?.toLowerCase();
              if (fetchErrorMsg?.includes("not active")) {
                return `Ribbit! ${feed.name} has vanished into a mist of mystery. It might return after a few bug snacks, or it might find new ponds to explore. Keep your eyes peeled for the next leap of adventure!`;
              }
              if (fetchErrorMsg?.includes("next fetch")) {
                return "Froggy hiccup! Seems like one of our amphibians is playing camouflage. Zoo staff are peeking under every leaf. Hop back later for another try!";
              }
              if (fetchErrorMsg?.includes("faucet off")) {
                return "Froggy hall of fame! You've won... but your lily pad's full. No room for more buddies!";
              }
              if (fetchErrorMsg?.includes("frog not found")) {
                return "Alas, there is nothing but a lily pad here.";
              }
            }
            return "Oopsie-toad! Something went wrong.";
          },
        }
      ),
    [feed.name, getFrogAsync]
  );
  const name = useMemo(() => `search ${_.upperCase(feed.name)}`, [feed.name]);
  const freerolls = FROG_FREEROLLS + 1 - (score ?? 0);

  return (
    <ActionButton
      key={id}
      onClick={onClick}
      disabled={!canFetch}
      ButtonComponent={FrogSearchButton}
    >
      {canFetch &&
        (freerolls > 0 ? (
          <div
            className={`
            text-sm font-mono ml-auto
            ${canFetch ? "animate-color-change" : "text-[#ff9900]"}
          `}
          >
            {name} ({freerolls} remaining)
          </div>
        ) : (
          name
        ))}

      {!canFetch && (active ? `${name}${countDown}` : `${name} is closed`)}
    </ActionButton>
  );
};

export default GetFrogTab;
