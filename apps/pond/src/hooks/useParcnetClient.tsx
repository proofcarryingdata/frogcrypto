import {
  DEFAULT_ZUPASS_URL,
  DEVCON_7_TICKET_COLLECTION_ID,
  FROGCRYPTO_FOLDER_NAME,
} from "@frogcrypto/shared";
import type { ParcnetAPI, Zapp } from "@parcnet-js/app-connector";
import { connect, connectToHost } from "@parcnet-js/app-connector";
import { atom, useAtomValue } from "jotai";
import { atomWithStorage, loadable } from "jotai/utils";
import type { ReactNode } from "react";
import React, { createContext, useContext, useMemo, useRef } from "react";

enum ClientConnectionState {
  CONNECTING,
  CONNECTED,
}

const ParcnetClientContext = createContext<ClientState>({
  state: ClientConnectionState.CONNECTING,
  ref: null,
});

type ClientIframeState =
  | {
      state: ClientConnectionState.CONNECTING;
      ref: React.RefObject<HTMLDivElement> | null;
    }
  | {
      state: ClientConnectionState.CONNECTED;
      z: ParcnetAPI;
      ref: React.RefObject<HTMLDivElement>;
    };

type ClientState = ClientIframeState;

const zupassUrlAtom = atomWithStorage("zupassUrl", DEFAULT_ZUPASS_URL);

const ZAPP: Zapp = {
  name: "frogcrypto",
  permissions: {
    REQUEST_PROOF: {
      collections: ["Tickets", FROGCRYPTO_FOLDER_NAME],
    },
    SIGN_POD: {},
    READ_POD: {
      collections: [FROGCRYPTO_FOLDER_NAME, DEVCON_7_TICKET_COLLECTION_ID],
    },
    INSERT_POD: {
      collections: [FROGCRYPTO_FOLDER_NAME],
    },
    DELETE_POD: {
      collections: [FROGCRYPTO_FOLDER_NAME],
    },
    READ_PUBLIC_IDENTIFIERS: {},
  },
};

export const parcnetAPIAtom = atom<Promise<ParcnetAPI>>(async (get) => {
  const url = get(zupassUrlAtom);
  if (window.parent === window.self) {
    let container = document.getElementById("parcnet-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "parcnet-container";
      document.body.appendChild(container);
    }
    return connect(ZAPP, container, url);
  }
  return connectToHost(ZAPP);
});
export const loadableParcnetAPIAtom = loadable(parcnetAPIAtom);

export function ParcnetIframeProvider({
  children,
}: {
  children: React.ReactNode;
}): ReactNode {
  const loadableParcnetAPI = useAtomValue(loadableParcnetAPIAtom);
  const ref = useRef<HTMLDivElement>(null);
  const value = useMemo<ClientState>(() => {
    if (loadableParcnetAPI.state === "loading") {
      return {
        state: ClientConnectionState.CONNECTING,
        ref: null,
      };
    }
    if (loadableParcnetAPI.state === "hasError") {
      throw loadableParcnetAPI.error;
    }
    return {
      state: ClientConnectionState.CONNECTED,
      z: loadableParcnetAPI.data,
      ref,
    };
  }, [loadableParcnetAPI]);

  return (
    <ParcnetClientContext.Provider value={value}>
      <div ref={ref} />
      {children}
    </ParcnetClientContext.Provider>
  );
}

export function useParcnetClientConnected(): boolean {
  const context = useContext(ParcnetClientContext);
  return context.state === ClientConnectionState.CONNECTED;
}

export function useMaybeParcnetClient(): ParcnetAPI | undefined {
  const context = useContext(ParcnetClientContext);
  return context.state === ClientConnectionState.CONNECTED
    ? context.z
    : undefined;
}

export function useParcnetClient(): ParcnetAPI {
  const context = useContext(ParcnetClientContext);
  if (context.state !== ClientConnectionState.CONNECTED) {
    throw new Error("Parcnet client not connected");
  }
  return context.z;
}
