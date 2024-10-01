import React from "react";

function UnderConstruction() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-green-100 rounded-lg shadow-md">
      <div className="text-6xl mb-4" role="img" aria-label="Construction Frog">
        🐸🚧
      </div>
      <h2 className="text-2xl font-bold text-green-800 mb-2">
        Ribbit! Under Construction
      </h2>
      <div className="flex items-center justify-center">
        <div
          className="animate-bounce text-4xl mr-2"
          role="img"
          aria-label="Lily Pad"
        >
          🍃
        </div>
        <div
          className="animate-bounce text-4xl ml-2 delay-100"
          role="img"
          aria-label="Water Droplet"
        >
          💧
        </div>
      </div>
      <p className="text-sm text-green-600 mt-4 italic">
        The Spirit of the Pond is working its magic. Check back soon!
      </p>
    </div>
  );
}

export default UnderConstruction;
