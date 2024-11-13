import React, { Suspense } from "react";
import toast from "react-hot-toast";
import { Link, Route, Switch, useLocation } from "wouter";
import PullToRefresh from "react-simple-pull-to-refresh";
import { useQueryClient } from "@tanstack/react-query";
import { default as CyberFrog } from "./components/CyberFrog";
import { DexTab } from "./components/DexTab";
import GetFrogTab from "./components/GetFrogTab";
import Intro from "./components/Intro";
import NotFound from "./components/NotFound";
import ErrorBoundary, { Unauthorized } from "./components/shared/ErrorBoundary";
import Frog, { FrogEmoji } from "./components/shared/Frog";
import Loader from "./components/shared/Loader";
import FrogNecklace from "./components/social/FrogNecklace";
import PendingRequests from "./components/social/PendingRequests";
import SocialTab from "./components/SocialTab";
import { useConnectFrogStore } from "./hooks/useFrogs";
import useInitializeUser from "./hooks/useInitializeUser";
import { useSubscriptions } from "./hooks/useSubscriptions";
import useTsParticles from "./hooks/useTsParticles";
import { useSocialTabAvailable, useUserState } from "./hooks/useUserState";
import { useAcceptedFrogRequests } from "./hooks/useFrogRequests";
import { scoreToEmoji } from "./components/social/FrogScore";

function SocialTabButton() {
  const socialTabAvailable = useSocialTabAvailable();
  const [location] = useLocation();

  return socialTabAvailable ? (
    <Link
      href="/social"
      className={`btn ${
        location.startsWith("/social")
          ? "bg-green-500 font-semibold"
          : "bg-teal-500"
      }`}
    >
      FROG SOCIAL
    </Link>
  ) : (
    <button
      type="button"
      className="btn relative opacity-50 cursor-not-allowed bg-gray-400"
      onClick={() => {
        toast.error(
          <span>
            You need 10 <FrogEmoji className="w-4 h-4 inline mb-1" /> to unlock
            this feature!
          </span>
        );
      }}
    >
      ??? (<Frog score={10} className="text-sm" colorize={false} />)
    </button>
  );
}

function Score() {
  const { data: userState } = useUserState();
  const myScore = userState?.myScore.score;

  return (
    <div className="flex items-center gap-2 self-center">
      <Frog className="self-center" score={myScore ?? "?"} prefix="SCORE: " />
      {myScore && myScore > 2 ? (
        <span className="self-center text-frog-score">
          {" "}
          | {scoreToEmoji(myScore)}
        </span>
      ) : undefined}
    </div>
  );
}

function FrogCrypto() {
  const { data: userState } = useUserState();
  const myScore = userState?.myScore.score;
  const { subscriptions } = useSubscriptions();
  const [location] = useLocation();
  useAcceptedFrogRequests();

  if (!userState) {
    return <Loader />;
  }

  if (subscriptions.length === 0) {
    return <Intro hasFrog={Boolean(myScore)} />;
  }

  return (
    <>
      <PendingRequests />
      <FrogNecklace />
      <CyberFrog />

      <Score />

      {(myScore ?? 0) >= 2 && (
        <nav className="flex w-full gap-3 font-mono [&>*]:text-center [&>*]:whitespace-nowrap">
          <Link
            href="/"
            className={`btn ${location === "/" ? "bg-green-500 font-semibold" : "bg-teal-500"}`}
            title="get frogs"
          >
            get frogs
          </Link>
          <Link
            href="/dex"
            className={`btn ${location === "/dex" ? "bg-green-500 font-semibold" : "bg-teal-500"}`}
            title="frogedex"
          >
            frogedex
          </Link>
          {userState.myScore.devcon7TicketId ? <SocialTabButton /> : null}
        </nav>
      )}

      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path="/" component={GetFrogTab} />
          <Route path="/dex" component={DexTab} />
          <Route path="/social" component={SocialTab} nest />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function AppWrapper() {
  const { hasIdentity, error } = useInitializeUser();

  return error && !hasIdentity ? (
    <Unauthorized />
  ) : (
    <ErrorBoundary>
      {hasIdentity ? (
        <Suspense fallback={<Loader />}>
          <FrogCrypto />
        </Suspense>
      ) : (
        <Loader />
      )}
    </ErrorBoundary>
  );
}

function App() {
  useTsParticles();
  useConnectFrogStore();
  const queryClient = useQueryClient();

  return (
    <PullToRefresh
      onRefresh={async () => {
        await queryClient.refetchQueries({ type: "active" });
      }}
      className="bg-dot-pattern text-center"
      pullDownThreshold={100}
      maxPullDownDistance={150}
    >
      <main className="flex justify-center w-screen max-w-full pt-6 pb-12 bg-dot-pattern overflow-auto">
        <div className="flex flex-col gap-4 w-full max-w-sm items-stretch px-4 flex-1">
          <h1 className="font-superfunky text-2xl self-center">
            <span>FrogCrypto</span>
          </h1>

          <Suspense
            fallback={
              <Loader message="Refresh your page if this is taking too long..." />
            }
          >
            <AppWrapper />
          </Suspense>
        </div>
      </main>
    </PullToRefresh>
  );
}

export default App;
