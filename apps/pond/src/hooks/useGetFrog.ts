import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { POD_TYPE_FROGCRYPTO_REQUEST, SERVER_URL } from "../constants";
import { useAtom } from "jotai";
import { POD } from "@pcd/pod";
import { QUERY_KEY_USER, userIdentityAtom, useUserState } from "./useUserState";
import { decompressBigInt } from "../utils";
import { useZupassAPI } from "./useZapp";
import { QUERY_KEY_FROGS } from "./useFrogs";
import { parseFrogPOD } from "@frogcrypto/shared";

const useGetFrog = ({ feedId }: { feedId: string }) => {
  const [userIdentity] = useAtom(userIdentityAtom);
  const { refetch: refetchUserState } = useUserState();
  const queryClient = useQueryClient();
  const z = useZupassAPI();

  return useMutation({
    mutationKey: ["getFrog", feedId],
    mutationFn: async () => {
      if (!userIdentity) {
        throw new Error("User identity not found");
      }

      const { data } = await axios.post<{ pod: string }>(
        `${SERVER_URL}/feeds/${feedId}`,
        POD.sign(
          {
            pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_REQUEST },
            feedId: {
              type: "string",
              value: feedId,
            },
            owner: {
              type: "cryptographic",
              value: decompressBigInt(userIdentity.commitment),
            },
            watermark: {
              type: "int",
              value: BigInt(Date.now()),
            },
          },
          userIdentity.privateKey
        ).serialize(),
        {
          headers: {
            "Content-Type": "application/x.pod+json",
          },
        }
      );

      const pod = POD.deserialize(data.pod);
      await z.pod.insert(pod);

      // TODO: optimize
      await refetchUserState();

      return pod;
    },
    onSuccess: (pod) => {
      queryClient.setQueryData([QUERY_KEY_FROGS], (frogs: POD[]) => {
        return [parseFrogPOD(pod), ...frogs];
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY_USER] });
    },
  });
};

export default useGetFrog;
