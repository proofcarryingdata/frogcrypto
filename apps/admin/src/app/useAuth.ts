import { POD_TYPE_FROGCRYPTO_PWT, PwtSpec } from "@frogcrypto/shared";
import { POD } from "@pcd/pod";
import { useQuery } from "@tanstack/react-query";
import { setToken } from "../trpc";
import { useMaybeParcnetClient } from "./useParcnetClient";

const useAuth = () => {
  const z = useMaybeParcnetClient();

  const { data: semaphoreId } = useQuery({
    queryKey: ["semaphoreId", Boolean(z)],
    queryFn: async () => {
      return z?.identity.getSemaphoreV4Commitment();
    },
    enabled: Boolean(z),
  });

  const { data: ready = false } = useQuery({
    queryKey: ["refreshToken", Boolean(z), String(semaphoreId)],
    queryFn: async () => {
      if (!z || !semaphoreId) {
        return false;
      }
      const pwt = await z.pod.sign(
        PwtSpec.parse({
          pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PWT },
          aud: { type: "string", value: "frogcrypto" },
          exp: {
            type: "int",
            value: BigInt(Date.now() + 1000 * 60 * 60 * 24),
          },
          iss: {
            type: "cryptographic",
            value: semaphoreId,
          },
          sub: { type: "cryptographic", value: semaphoreId },
        })
      );
      setToken(
        JSON.stringify(
          POD.load(pwt.entries, pwt.signature, pwt.signerPublicKey).toJSON()
        )
      );

      return true;
    },
    enabled: Boolean(z) && Boolean(semaphoreId),
    refetchInterval: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  return { ready, semaphoreId };
};

export default useAuth;
