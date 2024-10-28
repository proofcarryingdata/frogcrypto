import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "jotai";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FrogEmoji } from "./components/Frog";
import useInitializeUser from "./hooks/useInitializeUser";
import {
  ParcnetIframeProvider,
  useParcnetClientConnected,
} from "./hooks/useParcnetClient";
import { useUserState } from "./hooks/useUserState";
import "./index.css";
import { hasToken, trpc, trpcClient } from "./trpc";

const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) {
  throw new Error("No root element found");
}

function FrogButton({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex justify-center w-screen min-h-screen max-h-screen">
      <button
        type="button"
        className="flex w-full max-w-sm max-h-12 justify-center items-center bg-frogcrypto-btn rounded-md border-2 border-teal-50 drop-shadow-md"
      >
        <div className="flex items-center gap-2 h-8">{children}</div>
      </button>
    </main>
  );
}

function StaticButton() {
  return (
    <FrogButton>
      <FrogEmoji />
    </FrogButton>
  );
}

function DynamicButton() {
  const { data: userState } = useUserState();
  if (!userState) return <StaticButton />;

  return (
    <FrogButton>
      <h1 className="text-frog-score text-moss-700 font-mono self-center hover:text-white active:text-white">
        Score: {userState.myScore.score}
      </h1>
      <FrogEmoji />
    </FrogButton>
  );
}

function App() {
  const isConnected = useParcnetClientConnected();
  const { hasIdentity, error } = useInitializeUser();
  const isReady = isConnected && hasIdentity;

  if (hasToken()) {
    return <DynamicButton />;
  }

  if (!isReady) {
    return null;
  }

  if (error) {
    return <StaticButton />;
  }

  return <DynamicButton />;
}

createRoot(root).render(
  <StrictMode>
    <Provider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ParcnetIframeProvider>
            <App />

            {window.self === window.top && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ParcnetIframeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </Provider>
  </StrictMode>
);
