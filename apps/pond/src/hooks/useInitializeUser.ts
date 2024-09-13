import { GPCPCDArgs, GPCProofConfig } from "@pcd/gpc-pcd";
import { ArgumentTypeName } from "@pcd/pcd-types";
import { POD } from "@pcd/pod";
import { PODPCDPackage } from "@pcd/pod-pcd";
import { SemaphoreIdentityPCDPackage } from "@pcd/semaphore-identity-pcd";
import { Identity } from "@semaphore-protocol/identity";
import { useAtom } from "jotai";
import { useEffect } from "react";
import { POD_TYPE_FROGCRYPTO_PLAYER_ID, SERVER_URL } from "../constants";
import { useMaybeZupassAPI } from "./useZapp";
import { rootIdAtom, userIdentityAtom } from "./useUserState";
import { semaphoreIdToUserId, shortCommitment } from "../utils";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import p from "@pcd/podspec";
import { crypto } from "@zk-kit/utils";

const ID_GPC_CONFIG = JSON.stringify({
  pods: {
    id: {
      entries: {
        pod_type: {
          isRevealed: true,
        },
        owner: {
          isRevealed: true,
          // TODO: add this back in once semaphore v4 change released
          //   isOwnerID: true,
        },
      },
    },
  },
} satisfies GPCProofConfig);

const gpcArgs: GPCPCDArgs = {
  proofConfig: {
    argumentType: ArgumentTypeName.String,
    value: ID_GPC_CONFIG,
    userProvided: false,
  },
  pods: {
    argumentType: ArgumentTypeName.RecordContainer,
    value: {
      id: {
        argumentType: ArgumentTypeName.PCD,
        pcdType: PODPCDPackage.name,
        value: undefined,
        userProvided: true,
        displayName: "Player ID",
      },
    },
    validatorParams: {
      proofConfig: ID_GPC_CONFIG,
      membershipLists: undefined,
      prescribedEntries: undefined,
      prescribedSignerPublicKeys: undefined,
    },
  },
  identity: {
    argumentType: ArgumentTypeName.PCD,
    pcdType: SemaphoreIdentityPCDPackage.name,
    value: undefined,
    userProvided: true,
  },
  externalNullifier: {
    argumentType: ArgumentTypeName.String,
    value: undefined,
    userProvided: false,
  },
  membershipLists: {
    argumentType: ArgumentTypeName.String,
    value: undefined,
    userProvided: false,
  },
  // TODO: watermark should be a timestamp
  watermark: {
    argumentType: ArgumentTypeName.String,
    value: "watermark",
    userProvided: false,
  },
};

function useInitializeUser() {
  const [userIdentity, setUserIdentity] = useAtom(userIdentityAtom);
  const [rootId, setRootId] = useAtom(rootIdAtom);
  const zupassAPI = useMaybeZupassAPI();
  const enabled = !rootId && !!zupassAPI && !!userIdentity;

  useEffect(() => {
    if (!userIdentity) {
      setUserIdentity(
        semaphoreIdToUserId(new Identity(crypto.getRandomValues(32)))
      );
    }
  }, [userIdentity]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!zupassAPI || !userIdentity) return;

      const z = zupassAPI.z;
      const rootId = await z.identity.getIdentityCommitment();

      const q = p
        .pod({
          pod_type: p.string().list([POD_TYPE_FROGCRYPTO_PLAYER_ID]),
          owner: p.cryptographic().list([rootId]),
        })
        .signer(userIdentity.publicKey);
      const pods = await z.pod.query(q);
      if (pods.length === 0) {
        const shortID = shortCommitment(userIdentity.commitment);
        const pod = POD.sign(
          {
            pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PLAYER_ID },
            owner: { type: "cryptographic", value: rootId },
            zupass_title: {
              type: "string",
              value: `Player ID (${shortID})`,
            },
            zupass_description: {
              type: "string",
              value: `Ribbit! Frog ${shortID} croaks consent for FrogCrypto to use my lily pad identity in this ribbeting pond adventure!`,
            },
            zupass_display: { type: "string", value: "collectable" },
          },
          userIdentity.privateKey
        );
        await z.pod.insert(pod);
      }

      const gpc = await z.gpc.prove(gpcArgs);

      const res = await axios.post(`${SERVER_URL}/users/auth`, {
        gpc,
      });

      setRootId(rootId.toString());
    },
  });

  useEffect(() => {
    if (enabled) {
      mutate();
    }
  }, [enabled, mutate]);

  return !!rootId;
}

export default useInitializeUser;
