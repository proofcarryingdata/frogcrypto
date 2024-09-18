import React, { useContext, useState } from "react";
import { useAtom } from "jotai";
import { FROGCRYPTO_FOLDER_NAME } from "./constants";
import Intro from "./components/Intro";
import { useSubscriptions } from "./hooks/useSubscriptions";
import GetFrogTab from "./components/GetFrogTab";
import { EmbeddedZupassProvider, useMaybeZupassAPI } from "./hooks/useZapp";
import useInitializeUser from "./hooks/useInitializeUser";
import Loader from "./components/Loader";
import useFrogs from "./hooks/useFrogs";
import { useUserState } from "./hooks/useUserState";
import useTsParticles from "./hooks/useTsParticles";
import { DexTab } from "./components/DexTab";

const TABS = [
  {
    tab: "get",
    label: "get frogs",
    component: GetFrogTab,
  },
  {
    tab: "dex",
    label: "frogedex",
    component: DexTab,
  },
  {
    tab: "social",
    label: "frog social",
    component: GetFrogTab,
  },
] as const;
type TabId = (typeof TABS)[number]["tab"];

function FrogCrypto() {
  // TODO: handle error state
  const { frogs } = useFrogs();
  const { data: userState } = useUserState();
  const myScore = userState?.myScore?.score;
  const { subscriptions } = useSubscriptions();

  const [tab, setTab] = useState<TabId>("get");
  const TabComponent = TABS.find((t) => t.tab === tab)?.component;
  const socialUnlocked = false;

  if (!frogs || !userState) {
    return <Loader />;
  }

  if (subscriptions.length === 0) {
    return <Intro hasFrog={Boolean(myScore)} />;
  }

  return (
    <>
      <span className="text-frog-score self-center">{myScore ?? "?"} 🐸</span>

      {
        // show frog card on first pull
        // show tabs on second pull
        (myScore ?? 0) >= 2 && (
          <div className="flex gap-2 items-stretch h-min">
            {TABS.map(({ tab: t, label }) => (
              <button
                className="btn"
                key={t}
                disabled={tab === t || (t === "social" && !socialUnlocked)}
                onClick={(): void => {
                  setTab(t);
                }}
              >
                {t === "social" && !socialUnlocked ? `??? (10 🐸)` : label}
              </button>
            ))}
          </div>
        )
      }

      {TabComponent ? <TabComponent /> : null}
    </>
  );
}

function App() {
  useTsParticles();

  const maybeZupassAPI = useMaybeZupassAPI();
  // TODO: this may need a more robust check that our identity is still valid
  const hasIdentity = useInitializeUser();
  const isReady = maybeZupassAPI && hasIdentity;

  return (
    <main className="flex justify-center w-screen h-screen pt-8">
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
