import { type IFrogData, Rarity } from "@pcd/eddsa-frog-pcd";
import { type DexFrog } from "@pcd/passport-interface";
import React, {
  type Dispatch,
  type SetStateAction,
  useMemo,
  useState,
} from "react";
import { type FrogPOD } from "@frogcrypto/shared";
import { List, LayoutGrid } from "lucide-react";
import { usePossibleFrogs } from "../hooks/useUserState";
import useFrogs from "../hooks/useFrogs";
import { FrogsModal } from "./shared/FrogsModal";
import Loader from "./shared/Loader";

const RARITIES: Record<Rarity, { label: string; color: string }> = {
  [Rarity.Common]: {
    label: "NORM",
    color: "#2D9061",
  },
  [Rarity.Rare]: {
    label: "RARE",
    color: "#4595B2",
  },
  [Rarity.Epic]: {
    label: "EPIC",
    color: "#683EAA",
  },
  [Rarity.Legendary]: {
    label: "LGND",
    color: "#F19E38",
  },
  [Rarity.Mythic]: {
    label: "MYTH",
    color:
      "linear-gradient(261deg, #D1FFD3 2.82%, #EAF 39.21%, #5BFFFF 99.02%)",
  },
  [Rarity.Unknown]: {
    label: "UNKN",
    color: "#2D9061",
  },
  [Rarity.Object]: {
    label: "OBJT",
    color: "#2D9061",
  },
};

/**
 * The FrogeDex tab allows users to view their progress towards collecting all frogs.
 */
export function DexTab() {
  const [mode, setMode] = useState<"grid" | "list">("list");
  const { frogs } = useFrogs();
  const possibleFrogs = usePossibleFrogs();
  const groupedPODs = useGroupedPODs(frogs ?? []);

  const [focusedFrogs, setFocusedFrogs] = useState<FrogPOD[]>([]);

  if (!possibleFrogs) {
    return <Loader />;
  }

  return (
    <>
      <div className="flex">
        <button
          type="button"
          className="btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(frogs)], {
              type: "application/json",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `frogcrypto-${String(Date.now())}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
          }}
        >
          Export FrogPODs
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span>
          Owned: {Object.keys(groupedPODs).length.toString().padStart(3, "0")}
        </span>
        <button
          type="button"
          className="btn"
          onClick={(): void => {
            setMode("list");
          }}
          disabled={mode === "list"}
        >
          <List />
        </button>
        <button
          type="button"
          className="btn"
          onClick={(): void => {
            setMode("grid");
          }}
          disabled={mode === "grid"}
        >
          <LayoutGrid />
        </button>
      </div>
      {mode === "grid" && (
        <DexGrid
          possibleFrogs={possibleFrogs}
          pods={groupedPODs}
          onClick={setFocusedFrogs}
        />
      )}
      {mode === "list" && (
        <DexList
          possibleFrogs={possibleFrogs}
          pods={groupedPODs}
          onClick={setFocusedFrogs}
        />
      )}

      {focusedFrogs[0] ? (
        <FrogsModal
          pods={focusedFrogs}
          onClose={(): void => {
            setFocusedFrogs([]);
          }}
          color={RARITIES[focusedFrogs[0].rarity].color}
        />
      ) : null}
    </>
  );
}

function DexList({
  possibleFrogs,
  pods,
  onClick,
}: {
  possibleFrogs: DexFrog[];
  pods: FrogsById;
  onClick: Dispatch<SetStateAction<FrogPOD[]>>;
}): JSX.Element {
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <tbody className="bg-white divide-y divide-gray-200">
        {possibleFrogs.map(({ id, rarity }) => {
          const frogPODs = pods[id];

          if (!frogPODs) {
            return (
              <tr key={id}>
                <td className="px-4 py-2">{id}</td>
                <td className="px-4 py-2">
                  <div
                    className="px-2 py-1 border rounded text-center"
                    style={{
                      borderColor: RARITIES[rarity].color,
                      background: "rgba(45, 144, 97, 0.1)",
                    }}
                  >
                    {RARITIES[rarity].label}
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-500">???</td>
              </tr>
            );
          }

          return (
            <tr
              key={id}
              onClick={(): void => {
                onClick(frogPODs.pods);
              }}
              className="cursor-pointer hover:bg-gray-100"
            >
              <td className="px-4 py-2">{id}</td>
              <td className="px-4 py-2">
                <div
                  className="px-2 py-1 rounded text-center"
                  style={{
                    border: `1px solid ${RARITIES[rarity].color}`,
                    background: RARITIES[rarity].color,
                    color: "#fff",
                  }}
                >
                  {RARITIES[rarity].label}
                </div>
              </td>
              <td className="px-4 py-2">{frogPODs.frog.name}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function DexGrid({
  possibleFrogs,
  pods,
  onClick,
}: {
  possibleFrogs: DexFrog[];
  pods: FrogsById;
  onClick: Dispatch<SetStateAction<FrogPOD[]>>;
}): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-4">
      {possibleFrogs.map(({ id, rarity }) => {
        const frogPODs = pods[id];

        return (
          <div key={id} className="flex flex-col items-center bg-white">
            <div
              className="w-full text-white rounded-lg cursor-pointer flex flex-col items-stretch justify-center border"
              onClick={
                frogPODs
                  ? (): void => {
                      onClick(frogPODs.pods);
                    }
                  : undefined
              }
            >
              <span
                className="px-2 py-1 text-center truncate text-sm rounded-t-lg"
                style={{
                  background: RARITIES[rarity].color,
                }}
                title={frogPODs ? frogPODs.frog.name : "???"}
              >
                {frogPODs ? frogPODs.frog.name : "???"}
              </span>
              {frogPODs ? (
                <img
                  src={frogPODs.frog.imageUrl}
                  alt={frogPODs.frog.name}
                  className="w-full h-auto object-cover rounded-b-lg aspect-square"
                  draggable={false}
                />
              ) : (
                <img
                  src="/images/pixel_frog.png"
                  alt="???"
                  className="w-full h-auto object-cover rounded-b-lg aspect-square opacity-20"
                  draggable={false}
                />
              )}
            </div>
            {frogPODs ? (
              <span className="mt-2">x{frogPODs.pods.length}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

type FrogsById = Partial<
  Record<
    number,
    {
      pods: FrogPOD[];
      /**
       * An arbitrary PCD for the frog.
       */
      frog: IFrogData;
    }
  >
>;

/**
 * Group PODs by frog ID.
 */
const useGroupedPODs = (pods: FrogPOD[]): FrogsById => {
  return useMemo(
    () =>
      pods.reduce<FrogsById>((acc, pod) => {
        const entry = acc[pod.frogId] ?? { pods: [], frog: pod };
        entry.pods.push(pod);
        entry.frog = pod;
        acc[pod.frogId] = entry;
        return acc;
      }, {}),
    [pods]
  );
};
