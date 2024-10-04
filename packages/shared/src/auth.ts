import * as p from '@parcnet-js/podspec';

import { shortCommitment, userPublicKeyToUserId } from './semaphore';

export const POD_TYPE_FROGCRYPTO_PLAYER_ID = "frogcrypto.playerId";

export const PlayerIDSpec = p.entries({
  podType: {
    type: "string",
    isMemberOf: [
      {
        type: "string",
        value: POD_TYPE_FROGCRYPTO_PLAYER_ID,
      },
    ],
  },
  playerPk: { type: "eddsa_pubkey" },
  device: { type: "string" },
  timestamp: { type: "int" },
  location: { type: "string" },
  zupass_title: {
    type: "string",
  },
  zupass_description: {
    type: "string",
  },
  zupass_display: {
    type: "string",
    isMemberOf: [{ type: "string", value: "collectable" }],
  },
});

export const getPlayerIDEntries = ({
  playerPk,
  device,
  location,
}: {
  playerPk: string;
  device: string;
  location: string;
}) => {
  const playerId = shortCommitment(userPublicKeyToUserId(playerPk));

  return PlayerIDSpec.parse({
    podType: { type: "string", value: POD_TYPE_FROGCRYPTO_PLAYER_ID },
    playerPk: { type: "eddsa_pubkey", value: playerPk },
    device: { type: "string", value: device },
    timestamp: { type: "int", value: BigInt(Date.now()) },
    location: { type: "string", value: location },
    zupass_title: {
      type: "string",
      value: `Frog ID (${playerId})`,
    },
    zupass_description: {
      type: "string",
      value: `Ribbit! Frog ${playerId} croaks consent for FrogCrypto to use my lily pad identity in this ribbeting pond adventure!`,
    },
    zupass_display: { type: "string", value: "collectable" },
  });
};
