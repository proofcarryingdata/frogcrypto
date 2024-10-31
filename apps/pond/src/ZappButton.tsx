import { QueryClient } from "@tanstack/react-query";
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FrogEmoji } from "./components/Frog";
import "./index.css";

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

function App() {
  return <StaticButton />;
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
