import { EdDSAFrogPCD, IFrogData, Rarity } from "@pcd/eddsa-frog-pcd";
import { DexFrog } from "@pcd/passport-interface";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { FrogsModal } from "./FrogsModal";
import Loader from "./Loader";
import { usePossibleFrogs } from "../hooks/useUserState";
import useFrogs from "../hooks/useFrogs";
import { FrogPOD } from "@frogcrypto/shared";
import React from "react";
import { List, LayoutGrid } from "lucide-react";

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
  const groupedPODs = useGroupedPODs(frogs || []);

  const [focusedFrogs, setFocusedFrogs] = useState<FrogPOD[]>([]);

  if (!possibleFrogs) {
    return <Loader />;
  }

  return (
    <>
      <div className="flex">
        <button
          className="btn"
          onClick={() => {
            const blob = new Blob([JSON.stringify(frogs)], {
              type: "application/json",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = `frogcrypto-${Date.now()}.json`;
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
          className="btn"
          onClick={(): void => setMode("list")}
          disabled={mode === "list"}
        >
          <List />
        </button>
        <button
          className="btn"
          onClick={(): void => setMode("grid")}
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

      {focusedFrogs.length > 0 && (
        <FrogsModal
          pods={focusedFrogs}
          onClose={(): void => setFocusedFrogs([])}
          color={RARITIES[focusedFrogs[0].rarity].color}
        />
      )}
    </>
  );
}

const DexList = ({
  possibleFrogs,
  pods,
  onClick,
}: {
  possibleFrogs: DexFrog[];
  pods: FrogsById;
  onClick: Dispatch<SetStateAction<FrogPOD[]>>;
}): JSX.Element => {
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
              onClick={(): void => onClick(frogPODs.pods)}
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
};

const DexGrid = ({
  possibleFrogs,
  pods,
  onClick,
}: {
  possibleFrogs: DexFrog[];
  pods: FrogsById;
  onClick: Dispatch<SetStateAction<FrogPOD[]>>;
}): JSX.Element => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {possibleFrogs.map(({ id, rarity }) => {
        const frogPODs = pods[id];

        if (!frogPODs) {
          return (
            <div key={id} className="flex flex-col items-center">
              <div
                className="w-full bg-gray-200 rounded-lg relative"
                style={{ paddingBottom: "66.666%" }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-gray-500">
                  ???
                </span>
                <img
                  src="/images/frogs/pixel_frog.png"
                  alt="Skeleton Frog"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 rounded-lg"
                  draggable={false}
                />
              </div>
              <span className="mt-2"></span>
            </div>
          );
        }

        return (
          <div key={id} className="flex flex-col items-center">
            <div
              className="w-full bg-green-600 text-white rounded-lg cursor-pointer flex flex-col items-stretch justify-center"
              style={{ borderColor: RARITIES[rarity].color }}
              onClick={(): void => onClick(frogPODs.pods)}
            >
              <span
                className="px-2 py-1 text-center truncate"
                title={frogPODs.frog.name}
              >
                {frogPODs.frog.name}
              </span>
              <img
                src={frogPODs.frog.imageUrl}
                alt={frogPODs.frog.name}
                className="w-full h-auto object-cover rounded-b-lg"
                draggable={false}
              />
            </div>
            <span className="mt-2">x{frogPODs.pods.length}</span>
          </div>
        );
      })}
    </div>
  );
};

type FrogsById = {
  [frogId: number]: {
    pods: FrogPOD[];
    /**
     * An arbitrary PCD for the frog.
     */
    frog: IFrogData;
  };
};

/**
 * Group PODs by frog ID.
 */
const useGroupedPODs = (pods: FrogPOD[]): FrogsById => {
  return useMemo(
    () =>
      pods.reduce<FrogsById>((acc, pod) => {
        if (!acc[pod.frogId]) {
          acc[pod.frogId] = {
            pods: [],
            frog: pod,
          };
        }
        acc[pod.frogId].pods.push(pod);
        return acc;
      }, {}),
    [pods]
  );
};
