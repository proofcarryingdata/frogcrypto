import React from "react";
import Auth from "./Auth";
import ManageFrog from "./ManageFrog";
import { Toaster } from "react-hot-toast";

function App(): JSX.Element {
  return (
    <div className="min-h-screen max-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-teal-600 text-white p-4">
        <h1 className="text-xl font-normal">FrogCrypto Pond Control</h1>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-y-auto flex flex-col gap-4">
        <Auth />
        <ManageFrog />
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
