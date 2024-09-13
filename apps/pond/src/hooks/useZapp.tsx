import { Zapp, ZupassAPIWrapper, connect } from "@pcd/zupass-client";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

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
      z: ZupassAPIWrapper;
      ref: React.RefObject<HTMLDivElement>;
    };

export function EmbeddedZupassProvider({
  zapp,
  zupassUrl,
  children,
}: {
  zapp: Zapp;
  zupassUrl: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const [value, setValue] = useState<EmbeddedZupass>({
    state: EmbeddedZupassState.CONNECTING,
    ref,
  });

  useEffect(() => {
    if (ref.current) {
      connect(zapp, ref.current, zupassUrl).then((zupass) => {
        setValue({
          state: EmbeddedZupassState.CONNECTED,
          z: zupass,
          ref,
        });
      });
    }
  }, []);

  return (
    <EmbeddedZupassContext.Provider value={value}>
      <div ref={ref}></div>
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
