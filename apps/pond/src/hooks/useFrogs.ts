import {
  FROGCRYPTO_FOLDER_NAME,
  type FrogPOD,
  FrogSpec,
  type IFrogData,
  parseFrogPOD,
  parseProfileFrogPOD,
  type ProfileFrogPOD,
} from "@frogcrypto/shared";
import { type ParcnetAPI, type Subscription } from "@parcnet-js/app-connector";
import { pod, podToPODData, type PODData } from "@parcnet-js/podspec";
import { atom, useAtom, useAtomValue } from "jotai";
import _ from "lodash";
import { useCallback, useEffect, useMemo } from "react";
import { atomWithStorage, loadable } from "jotai/utils";
import { type JSONPOD, POD } from "@pcd/pod";
import { toast } from "react-hot-toast";
import { loadableParcnetAPIAtom, parcnetAPIAtom } from "./useParcnetClient";

const frogsSubscriptionAtom = atom<
  Promise<Subscription<typeof FrogSpec.schema> | undefined>
>(async (get) => {
  const z = await get(parcnetAPIAtom);
  return z.pod
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

function reconcileFrogPODData(
  rawData: PODData[],
  z: ParcnetAPI | null
): PODData[] {
  // Sort by timestamp, newest first
  const sorted = _.sortBy(rawData, (p) => {
    const timestampSigned = p.entries.timestampSigned?.value;
    if (typeof timestampSigned === "bigint") {
      return -timestampSigned;
    }
    return 0;
  });

  // Keep track of seen profileIds to deduplicate profile frogs
  const seenProfileIds = new Set<string>();

  // Filter out older profile frog versions
  return sorted.filter((podData) => {
    const profileId = podData.entries.profileId?.value as string | undefined;

    // If not a profile frog, keep it
    if (!profileId) {
      return true;
    }

    // For profile frogs, only keep the first (newest) occurrence
    if (seenProfileIds.has(profileId)) {
      void z?.pod.collection(FROGCRYPTO_FOLDER_NAME).delete(podData.signature);
      return false;
    }

    seenProfileIds.add(profileId);
    return true;
  });
}

/**
 * Creates a function to reconcile frog POD data with the following rules:
 * 1. Sorts frogs by timestampSigned (newest first)
 * 2. For profile frogs (PODs with profileId), keeps only the latest version per profileId
 * 3. Compares with current store and updates only if the sorted, deduplicated data differs
 *
 * @returns A function that takes PODData[] and returns reconciled PODData[]
 */
function useReconcileFrogs(z: ParcnetAPI | null) {
  const [_frogs, setFrogs] = useAtom(frogPODDataAtom);

  return useCallback(
    (rawData: PODData[]) => {
      const deduplicated = reconcileFrogPODData(rawData, z);

      setFrogs((prev) => {
        if (!prev) {
          return deduplicated;
        }
        if (
          _.isEqualWith(prev, deduplicated, (a, b) => {
            if (
              typeof a === "object" &&
              typeof b === "object" &&
              "signature" in a &&
              "signature" in b
            ) {
              return a.signature === b.signature;
            }
            return undefined;
          })
        ) {
          return prev;
        }
        return deduplicated;
      });
    },
    [setFrogs, z]
  );
}

export function useConnectFrogStore() {
  const value = useAtomValue(loadableFrogsSubscriptionAtom);
  const z = useAtomValue(loadableParcnetAPIAtom);
  const reconcileFrogs = useReconcileFrogs(
    z.state === "hasData" ? z.data : null
  );

  useEffect(() => {
    if (value.state === "hasError") {
      toast.error("Failed to connect to frog store");
      return;
    }
    if (value.state === "hasData") {
      void value.data?.query().then(reconcileFrogs);
      value.data?.on("update", reconcileFrogs);
    }
  }, [reconcileFrogs, value]);
}

const suspendableFrogPODDataAtom = atom<Promise<PODData[]>>(async (get) => {
  const frogs = get(frogPODDataAtom);
  if (frogs) {
    return Promise.resolve(frogs);
  }
  const z = await get(parcnetAPIAtom);
  return get(frogsSubscriptionAtom)
    .then((s) => s?.query() ?? [])
    .then((rawData) => reconcileFrogPODData(rawData, z));
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

const Z_DEFAULT_TIMEOUT = 2_000;
function withTimeout(
  promise: Promise<void> | undefined,
  timeout: number = Z_DEFAULT_TIMEOUT
): Promise<void> {
  if (!promise) {
    return Promise.resolve();
  }
  return Promise.race([
    promise,
    new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve(undefined);
      }, timeout);
    }),
  ]);
}
export function useManageFrogs() {
  const z = useAtomValue(parcnetAPIAtom);
  const [_frogs, setFrogs] = useAtom(frogPODDataAtom);

  return useMemo(() => {
    return {
      insert: async (data: PODData) => {
        setFrogs((prev) => reconcileFrogPODData([...(prev ?? []), data], z));
        await withTimeout(
          z.pod.collection(FROGCRYPTO_FOLDER_NAME).insert(data)
        );
      },
      delete: async (signature: string) => {
        setFrogs((prev) =>
          reconcileFrogPODData(
            (prev ?? []).filter((p) => p.signature !== signature),
            z
          )
        );
        await withTimeout(
          z.pod.collection(FROGCRYPTO_FOLDER_NAME).delete(signature)
        );
      },
    };
  }, [setFrogs, z]);
}

export default useFrogs;
