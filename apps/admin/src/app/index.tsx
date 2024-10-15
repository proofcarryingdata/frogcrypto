import React, { useState } from "react";
import { Toaster } from "react-hot-toast";
import ManageFrog from "./ManageFrog";
import useAuth from "./useAuth";
import ManageFeed from "./ManageFeed";

function App(): JSX.Element {
  const { ready, semaphoreId } = useAuth();
  const [tab, setTab] = useState<"frog" | "feed">("frog");

  if (!ready) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-teal-600 text-white p-4">
        <h1 className="text-xl font-normal">FrogCrypto Pond Control</h1>
        <span className="text-xs">Semaphore ID: {String(semaphoreId)}</span>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
        <div className="flex gap-4">
          <button
            type="button"
            className={`${tab === "frog" ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-600"} px-4 py-2 rounded-md`}
            onClick={() => {
              setTab("frog");
            }}
          >
            Frogs
          </button>
          <button
            type="button"
            className={`${tab === "feed" ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-600"} px-4 py-2 rounded-md`}
            onClick={() => {
              setTab("feed");
            }}
          >
            Feeds
          </button>
        </div>

        {tab === "frog" ? <ManageFrog /> : null}
        {tab === "feed" ? <ManageFeed /> : null}
      </main>

      {/* Footer */}
      <footer className="bg-gray-200 text-gray-600 text-center p-3 text-sm">
        &copy; {new Date().getFullYear()} FrogCrypto. All rights reserved.
      </footer>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#363636",
            color: "#fff",
            borderRadius: "2px",
          },
        }}
      />
    </div>
  );
}

export default App;
