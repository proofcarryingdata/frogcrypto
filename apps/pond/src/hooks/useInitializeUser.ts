import { PwtSpec } from "@frogcrypto/api/src/auth";
import {
  decompressBigInt,
  semaphoreIdToUserId,
  shortCommitment,
} from "@frogcrypto/shared";
import { type GPCPCDArgs, type GPCProofConfig } from "@pcd/gpc-pcd";
import { ArgumentTypeName } from "@pcd/pcd-types";
import { POD } from "@pcd/pod";
import { PODPCDPackage } from "@pcd/pod-pcd";
import p from "@pcd/podspec";
import { SemaphoreIdentityPCDPackage } from "@pcd/semaphore-identity-pcd";
import { Identity } from "@semaphore-protocol/identity";
import { useMutation } from "@tanstack/react-query";
import { crypto } from "@zk-kit/utils";
import axios from "axios";
import { produce } from "immer";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { POD_TYPE_FROGCRYPTO_PLAYER_ID, SERVER_URL } from "../constants";
import { setToken } from "../trpc";
import { rootIdAtom, userIdentityAtom } from "./useUserState";
import { useMaybeZupassAPI } from "./useZapp";

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
  const enabled = !rootId && Boolean(zupassAPI) && Boolean(userIdentity);

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
            device: { type: "string", value: window.navigator.userAgent },
            timestamp: { type: "int", value: BigInt(Date.now()) },
            location: { type: "string", value: window.location.href },
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

      const gpc = await z.gpc.prove(
        produce(gpcArgs, (args) => {
          if (!args.pods.validatorParams) {
            args.pods.validatorParams = {};
          }
          args.pods.validatorParams.prescribedSignerPublicKeys = {
            id: userIdentity.publicKey,
          };
        })
      );
      await axios.post(`${SERVER_URL}/users/auth`, {
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

  const [ready, setReady] = useState<boolean>(false);
  useEffect(() => {
    if (userIdentity && rootId) {
      const refreshToken = () => {
        setToken(
          POD.sign(
            PwtSpec.parse({
              aud: { type: "string", value: "frogcrypto" },
              exp: {
                type: "int",
                value: BigInt(Date.now() + 1000 * 60 * 60 * 24),
              },
              iss: {
                type: "cryptographic",
                value: decompressBigInt(userIdentity.commitment),
              },
              sub: { type: "cryptographic", value: BigInt(rootId) },
            }),
            userIdentity.privateKey
          ).serialize()
        );
      };
      const interval = setInterval(refreshToken, 1000 * 60 * 60);

      refreshToken();
      setReady(true);

      return () => {
        clearInterval(interval);
      };
    }
  }, [rootId, userIdentity]);

  return ready;
}

export default useInitializeUser;
