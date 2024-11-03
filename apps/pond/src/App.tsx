import React, { Suspense } from "react";
import toast from "react-hot-toast";
import { Link, Route, Switch, useLocation } from "wouter";
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

function SocialTabButton() {
  const socialTabAvailable = useSocialTabAvailable();
  const [location] = useLocation();

  return socialTabAvailable ? (
    <Link
      href="/social"
      className={`btn ${
        location.startsWith("/social") ? "bg-green-500" : "bg-teal-500"
      }`}
    >
      frog social
    </Link>
  ) : (
    <button
      type="button"
      className="btn relative opacity-50 cursor-not-allowed bg-gray-400"
      onClick={() => {
        toast.error(
          <span>
            You need 10 <FrogEmoji className="w-4 h-4 inline mb-1" /> to unlock
            unlock this feature!
          </span>
        );
      }}
    >
      ??? (<Frog score={10} className="text-sm" colorize={false} />)
    </button>
  );
}

function FrogCrypto() {
  const { data: userState } = useUserState();
  const myScore = userState?.myScore.score;
  const { subscriptions } = useSubscriptions();
  const [location] = useLocation();

  if (!userState) {
    return <Loader />;
  }

  if (subscriptions.length === 0) {
    return <Intro hasFrog={Boolean(myScore)} />;
  }

  return (
    <>
      <CyberFrog />
      <FrogNecklace />
      <PendingRequests />

      <Frog className="self-center" score={myScore ?? "?"} />

      {(myScore ?? 0) >= 2 && (
        <nav className="flex w-full gap-3 font-mono [&>*]:text-center [&>*]:whitespace-nowrap">
          <Link
            href="/"
            className={`btn ${location === "/" ? "bg-green-500" : "bg-teal-500"}`}
            title="get frogs"
          >
            get frogs
          </Link>
          <Link
            href="/dex"
            className={`btn ${location === "/dex" ? "bg-green-500" : "bg-teal-500"}`}
            title="frogedex"
          >
            frogedex
          </Link>
          {/* {userState.myScore.devcon7TicketId ? <SocialTabButton /> : null} */}
          <SocialTabButton />
        </nav>
      )}

      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path="/" component={GetFrogTab} />
          <Route path="/dex" component={DexTab} />
          {/* {userState.myScore.devcon7TicketId ? ( */}
          <Route path="/social" component={SocialTab} nest />
          {/* ) : null} */}
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

  return (
    <main className="flex justify-center w-screen max-w-full pt-6 pb-12 bg-dot-pattern overflow-auto">
      <div className="flex flex-col gap-4 w-full max-w-sm items-stretch px-4 flex-1">
        <h1 className="font-superfunky text-2xl self-center">
          <span>FrogCrypto</span>
        </h1>

        <Suspense fallback={<Loader />}>
          <AppWrapper />
        </Suspense>
      </div>
    </main>
  );
}

export default App;
