import { parseFrogPOD } from "@frogcrypto/shared";
import { type POD } from "@pcd/pod";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { QUERY_KEY_FROGS } from "./useFrogs";
import { useZupassAPI } from "./useZapp";

const useGetFrog = () => {
  const queryClient = useQueryClient();
  const z = useZupassAPI();
  const utils = trpc.useUtils();

  return trpc.feeds.search.useMutation({
    onSuccess: async ({ pod }) => {
      await z.pod.insert(pod);

      // TODO: optimize
      await utils.users.me.refetch();

      queryClient.setQueryData([QUERY_KEY_FROGS], (pods: POD[]): POD[] => {
        return [pod, ...pods];
      });
    },
    onError: async () => {
      await utils.users.me.invalidate();
    },
  });
};

export default useGetFrog;
