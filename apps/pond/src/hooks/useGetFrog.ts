import { parseFrogPOD } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "../trpc";
import { QUERY_KEY_FROGS } from "./useFrogs";
import { useZupassAPI } from "./useZapp";

const useGetFrog = () => {
  const queryClient = useQueryClient();
  const z = useZupassAPI();
  const utils = trpc.useUtils();

  return trpc.feeds.search.useMutation({
    onSuccess: async (data) => {
      const pod = POD.deserialize(data.pod);
      await z.pod.insert(pod);

      // TODO: optimize
      await utils.users.me.refetch();

      queryClient.setQueryData([QUERY_KEY_FROGS], (frogs: POD[]) => {
        return [parseFrogPOD(pod), ...frogs];
      });

      return pod;
    },
    onError: async () => {
      await utils.users.me.invalidate();
    },
  });
};

export default useGetFrog;
