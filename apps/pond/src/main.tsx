import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "react-hot-toast";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ParcnetIframeProvider } from "./hooks/useParcnetClient";
import App from "./App";
import { trpc, trpcClient } from "./trpc";

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
          <ParcnetIframeProvider zapp={zapp}>
            <ErrorBoundary fallback={<div>Something went wrong</div>}>
              <App />
              <Toaster />
              <ReactQueryDevtools initialIsOpen={false} />
            </ErrorBoundary>
          </ParcnetIframeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </Provider>
  </StrictMode>
);
