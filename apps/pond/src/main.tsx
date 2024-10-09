import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
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

createRoot(root).render(
  <StrictMode>
    <Provider>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ParcnetIframeProvider>
            <App />
            <Toaster />
            {window.self === window.top && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ParcnetIframeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </Provider>
  </StrictMode>
);
