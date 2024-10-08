import {
  FrogSpec,
  logger,
  parseFrogPOD,
  parseProfileFrogPOD,
  type ProfileFrogPOD,
  type IFrogData,
} from "@frogcrypto/shared";
import { pod } from "@parcnet-js/podspec";
import { type POD } from "@pcd/pod";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useParcnetClient } from "./useParcnetClient";

export const QUERY_KEY_FROGS = "frogs";

function useFrogPODs<TData = POD[]>(
  opts?: Omit<UseQueryOptions<POD[], Error, TData>, "queryKey" | "queryFn">
) {
  const z = useParcnetClient();

  return useQuery({
    queryKey: [QUERY_KEY_FROGS],
    queryFn: async () =>
      _.sortBy(await z.pod.query(pod({ entries: FrogSpec.schema })), (p) => {
        const timestampSigned = p.content.getRawValue("timestampSigned");
        if (typeof timestampSigned === "bigint") {
          return -timestampSigned;
        }
        return 0;
      }),
    ...opts,
  });
}

const useFrogs = () => {
  const res = useFrogPODs({
    select: (data) => {
      localStorage.setItem(
        QUERY_KEY_FROGS,
        JSON.stringify(data.map((p) => p.serialize()))
      );

      return data.map((p) =>
        p.content.getRawValue("profileId")
          ? parseProfileFrogPOD(p)
          : parseFrogPOD(p)
      );
    },
  });

  useEffect(() => {
    if (res.error) {
      logger.error(res.error);
      toast.error("Error fetching frogs");
    }
  }, [res.error]);

  return res;
};

export function isProfileFrogPOD(frog: IFrogData): frog is ProfileFrogPOD {
  return "profileId" in frog;
}

export const useProfileFrogs = <TData = ProfileFrogPOD[]>(
  opts?: Omit<
    UseQueryOptions<POD[], Error, TData>,
    "queryKey" | "queryFn" | "select"
  > & {
    select?: (data: ProfileFrogPOD[]) => TData;
  }
) => {
  const res = useFrogPODs({
    ...opts,
    select: (data): TData => {
      const pods = data
        .filter((p) => p.content.getRawValue("profileId"))
        .map((p) => parseProfileFrogPOD(p));

      const select = opts?.select ?? ((x): TData => x as TData);
      return select(pods);
    },
  });

  useEffect(() => {
    if (res.error) {
      logger.error(res.error);
      toast.error("Error fetching frogs");
    }
  }, [res.error]);

  return res;
};

export default useFrogs;
