import { FrogSpec, logger, parseFrogPOD } from "@frogcrypto/shared";
import { pod } from "@parcnet-js/podspec";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useZupassAPI } from "./useZapp";

export const QUERY_KEY_FROGS = "frogs";

const useFrogs = () => {
  const z = useZupassAPI();

  const {
    data: frogs,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY_FROGS],
    queryFn: () =>
      z.pod.query(pod({ entries: FrogSpec.schema })).then((pods) =>
        _.sortBy(
          pods.map((p) => parseFrogPOD(p)),
          (frog) => -frog.timestampSigned
        )
      ),
  });

  useEffect(() => {
    if (error) {
      logger.error(error);
      toast.error("Error fetching frogs");
    }
  }, [error]);

  return { frogs, isLoading };
};

export default useFrogs;
