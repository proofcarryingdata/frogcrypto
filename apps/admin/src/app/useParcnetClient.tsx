import { DEFAULT_ZUPASS_URL, FROGCRYPTO_FOLDER_NAME } from "@frogcrypto/shared";
import type { ParcnetAPI, Zapp } from "@parcnet-js/app-connector";
import { connect, connectToHost } from "@parcnet-js/app-connector";
import { useAtomValue } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { ReactNode } from "react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
  name: "frogcrypto:admin",
  permissions: {
    REQUEST_PROOF: {
      collections: ["Tickets", FROGCRYPTO_FOLDER_NAME],
    },
    SIGN_POD: {},
    READ_PUBLIC_IDENTIFIERS: {},
  },
};

export function ParcnetIframeProvider({
  children,
}: {
  children: React.ReactNode;
}): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const isMounted = useRef(false);
  const url = useAtomValue(zupassUrlAtom);

  const [value, setValue] = useState<ClientState>({
    state: ClientConnectionState.CONNECTING,
    ref,
  });

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
    } else {
      return;
    }

    if (window.parent === window.self) {
      if (ref.current) {
        void connect(ZAPP, ref.current, url).then((zupass) => {
          setValue({
            state: ClientConnectionState.CONNECTED,
            z: zupass,
            ref,
          });
        });
      }
    } else {
      void connectToHost(ZAPP).then((zupass) => {
        setValue({
          state: ClientConnectionState.CONNECTED,
          z: zupass,
          ref,
        });
      });
    }

    return () => {
      isMounted.current = false;
    };
  }, [url]);

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
