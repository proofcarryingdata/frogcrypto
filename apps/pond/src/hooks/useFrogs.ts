import { useQuery } from "@tanstack/react-query";
import p from "@pcd/podspec";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { parseFrogPOD, POD_TYPE_FROGCRYPTO_FROG } from "@frogcrypto/shared";
import _ from "lodash";
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
      z.pod
        .query(
          p.pod({
            podType: p.string().list([POD_TYPE_FROGCRYPTO_FROG]),
          })
        )
        .then((pods) =>
          _.sortBy(
            pods.map((pod) => parseFrogPOD(pod)),
            (frog) => -frog.timestampSigned
          )
        ),
  });

  useEffect(() => {
    if (error) {
      console.error(error);
      toast.error("Error fetching frogs");
    }
  }, [error]);

  return { frogs, isLoading };
};

export default useFrogs;
