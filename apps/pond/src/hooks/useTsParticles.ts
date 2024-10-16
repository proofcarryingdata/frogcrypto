import { tsParticles } from "@tsparticles/engine";
import { loadExternalTrailInteraction } from "@tsparticles/interaction-external-trail";
import { loadEmittersPlugin } from "@tsparticles/plugin-emitters";
import { loadTextShape } from "@tsparticles/shape-text";
import { loadSlim } from "@tsparticles/slim";
import { loadDestroyUpdater } from "@tsparticles/updater-destroy";
import { loadRollUpdater } from "@tsparticles/updater-roll";
import { loadWobbleUpdater } from "@tsparticles/updater-wobble";
import { useEffect, useState } from "react";

let loadPromise: Promise<void> | undefined;

function useTsParticles(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loadPromise) {
      return;
    }

    const load = async (): Promise<void> => {
      await loadSlim(tsParticles);
      await loadExternalTrailInteraction(tsParticles);
      await loadEmittersPlugin(tsParticles);
      await loadTextShape(tsParticles);
      await loadDestroyUpdater(tsParticles);
      await loadRollUpdater(tsParticles);
      await loadWobbleUpdater(tsParticles);
      setReady(true);
    };

    loadPromise = load();
  }, []);

  return ready;
}

export default useTsParticles;
