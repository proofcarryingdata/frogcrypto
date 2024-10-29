import { FROGCRYPTO_FOLDER_NAME } from "@frogcrypto/shared";
import { podToPODData } from "@parcnet-js/podspec";
import { trpc } from "../trpc";
import { useParcnetClient } from "./useParcnetClient";

const useGetFrog = () => {
  const z = useParcnetClient();
  const utils = trpc.useUtils();

  return trpc.feeds.search.useMutation({
    onSuccess: async ({ pod }) => {
      const podData = podToPODData(pod);
      // FIXME: upstream bug where insert doesn't resolve
      void z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(podData);

      await utils.users.me.invalidate();
    },
    onError: async () => {
      await utils.users.me.invalidate();
    },
  });
};

export default useGetFrog;
