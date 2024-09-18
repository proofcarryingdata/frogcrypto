import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "react-hot-toast";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ZUPASS_URL } from "./constants.ts";
import { EmbeddedZupassProvider } from "./hooks/useZapp.tsx";
import App from "./App.tsx";
import { trpc, trpcClient } from "./trpc.ts";

const queryClient = new QueryClient();

const root = document.getElementById("root");
if (!root) {
  throw new Error("No root element found");
}
const zapp = { name: "frogcrypto", permissions: ["read", "write"] };

createRoot(root).render(
  <StrictMode>
    <Provider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <EmbeddedZupassProvider zapp={zapp} zupassUrl={ZUPASS_URL}>
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
              <App />
              <Toaster />
              <ReactQueryDevtools initialIsOpen={false} />
            </ErrorBoundary>
          </EmbeddedZupassProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </Provider>
  </StrictMode>
);
