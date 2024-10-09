import { FROGCRYPTO_FOLDER_NAME } from "@frogcrypto/shared";
import { type PODData, podToPODData } from "@parcnet-js/podspec";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { QUERY_KEY_FROGS } from "./useFrogs";
import { useParcnetClient } from "./useParcnetClient";

const useGetFrog = () => {
  const queryClient = useQueryClient();
  const z = useParcnetClient();
  const utils = trpc.useUtils();

  return trpc.feeds.search.useMutation({
    onSuccess: async ({ pod }) => {
      const podData = podToPODData(pod);
      await z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(podData);

      queryClient.setQueryData(
        [QUERY_KEY_FROGS],
        (pods: PODData[]): PODData[] => {
          return pods.find((p) => p.signature === pod.signature)
            ? pods
            : [podData, ...pods];
        }
      );

      // TODO: optimize
      await utils.users.me.refetch();
    },
    onError: async () => {
      await utils.users.me.invalidate();
    },
  });
};

export default useGetFrog;
