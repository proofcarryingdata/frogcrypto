import { podToPODData } from "@parcnet-js/podspec";
import { trpc } from "../trpc";
import { useManageFrogs } from "./useFrogs";

const useGetFrog = () => {
  const frogs = useManageFrogs();
  const utils = trpc.useUtils();

  return trpc.feeds.search.useMutation({
    onSuccess: async ({ pod }) => {
      const podData = podToPODData(pod);

      await Promise.all([frogs.insert(podData), utils.users.me.invalidate()]);
    },
    onError: async () => {
      await utils.users.me.invalidate();
    },
  });
};

export default useGetFrog;
