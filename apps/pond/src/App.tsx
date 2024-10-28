import { FROGCRYPTO_FOLDER_NAME } from "@frogcrypto/shared";
import React, { Suspense } from "react";
import toast from "react-hot-toast";
import { Link, Route, Switch, useLocation } from "wouter";
import { default as CyberFrog } from "./components/CyberFrog";
import { DexTab } from "./components/DexTab";
import { FrogEmoji } from "./components/Frog";
import GetFrogTab from "./components/GetFrogTab";
import Intro from "./components/Intro";
import NotFound from "./components/NotFound";
import ErrorBoundary, { Unauthorized } from "./components/shared/ErrorBoundary";
import Frog from "./components/shared/Frog";
import Loader from "./components/shared/Loader";
import FrogNecklace from "./components/social/FrogNecklace";
import NewProfile from "./components/social/NewProfile";
import PendingRequests from "./components/social/PendingRequests";
import SocialTab from "./components/SocialTab";
import { useConnectFrogStore } from "./hooks/useFrogs";
import useInitializeUser from "./hooks/useInitializeUser";
import { useParcnetClientConnected } from "./hooks/useParcnetClient";
import { useSubscriptions } from "./hooks/useSubscriptions";
import useTsParticles from "./hooks/useTsParticles";
import { useSocialTabAvailable, useUserState } from "./hooks/useUserState";

function FrogCrypto() {
  const { data: userState } = useUserState();
  const myScore = userState?.myScore.score;
  const { subscriptions } = useSubscriptions();
  const socialTabAvailable = useSocialTabAvailable();
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
        <nav className="flex w-full gap-3 [&>*]:text-center [&>*]:whitespace-nowrap">
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
          {socialTabAvailable ? (
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
                    You need 10 <FrogEmoji className="w-2 h-2 inline" /> to
                    unlock unlock this feature!
                  </span>
                );
              }}
            >
              ??? (<Frog score={10} className="text-sm" colorize={false} />)
            </button>
          )}
        </nav>
      )}

      <Suspense fallback={<Loader />}>
        <Switch>
          <Route path="/" component={GetFrogTab} />
          <Route path="/dex" component={DexTab} />
          <Route path="/social/tadpole" component={NewProfile} />
          <Route path="/social" component={SocialTab} nest />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  useTsParticles();
  useConnectFrogStore();

  const isConnected = useParcnetClientConnected();
  const { hasIdentity, error } = useInitializeUser();
  const isReady = isConnected && hasIdentity;

  return (
    <main className="flex justify-center w-screen min-h-screen max-h-screen py-6 bg-dot-pattern overflow-auto">
      <div className="flex flex-col gap-4 w-full max-w-sm items-stretch px-2 flex-1">
        <h1 className="font-superfunky text-2xl self-center">
          <span>{FROGCRYPTO_FOLDER_NAME}</span>
        </h1>

        {error ? (
          <Unauthorized />
        ) : (
          <ErrorBoundary>
            {isReady ? (
              <Suspense fallback={<Loader />}>
                <FrogCrypto />
              </Suspense>
            ) : (
              <Loader />
            )}
          </ErrorBoundary>
        )}
      </div>
    </main>
  );
}

export default App;
