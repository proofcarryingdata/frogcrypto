import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, trpcClient } from "./trpc";
import App from "./app";
import "./index.css";
import { Provider } from "jotai";
import { EmbeddedZupassProvider } from "./app/useZapp";

const queryClient = new QueryClient();

const zapp = { name: "frogcrypto:admin", permissions: ["read", "write"] };

const el = document.getElementById("root");
if (el) {
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <Provider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <EmbeddedZupassProvider zapp={zapp}>
              <App />
            </EmbeddedZupassProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </Provider>
    </React.StrictMode>
  );
} else {
  throw new Error("Could not find root element");
}
