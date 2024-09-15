import React, { useContext, useState } from "react";
import { FROGCRYPTO_FOLDER_NAME } from "./constants";
import Intro from "./components/Intro";
import { useSubscriptions } from "./hooks/useSubscriptions";
import GetFrogTab from "./components/GetFrogTab";
import { EmbeddedZupassProvider, useMaybeZupassAPI } from "./hooks/useZapp";
import { useAtom } from "jotai";
import useInitializeUser from "./hooks/useInitializeUser";
import Loader from "./components/Loader";
import useFrogs from "./hooks/useFrogs";
import { useUserState } from "./hooks/useUserState";

function FrogCrypto() {
  // TODO: handle error state
  const { frogs } = useFrogs();
  const user = useUserState();
  console.log({ user });

  if (!frogs) {
    return <Loader className="w-16 h-16 mt-8" />;
  }

  const hasFrog = frogs.length > 0;
  return <>{hasFrog ? <GetFrogTab /> : <Intro hasFrog={hasFrog} />}</>;
}

function App() {
  const maybeZupassAPI = useMaybeZupassAPI();
  // TODO: this may need a more robust check that our identity is still valid
  const hasIdentity = useInitializeUser();
  const isReady = maybeZupassAPI && hasIdentity;

  return (
    <main className="flex justify-center w-screen h-screen pt-8">
      <div className="flex flex-col gap-4 w-full max-w-md items-center">
        <h1 className="font-superfunky text-2xl">
          <span>{FROGCRYPTO_FOLDER_NAME}</span>
        </h1>

        {isReady ? <FrogCrypto /> : <Loader className="w-16 h-16 mt-8" />}
      </div>
    </main>
  );
}

export default App;
