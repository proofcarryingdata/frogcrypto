import { type Zapp, type ParcnetAPI, connect } from "@parcnet-js/app-connector";
import { atomWithStorage } from "jotai/utils";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { DEFAULT_ZUPASS_URL } from "@frogcrypto/shared";
import { useAtom, useAtomValue } from "jotai";
import { setToken } from "../trpc";

enum EmbeddedZupassState {
  CONNECTING,
  CONNECTED,
}

const EmbeddedZupassContext = createContext<EmbeddedZupass>({
  state: EmbeddedZupassState.CONNECTING,
  ref: { current: null },
});

type EmbeddedZupass =
  | {
      state: EmbeddedZupassState.CONNECTING;
      ref: React.RefObject<HTMLDivElement>;
    }
  | {
      state: EmbeddedZupassState.CONNECTED;
      z: ParcnetAPI;
      ref: React.RefObject<HTMLDivElement>;
    };

const zupassUrlAtom = atomWithStorage("zupassUrl", DEFAULT_ZUPASS_URL);

export function EmbeddedZupassProvider({
  zapp,
  children,
}: {
  zapp: Zapp;
  children: React.ReactNode;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const zupassUrl = useAtomValue(zupassUrlAtom);

  const [value, setValue] = useState<EmbeddedZupass>({
    state: EmbeddedZupassState.CONNECTING,
    ref,
  });

  useEffect(() => {
    if (ref.current) {
      void connect(zapp, ref.current, zupassUrl).then((zupass) => {
        setValue({
          state: EmbeddedZupassState.CONNECTED,
          z: zupass,
          ref,
        });
      });
    }
  }, [zapp, zupassUrl]);

  return (
    <EmbeddedZupassContext.Provider value={value}>
      <div ref={ref} />
      {children}
    </EmbeddedZupassContext.Provider>
  );
}

export function useMaybeZupassAPI() {
  const context = useContext(EmbeddedZupassContext);
  return context.state === EmbeddedZupassState.CONNECTED ? context : null;
}

export function useZupassAPI() {
  const context = useContext(EmbeddedZupassContext);
  if (context.state === EmbeddedZupassState.CONNECTING) {
    throw new Error("Zupass is not connected");
  }

  return context.z;
}
