import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "jotai";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/react";
import App from "./App";
import { ParcnetIframeProvider } from "./hooks/useParcnetClient";
import "./index.css";
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
            <Toaster containerClassName="select-none" />
            <Analytics />
            {window.self === window.top && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ParcnetIframeProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </Provider>
  </StrictMode>
);
