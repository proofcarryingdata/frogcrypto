import { useEffect, useState } from "react";
import { loadFull } from "tsparticles";
import { tsParticles } from "tsparticles-engine";

let loadPromise: Promise<void> | undefined;

function useTsParticles(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loadPromise) {
      return;
    }

    const load = async (): Promise<void> => {
      await loadFull(tsParticles);
      setReady(true);
    };

    loadPromise = load();
  }, []);

  return ready;
}

export default useTsParticles;
