import React from "react";
import { Sparkles, Map } from "lucide-react";

function FrogNecklaceTeaser(): React.ReactElement {
  return (
    <div>
      <div className="flex items-center mb-4 justify-center">
        <Sparkles className="text-yellow-400 w-8 h-8 mr-2" />
        <h2 className="text-2xl font-bold text-green-800">
          The Pond Whispers...
        </h2>
        <Sparkles className="text-yellow-400 w-8 h-8 ml-2" />
      </div>

      <p className="text-green-700 mb-4">
        In the realm where frogs hop and lily pads float,
        <br />A treasure awaits, more precious than a golden coat.
      </p>

      <p className="text-green-700 mb-4">
        Seek the shop where amphibians reign,
        <br />A necklace of power, your profile to gain.
      </p>

      <p className="text-green-700 mb-6">
        With QR in hand, your journey begins anew,
        <br />
        The Frog Social awaits, with friends true and true.
      </p>

      <div className="flex justify-center">
        <button
          type="button"
          className="flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition duration-300"
        >
          <Map className="mr-2" />
          Find the FrogShop
        </button>
      </div>
    </div>
  );
}

export default FrogNecklaceTeaser;
