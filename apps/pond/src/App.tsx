import React, { useState } from "react";
import { FROGCRYPTO_FOLDER_NAME } from "./constants";
import Intro from "./components/Intro";
import { useSubscriptions } from "./hooks/useSubscriptions";
import GetFrogTab from "./components/GetFrogTab";

function App() {
  const hasFrog = false;

  return (
    <main className="flex justify-center w-screen h-screen pt-8">
      <div className="flex flex-col gap-4 w-full max-w-md items-center">
        <h1 className="font-superfunky">
          <span>{FROGCRYPTO_FOLDER_NAME}</span>
        </h1>

        {hasFrog ? <Intro hasFrog={hasFrog} /> : <GetFrogTab />}
      </div>
    </main>
  );
}

export default App;
