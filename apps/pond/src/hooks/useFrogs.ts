import { useQuery } from "@tanstack/react-query";
import { useZupassAPI } from "./useZapp";
import p from "@pcd/podspec";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { POD_TYPE_FROGCRYPTO_FROG } from "@frogcrypto/shared";

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
      z.pod.query(
        p.pod({
          pod_type: p.string().list([POD_TYPE_FROGCRYPTO_FROG]),
        })
      ),
  });

  useEffect(() => {
    if (error) {
      toast.error("Error fetching frogs");
    }
  }, [error]);

  return { frogs, isLoading };
};

export default useFrogs;
