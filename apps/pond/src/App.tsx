import React, { useContext, useState } from "react";
import { FROGCRYPTO_FOLDER_NAME } from "./constants";
import Intro from "./components/Intro";
import { useSubscriptions } from "./hooks/useSubscriptions";
import GetFrogTab from "./components/GetFrogTab";
import { EmbeddedZupassProvider, useMaybeZupassAPI } from "./hooks/useZapp";
import { useAtom } from "jotai";
import useInitializeUser from "./hooks/useInitializeUser";
import Loader from "./components/Loader";

function FrogCrypto() {
  const hasFrog = false;

  return <>{hasFrog ? <Intro hasFrog={hasFrog} /> : <GetFrogTab />}</>;
}

function App() {
  const maybeZupassAPI = useMaybeZupassAPI();
  // TODO: this may need a more robust check that our identity is still valid
  const hasIdentity = useInitializeUser();
  const isReady = maybeZupassAPI && hasIdentity;

  return (
    <main className="flex justify-center w-screen h-screen pt-8">
      <div className="flex flex-col gap-4 w-full max-w-md items-center">
        <h1 className="font-superfunky">
          <span>{FROGCRYPTO_FOLDER_NAME}</span>
        </h1>

        {isReady ? <FrogCrypto /> : <Loader className="w-16 h-16 mt-8" />}
      </div>
    </main>
  );
}

export default App;
