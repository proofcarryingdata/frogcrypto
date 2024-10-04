import { FROGCRYPTO_FOLDER_NAME } from "@frogcrypto/shared";
import React from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { DexTab } from "./components/DexTab";
import GetFrogTab from "./components/GetFrogTab";
import Intro from "./components/Intro";
import Loader from "./components/shared/Loader";
import SocialTab from "./components/SocialTab";
import useFrogs from "./hooks/useFrogs";
import useInitializeUser from "./hooks/useInitializeUser";
import { useSubscriptions } from "./hooks/useSubscriptions";
import useTsParticles from "./hooks/useTsParticles";
import { useSocialTabAvailable, useUserState } from "./hooks/useUserState";
import {
  useMaybeParcnetClient,
  useParcnetClientConnected,
} from "./hooks/useParcnetClient";
import SpiritFrogMinter from "./components/social/SpiritFrogMinter";
import NotFound from "./components/NotFound";
import ClaimCyberFrog from "./components/ClaimCyberFrog";
import { usePendingFrogRequestsCount } from "./hooks/useFrogRequests";

function FrogCrypto() {
  const { data: frogs } = useFrogs();
  const { data: userState } = useUserState();
  const myScore = userState?.myScore?.score;
  const { subscriptions } = useSubscriptions();
  const socialTabAvailable = useSocialTabAvailable();
  const { data: pendingFrogRequestsCount } = usePendingFrogRequestsCount();
  const [location] = useLocation();

  if (!frogs || !userState) {
    return <Loader />;
  }

  if (subscriptions.length === 0) {
    return <Intro hasFrog={Boolean(myScore)} />;
  }

  return (
    <>
      <span className="text-frog-score self-center">{myScore ?? "?"} 🐸</span>

      {(myScore ?? 0) >= 2 && (
        <nav className="flex w-full gap-4 [&>*]:text-center">
          <Link
            href="/"
            className={`btn ${location === "/" ? "bg-green-600" : "bg-gray-400"}`}
          >
            get frogs
          </Link>
          <Link
            href="/dex"
            className={`btn ${location === "/dex" ? "bg-green-600" : "bg-gray-400"}`}
          >
            frogedex
          </Link>
          {socialTabAvailable ? (
            <Link
              href={pendingFrogRequestsCount ? "/social/friends" : "/social"}
              className={`btn relative ${
                location.startsWith("/social") ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              frog social
              {pendingFrogRequestsCount ? (
                <span className="absolute top-0 right-0 -mt-3 -mr-3 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {pendingFrogRequestsCount}
                </span>
              ) : null}
            </Link>
          ) : (
            <span className="btn relative opacity-50 cursor-not-allowed bg-gray-400">
              ??? (5 🐸)
            </span>
          )}
        </nav>
      )}

      <Switch>
        <Route path="/" component={GetFrogTab} />
        <Route path="/dex" component={DexTab} />
        <Route path="/social/tadpole" component={SpiritFrogMinter} />
        <Route path="/social" component={SocialTab} nest />
        <Route path="/cyber/:signature" component={ClaimCyberFrog} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  useTsParticles();

  const isConnected = useParcnetClientConnected();
  const hasIdentity = useInitializeUser();
  const isReady = isConnected && hasIdentity;

  return (
    <main className="flex justify-center w-screen min-h-screen py-8">
      <div className="flex flex-col gap-6 w-full max-w-sm items-stretch">
        <h1 className="font-superfunky text-2xl self-center">
          <span>{FROGCRYPTO_FOLDER_NAME}</span>
        </h1>

        {isReady ? <FrogCrypto /> : <Loader />}
      </div>
    </main>
  );
}

export default App;
