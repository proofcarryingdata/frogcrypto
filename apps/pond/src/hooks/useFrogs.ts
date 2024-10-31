import {
  FROGCRYPTO_FOLDER_NAME,
  type FrogPOD,
  FrogSpec,
  type IFrogData,
  parseFrogPOD,
  parseProfileFrogPOD,
  type ProfileFrogPOD,
} from "@frogcrypto/shared";
import { type Subscription } from "@parcnet-js/app-connector";
import { pod, podToPODData, type PODData } from "@parcnet-js/podspec";
import { atom, useAtom, useAtomValue } from "jotai";
import _ from "lodash";
import { useEffect, useMemo } from "react";
import { atomWithStorage, loadable } from "jotai/utils";
import { type JSONPOD, POD } from "@pcd/pod";
import { toast } from "react-hot-toast";
import { parcnetAPIAtom } from "./useParcnetClient";

const sortedFrogPODs = (frogs: PODData[]) => {
  return _.sortBy(frogs, (p) => {
    const timestampSigned = p.entries.timestampSigned?.value;
    if (typeof timestampSigned === "bigint") {
      return -timestampSigned;
    }
    return 0;
  });
};

const frogsSubscriptionAtom = atom<
  Promise<Subscription<typeof FrogSpec.schema> | undefined>
>(async (get) => {
  const z = get(parcnetAPIAtom);
  return z?.pod
    .collection(FROGCRYPTO_FOLDER_NAME)
    .subscribe(pod({ entries: FrogSpec.schema }));
});
const loadableFrogsSubscriptionAtom = loadable(frogsSubscriptionAtom);
const frogPODDataAtom = atomWithStorage<PODData[] | null>("frogPODData", null, {
  getItem(key, initialValue) {
    const storedValue = localStorage.getItem(key);
    if (!storedValue) {
      return initialValue;
    }

    try {
      return (JSON.parse(storedValue) as JSONPOD[])
        .map((v) => POD.fromJSON(v))
        .map((p) => podToPODData(p));
    } catch {
      return initialValue;
    }
  },
  setItem(key, value) {
    localStorage.setItem(
      key,
      JSON.stringify(
        value?.map((v) =>
          POD.load(v.entries, v.signature, v.signerPublicKey).toJSON()
        )
      )
    );
  },
  removeItem(key) {
    localStorage.removeItem(key);
  },
  subscribe(key, callback, initialValue) {
    if (
      typeof window === "undefined" ||
      typeof window.addEventListener === "undefined"
    ) {
      return () => {};
    }
    const listener = (e: StorageEvent) => {
      if (e.storageArea === localStorage && e.key === key) {
        let newValue;
        try {
          newValue = (JSON.parse(e.newValue ?? "") as JSONPOD[])
            .map((v) => POD.fromJSON(v))
            .map((p) => podToPODData(p));
        } catch {
          newValue = initialValue;
        }
        callback(newValue);
      }
    };
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("storage", listener);
    };
  },
});

export function useConnectFrogStore() {
  const value = useAtomValue(loadableFrogsSubscriptionAtom);
  const [_frogs, setFrogs] = useAtom(frogPODDataAtom);

  useEffect(() => {
    if (value.state === "hasError") {
      toast.error("Failed to connect to frog store");
      return;
    }
    if (value.state === "hasData") {
      value.data?.on("update", (data) => {
        setFrogs(sortedFrogPODs(data));
      });
    }
  }, [setFrogs, value]);
}

const suspendableFrogPODDataAtom = atom<Promise<PODData[]>>((get) => {
  const frogs = get(frogPODDataAtom);
  if (frogs) {
    return Promise.resolve(frogs);
  }
  return get(frogsSubscriptionAtom)
    .then((s) => s?.query() ?? [])
    .then(sortedFrogPODs);
});

const frogsAtom = atom<FrogPOD[] | Promise<FrogPOD[]>>(async (get) => {
  const frogs = await get(suspendableFrogPODDataAtom);
  return frogs.map(
    (p) => (p.entries.profileId && parseProfileFrogPOD(p)) || parseFrogPOD(p)
  );
});
function useFrogs() {
  return useAtomValue(frogsAtom);
}

export function isProfileFrogPOD(frog: IFrogData): frog is ProfileFrogPOD {
  return "profileId" in frog;
}

export const profileFrogsAtom = atom<Promise<ProfileFrogPOD[]>>(async (get) => {
  const frogs = await get(frogsAtom);
  return frogs.filter(isProfileFrogPOD);
});
export function useProfileFrogs() {
  return useAtomValue(profileFrogsAtom);
}

const Z_OPERATION_TIMEOUT = 2_000;
function withTimeout(promise: Promise<void> | undefined): Promise<void> {
  if (!promise) {
    return Promise.resolve();
  }
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, Z_OPERATION_TIMEOUT);
    }),
  ]);
}
export function useManageFrogs() {
  const z = useAtomValue(parcnetAPIAtom);

  return useMemo(() => {
    return {
      insert: async (data: PODData) =>
        withTimeout(z?.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(data)),
      delete: async (signature: string) =>
        withTimeout(
          z?.pod.collection(FROGCRYPTO_FOLDER_NAME).delete(signature)
        ),
    };
  }, [z]);
}

export default useFrogs;
