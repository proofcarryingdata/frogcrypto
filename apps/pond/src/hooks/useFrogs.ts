import {
  FrogSpec,
  logger,
  parseFrogPOD,
  parseProfileFrogPOD,
  type ProfileFrogPOD,
  ProfileFrogSpec,
} from "@frogcrypto/shared";
import { pod } from "@parcnet-js/podspec";
import { type IFrogData } from "@pcd/eddsa-frog-pcd";
import { useQuery } from "@tanstack/react-query";
import _ from "lodash";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useParcnetClient } from "./useParcnetClient";

export const QUERY_KEY_FROGS = "frogs";

const useFrogs = () => {
  const z = useParcnetClient();

  const {
    data: frogs,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY_FROGS],
    queryFn: () => z.pod.query(pod({ entries: FrogSpec.schema })),
    select: (data) => {
      localStorage.setItem(
        QUERY_KEY_FROGS,
        JSON.stringify(data.map((p) => p.serialize()))
      );

      return _.sortBy(
        data.map((p) => parseFrogPOD(p)),
        (frog) => -frog.timestampSigned
      );
    },
  });

  useEffect(() => {
    if (error) {
      logger.error(error);
      toast.error("Error fetching frogs");
    }
  }, [error]);

  return { frogs, isLoading };
};

export function isProfileFrogPOD(frog: IFrogData): frog is ProfileFrogPOD {
  return "profileId" in frog;
}

export const QUERY_KEY_PROFILE_FROGS = "profileFrogs";

export const useProfileFrogs = () => {
  const z = useParcnetClient();

  const {
    data: frogs,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEY_PROFILE_FROGS],
    queryFn: () => z.pod.query(pod({ entries: ProfileFrogSpec.schema })),
    select: (data) => {
      return _.sortBy(
        data.map((p) => parseProfileFrogPOD(p)),
        (frog) => -frog.timestampSigned
      );
    },
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
