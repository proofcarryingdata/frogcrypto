import * as p from '@parcnet-js/podspec';
import { ticketProofRequest } from '@parcnet-js/ticket-spec';

import { shortCommitment, userPublicKeyToUserId } from './semaphore';

export const POD_TYPE_FROGCRYPTO_PLAYER_ID = "frogcrypto.playerId";

export const PlayerIDSpec = p.entries({
  pod_type: {
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
  proof: { type: "string" },
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
  proof,
}: {
  playerPk: string;
  device: string;
  location: string;
  proof: string;
}) => {
  const playerId = shortCommitment(userPublicKeyToUserId(playerPk));

  return PlayerIDSpec.parse({
    pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PLAYER_ID },
    playerPk: { type: "eddsa_pubkey", value: playerPk },
    device: { type: "string", value: device },
    timestamp: { type: "int", value: BigInt(Date.now()) },
    location: { type: "string", value: location },
    proof: { type: "string", value: proof },
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

export const TicketProofRequest = ticketProofRequest({
  classificationTuples: [
    {
      signerPublicKey: "YwahfUdUYehkGMaWh0+q3F8itx2h8mybjPmt8CmTJSs",
      eventId: "5074edf5-f079-4099-b036-22223c0c6995",
    },
  ],
  fieldsToReveal: {
    attendeeEmail: true,
  },
  externalNullifier: {
    type: "string",
    value: "FROGCRYPTO",
  },
  watermark: {
    type: "string",
    value: "FROGCRYPTO",
  },
});
