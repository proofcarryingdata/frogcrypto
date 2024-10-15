import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import { ParcnetIframeProvider } from "./app/useParcnetClient";
import "./index.css";
import { trpc, trpcClient } from "./trpc";

const queryClient = new QueryClient();

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <Provider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ParcnetIframeProvider>
              <App />
            </ParcnetIframeProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </Provider>
    </React.StrictMode>
  );
} else {
  throw new Error("Could not find root element");
}
