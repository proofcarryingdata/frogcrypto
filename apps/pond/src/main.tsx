import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { EmbeddedZupassProvider } from "./hooks/useZapp.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import { ZUPASS_URL } from "./constants.ts";
import { Toaster } from "react-hot-toast";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider>
      <QueryClientProvider client={queryClient}>
        <EmbeddedZupassProvider
          zapp={{ name: "frogcrypto", permissions: ["read", "write"] }}
          zupassUrl={ZUPASS_URL}
        >
          <ErrorBoundary fallback={<div>Something went wrong</div>}>
            <App />
            <Toaster />
          </ErrorBoundary>
        </EmbeddedZupassProvider>
      </QueryClientProvider>
    </Provider>
  </StrictMode>
);
