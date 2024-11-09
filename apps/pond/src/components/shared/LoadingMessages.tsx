import _ from "lodash";
import React, { useCallback, useEffect, useMemo, useState } from "react";

/**
 * Returns a random loading message that changes every 3 seconds.
 */
function LoadingMessages({ biome }: { biome: string }): JSX.Element {
  const messages = useMemo(
    () => [
      `Searching ${biome}...`,
      `Froggy radar scanning ${biome}...`,
      `Frogs, where are you?`,
      `Pond-ering where the frogs are hiding...`,
      `DID YOU KNOW? Frogs are amphibians!`,
      `DID YOU KNOW? You can only search the swamp once every 15 minutes.`,
      `Tip: Welcome to Summoner's Rift.`,
      `Tip: Try jumping.`,
      `Tip: Timing is everything. Wait for the gap, then hop to it!`,
      `Tip: Remember, rivers are trickier than they look. Watch out for those logs!`,
      `DID YOU KNOW? Frogs come in rarities: Common, Rare, Epic, Legendary, and Mythic.`,
      `DID YOU KNOW? Each Frog is a POD (Portable Object Data), with attributes securely signed by FrogCrypto, making them tamper-proof.`,
      `DID YOU KNOW? End-to-end encryption protects your FrogPODs. Remember, your password is key and cannot be reset; without it, recovery is impossible.`,
    ],
    [biome]
  );

  const [currentMessage, setCurrentMessage] = useState("");

  // Function to get a random message
  const getRandomMessage = useCallback(() => {
    setCurrentMessage(_.sample(messages) ?? "");
  }, [messages]);

  useEffect(() => {
    // Set the initial message
    getRandomMessage();
    // Change the message every 3 seconds
    const interval = setInterval(getRandomMessage, 3000);

    // Clean up interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [getRandomMessage]);

  return <>{currentMessage}</>;
}

export default LoadingMessages;
