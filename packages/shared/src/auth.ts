import * as p from '@parcnet-js/podspec';
import { ticketProofRequest } from '@parcnet-js/ticket-spec';

import { shortCommitment, userPublicKeyToUserId } from './semaphore';

export { TicketSpec } from '@parcnet-js/ticket-spec';

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
    pod_type: { type: "string", value: POD_TYPE_FROGCRYPTO_PLAYER_ID },
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

export const DEVCON_7_TICKET_COLLECTION_ID = "Devcon 7";
export const DEVCON_7_SIGNER_PUBLIC_KEY =
  "YwahfUdUYehkGMaWh0+q3F8itx2h8mybjPmt8CmTJSs";
export const DEVCON_7_EVENT_ID = "5074edf5-f079-4099-b036-22223c0c6995";

export const TicketProofRequest = ticketProofRequest({
  classificationTuples: [
    {
      signerPublicKey: DEVCON_7_SIGNER_PUBLIC_KEY,
      eventId: DEVCON_7_EVENT_ID,
    },
  ],
  fieldsToReveal: {
    attendeeSemaphoreId: true,
    ticketId: true,
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
